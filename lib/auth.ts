import { SignJWT, jwtVerify } from "jose";

export type AuthRole = "admin" | "student";

export type AuthPayload = {
   userId: string;
   email: string;
   role: AuthRole;
   sessionId: string;
};

const secret = process.env.JWT_SECRET;

if (!secret) {
   throw new Error("Missing JWT_SECRET in environment");
}

const key = new TextEncoder().encode(secret);

export const AUTH_COOKIE_NAME = "__quiz_token";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

/**
 * Sign a JWT access token with session information
 */
export async function signAccessToken(payload: AuthPayload): Promise<string> {
   return new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(key);
}

/**
 * Verify and decode a JWT access token
 * Note: This only verifies the JWT signature, NOT session validity
 * Always validate the session separately using validateSession()
 */
export async function verifyAccessToken(token: string): Promise<AuthPayload> {
   const { payload } = await jwtVerify(token, key);
   return payload as AuthPayload;
}

/**
 * Get secure cookie configuration
 */
export function getSecureCookieConfig() {
   return {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
      maxAge: AUTH_COOKIE_MAX_AGE,
   };
}

/**
 * Get cookie configuration for clearing/deleting cookies
 */
export function getClearCookieConfig() {
   return {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      path: "/",
      maxAge: 0,
   };
}
