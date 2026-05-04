import { SignJWT, jwtVerify } from "jose";

export type AuthRole = "admin" | "student";

export type AuthPayload = {
   userId: string;
   email: string;
   role: AuthRole;
};

const secret = process.env.JWT_SECRET;

if (!secret) {
   throw new Error("Missing JWT_SECRET in environment");
}

const key = new TextEncoder().encode(secret);

export const AUTH_COOKIE_NAME = "__quiz_token";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export async function signAccessToken(payload: AuthPayload) {
   return new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(key);
}

export async function verifyAccessToken(token: string) {
   const { payload } = await jwtVerify(token, key);
   return payload as AuthPayload;
}
