import { NextRequest } from "next/server";
import { env } from "@/config/env";

export function verifyBasicAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader) return false;

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString();
  const [username, password] = credentials.split(":");

  return (
    username === env.BASIC_AUTH_USERNAME &&
    password === env.BASIC_AUTH_PASSWORD
  );
}