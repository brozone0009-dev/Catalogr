import crypto from "crypto";

export function createShareCode() {
  return crypto.randomBytes(6).toString("hex");
}
