import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, requireAuth } from "@/lib/auth-guards";
import { dbConnect } from "@/lib/db";
import { Question } from "@/lib/models/questions";
import { Quiz } from "@/lib/models/quizzes";

const questionSchema = z.object({
   questionText: z.string().min(5),
   options: z.array(z.string()).length(4),
   correctIndex: z.number().min(0).max(3),
   explanation: z.string().optional(),
   order: z.number().optional(),
});

function serializeQuestion(question: typeof Question.prototype, includeAnswers: boolean) {
   return {
      id: question._id.toString(),
      quizId: question.quizId?.toString?.() ?? question.quizId,
      questionText: question.questionText,
      options: question.options,
      order: question.order ?? 0,
      ...(includeAnswers
         ? {
            correctIndex: question.correctIndex,
            explanation: question.explanation ?? "",
         }
         : {}),
   };
}

export async function GET(
   req: Request,
   { params }: { params: Promise<{ id: string }> }
) {
   const session = await requireAuth();
   if (session instanceof NextResponse) {
      return session;
   }

   const { id } = await params;
   await dbConnect();
   const quiz = await Quiz.findById(id);

   if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
   }

   if (session.role === "student" && !quiz.isPublished) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
   }

   const questions = await Question.find({ quizId: id }).sort({ order: 1, createdAt: 1 });
   const includeAnswers = session.role === "admin";

   return NextResponse.json(questions.map((question) => serializeQuestion(question, includeAnswers)));
}

export async function POST(
   req: Request,
   { params }: { params: Promise<{ id: string }> }
) {
   const session = await requireAdmin();
   if (session instanceof NextResponse) {
      return session;
   }

   const body = await req.json().catch(() => null);
   const parsed = questionSchema.safeParse(body);

   if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
   }

   const { id } = await params;
   await dbConnect();
   const quiz = await Quiz.findById(id);
   if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
   }

   const question = await Question.create({
      quizId: id,
      questionText: parsed.data.questionText,
      options: parsed.data.options,
      correctIndex: parsed.data.correctIndex,
      explanation: parsed.data.explanation,
      order: parsed.data.order ?? 0,
   });

   return NextResponse.json(serializeQuestion(question, true), { status: 201 });
}
