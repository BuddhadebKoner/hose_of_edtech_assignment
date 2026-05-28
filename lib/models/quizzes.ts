import mongoose, { Schema, type Document, type Model, Types } from "mongoose";

export interface IQuiz extends Document {
   title: string;
   description?: string;
   createdBy: Types.ObjectId;
   isPublished: boolean;
   timeLimit?: number;
   tags?: string[];
   questionLimit: number;
}

const QuizSchema = new Schema<IQuiz>(
   {
      title: { type: String, required: true, trim: true },
      description: { type: String },
      createdBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
      isPublished: { type: Boolean, default: false },
      timeLimit: { type: Number, default: 0 },
      tags: [{ type: String }],
      questionLimit: {
         type: Number,
         default: 10,
         min: 1,
         max: 30,
         validate: {
            validator: Number.isInteger,
            message: "Question limit must be an integer"
         }
      },
   },
   { timestamps: true }
);

export const Quiz: Model<IQuiz> =
   mongoose.models.Quiz || mongoose.model<IQuiz>("Quiz", QuizSchema);
