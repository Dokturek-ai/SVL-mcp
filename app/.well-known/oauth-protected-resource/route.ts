import {
  protectedResourceHandler,
  metadataCorsOptionsRequestHandler,
} from "mcp-handler";
import { baseURL } from "@/baseUrl";

// OAuth 2.0 Protected Resource Metadata (RFC 9728).
// Hostitel z hlavičky WWW-Authenticate (kterou vrací withMcpAuth) zjistí tuto
// cestu, načte ji a z `authorization_servers` se dozví, kde běží OAuth.
const handler = protectedResourceHandler({
  authServerUrls: [baseURL],
  resourceUrl: `${baseURL}/mcp`,
});

export { handler as GET };
export const OPTIONS = metadataCorsOptionsRequestHandler();
