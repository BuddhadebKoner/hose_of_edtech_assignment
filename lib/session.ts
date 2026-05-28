import mongoose from "mongoose";

import { Session } from "./models/session";

export type SessionRole = "student" | "admin";

export interface CreateSessionOptions {
   userId: string;
   role: SessionRole;
   userAgent?: string;
   ip?: string;
   expiresInDays?: number;
}

export interface SessionData {
   sessionId: string;
   userId: string;
   role: SessionRole;
   expiresAt: Date;
}

/**
 * Generate a cryptographically secure session ID using Web Crypto API
 * Compatible with Edge Runtime
 */
export function generateSessionId(): string {
   // Use Web Crypto API (available in Edge Runtime)
   const array = new Uint8Array(32);
   crypto.getRandomValues(array);
   return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Create a new session and invalidate all previous sessions for the user
 * This enforces single session per user
 */
export async function createSession(
   options: CreateSessionOptions
): Promise<SessionData> {
   const { userId, role, userAgent, ip, expiresInDays = 7 } = options;

   // Generate unique session ID
   const sessionId = generateSessionId();

   // Calculate expiration
   const expiresAt = new Date();
   expiresAt.setDate(expiresAt.getDate() + expiresInDays);

   // Invalidate all previous sessions for this user
   await Session.updateMany(
      {
         userId: new mongoose.Types.ObjectId(userId),
         role,
         isValid: true,
      },
      {
         $set: { isValid: false },
      }
   );

   // Create new session
   const session = await Session.create({
      userId: new mongoose.Types.ObjectId(userId),
      role,
      sessionId,
      userAgent,
      ip,
      expiresAt,
      isValid: true,
   });

   return {
      sessionId: session.sessionId,
      userId: userId,
      role: session.role,
      expiresAt: session.expiresAt,
   };
}

/**
 * Validate a session by sessionId
 * Returns session data if valid, null otherwise
 */
export async function validateSession(
   sessionId: string
): Promise<SessionData | null> {
   const session = await Session.findOne({
      sessionId,
      isValid: true,
      expiresAt: { $gt: new Date() },
   });

   if (!session) {
      return null;
   }

   return {
      sessionId: session.sessionId,
      userId: session.userId.toString(),
      role: session.role,
      expiresAt: session.expiresAt,
   };
}

/**
 * Invalidate a specific session
 */
export async function invalidateSession(sessionId: string): Promise<boolean> {
   const result = await Session.updateOne(
      { sessionId, isValid: true },
      { $set: { isValid: false } }
   );

   return result.modifiedCount > 0;
}

/**
 * Invalidate all sessions for a user
 */
export async function invalidateAllUserSessions(
   userId: string,
   role: SessionRole
): Promise<number> {
   const result = await Session.updateMany(
      {
         userId: new mongoose.Types.ObjectId(userId),
         role,
         isValid: true,
      },
      {
         $set: { isValid: false },
      }
   );

   return result.modifiedCount;
}

/**
 * Clean up expired sessions (optional, TTL index handles this automatically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
   const result = await Session.deleteMany({
      expiresAt: { $lt: new Date() },
   });

   return result.deletedCount;
}

/**
 * Get active session count for a user
 */
export async function getActiveSessionCount(
   userId: string,
   role: SessionRole
): Promise<number> {
   return Session.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      role,
      isValid: true,
      expiresAt: { $gt: new Date() },
   });
}
