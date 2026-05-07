import { NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth-guards";
import { dbConnect } from "@/lib/db";
import { Attempt } from "@/lib/models/attempts";
import { Question } from "@/lib/models/questions";
import { Quiz } from "@/lib/models/quizzes";

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
   const attempt = await Attempt.findById(id);

   if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
   }

   if (session.role === "student" && attempt.userId.toString() !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
   }

   const quiz = await Quiz.findById(attempt.quizId).select("title");
   const questions = await Question.find({ quizId: attempt.quizId }).sort({
      order: 1,
      createdAt: 1,
   });

   return NextResponse.json({
      id: attempt._id.toString(),
      quiz: {
         id: attempt.quizId.toString(),
         title: quiz?.title ?? "Quiz",
      },
      userId: attempt.userId.toString(),
      score: attempt.score,
      totalQuestions: attempt.totalQuestions,
      percentage: attempt.percentage,
      completedAt: attempt.completedAt,
      questions: questions.map((question, index) => ({
         id: question._id.toString(),
         questionText: question.questionText,
         options: question.options,
         correctIndex: question.correctIndex,
         explanation: question.explanation ?? "",
         userAnswer: attempt.answers[index] ?? null,
      })),
   });
}
