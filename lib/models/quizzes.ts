import mongoose, { Schema, type Document, type Model, Types } from "mongoose";

export interface IQuiz extends Document {
   title: string;
   description?: string;
   createdBy: Types.ObjectId;
   isPublished: boolean;
   timeLimit?: number;
   tags?: string[];
}

const QuizSchema = new Schema<IQuiz>(
   {
      title: { type: String, required: true, trim: true },
      description: { type: String },
      createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
      isPublished: { type: Boolean, default: false },
      timeLimit: { type: Number, default: 0 },
      tags: [{ type: String }],
   },
   { timestamps: true }
);

export const Quiz: Model<IQuiz> =
   mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);
