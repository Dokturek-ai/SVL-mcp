import { describe, it, expect, beforeAll } from "vitest";
import crypto from "node:crypto";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-at-least-16-chars-long";
});

// Import až po nastavení env (secret se čte líně, takže by stačilo i dřív).
const { sign, verify, verifyPkce, TokenError } = await import("./auth");

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
