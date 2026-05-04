import mongoose, { Schema, type Document, type Model, Types } from "mongoose";

export interface IQuestion extends Document {
   quizId: Types.ObjectId;
   questionText: string;
   options: string[];
   correctIndex: number;
   explanation?: string;
   order: number;
}

const QuestionSchema = new Schema<IQuestion>(
   {
      quizId: { type: Schema.Types.ObjectId, ref: "Quiz", required: true },
      questionText: { type: String, required: true },
      options: {
         type: [String],
         required: true,
         validate: (value: string[]) => value.length === 4,
      },
      correctIndex: { type: Number, required: true, min: 0, max: 3 },
      explanation: { type: String },
      order: { type: Number, default: 0 },
   },
   { timestamps: true }
);

export const Question: Model<IQuestion> =
   mongoose.models.Question || mongoose.model<IQuestion>("Question", QuestionSchema);
