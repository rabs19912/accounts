import { randomBytes } from "crypto";

export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export function getExpiresAt(hours = 24): Date {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
}
