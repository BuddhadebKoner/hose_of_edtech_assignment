import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ISession extends Document {
   userId: mongoose.Types.ObjectId;
   role: "student" | "admin";
   sessionId: string;
   userAgent?: string;
   ip?: string;
   expiresAt: Date;
   isValid: boolean;
   createdAt: Date;
   updatedAt: Date;
}

const SessionSchema = new Schema<ISession>(
   {
      userId: { type: Schema.Types.ObjectId, required: true, index: true },
      role: { type: String, enum: ["student", "admin"], required: true },
      sessionId: { type: String, required: true, unique: true, index: true },
      userAgent: { type: String },
      ip: { type: String },
      expiresAt: { type: Date, required: true, index: true },
      isValid: { type: Boolean, default: true, index: true },
   },
   { timestamps: true }
);

// Compound index for efficient queries
SessionSchema.index({ userId: 1, role: 1, isValid: 1 });

// TTL index to automatically delete expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session: Model<ISession> =
   mongoose.models.Session || mongoose.model<ISession>("Session", SessionSchema);
