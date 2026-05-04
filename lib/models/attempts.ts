import mongoose, { Schema, type Document, type Model, Types } from "mongoose";

export interface IAttempt extends Document {
   quizId: Types.ObjectId;
   userId: Types.ObjectId;
   answers: number[];
   score: number;
   totalQuestions: number;
   percentage: number;
   completedAt: Date;
}

const AttemptSchema = new Schema<IAttempt>(
   {
      quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      answers: [{ type: Number, required: true }],
      score: { type: Number, required: true },
      totalQuestions: { type: Number, required: true },
      percentage: { type: Number, required: true },
      completedAt: { type: Date, default: Date.now },
   },
   { timestamps: false }
);

AttemptSchema.index({ quizId: 1 });
AttemptSchema.index({ userId: 1 });

export const Attempt: Model<IAttempt> =
   mongoose.models.Attempt || mongoose.model<IAttempt>("Attempt", AttemptSchema);
