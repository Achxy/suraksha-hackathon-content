import crypto from "node:crypto";

const bytes = crypto.randomBytes(16);
const slug = bytes
  .toString("base64url")
  .replace(/=+$/, "");

console.log(slug);
