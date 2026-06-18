import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "node:crypto";

const previousAuthSecret = process.env.AUTH_SECRET;

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-at-least-16-chars-long";
});

afterAll(() => {
  if (previousAuthSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = previousAuthSecret;
});

// Import až po nastavení env (secret se čte líně, takže by stačilo i dřív).
const { sign, verify, verifyPkce, opaqueId, TokenError } = await import("./auth");

describe("sign/verify", () => {
  it("round-trip vrátí payload se správným purpose", () => {
    const token = sign({ sub: "a@b.cz" }, "access", 60);
    const payload = verify<{ sub: string }>(token, "access");
    expect(payload.sub).toBe("a@b.cz");
    expect(payload.purpose).toBe("access");
    expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("odmítne nesprávný purpose", () => {
    const token = sign({ sub: "a@b.cz" }, "access", 60);
    expect(() => verify(token, "code")).toThrow(TokenError);
  });

  it("odmítne zfalšovaný podpis", () => {
    const token = sign({ sub: "a@b.cz" }, "access", 60);
    const tampered = token.slice(0, -3) + "xyz";
    expect(() => verify(tampered, "access")).toThrow(TokenError);
  });

  it("odmítne pozměněný payload (podpis nesedí)", () => {
    const [h, , s] = sign({ sub: "a@b.cz" }, "access", 60).split(".");
    const evil = Buffer.from(JSON.stringify({ sub: "evil@x.cz", purpose: "access", iat: 1 })).toString("base64url");
    expect(() => verify(`${h}.${evil}.${s}`, "access")).toThrow(TokenError);
  });

  it("odmítne vypršelý token", () => {
    const token = sign({ sub: "a@b.cz" }, "access", -10); // exp v minulosti
    expect(() => verify(token, "access")).toThrow(/vypršel/);
  });

  it("odmítne nesmyslný formát", () => {
    expect(() => verify("not-a-jwt", "access")).toThrow(TokenError);
  });
});

describe("verifyPkce (S256)", () => {
  const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");

  it("přijme správný verifier", () => {
    expect(verifyPkce(verifier, challenge)).toBe(true);
  });

  it("odmítne špatný verifier", () => {
    expect(verifyPkce("wrong-verifier", challenge)).toBe(false);
  });
});

describe("opaqueId", () => {
  it("je stabilní, neprázdné a neobsahuje vstup", () => {
    const a = opaqueId("jan@nemocnice.cz");
    const b = opaqueId("jan@nemocnice.cz");
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(0);
    expect(a).not.toContain("jan@nemocnice.cz");
  });

  it("se liší pro různé vstupy", () => {
    expect(opaqueId("a@x.cz")).not.toBe(opaqueId("b@x.cz"));
  });
});
