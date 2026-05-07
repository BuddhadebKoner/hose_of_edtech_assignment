import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, requireStudent } from "@/lib/auth-guards";
import { dbConnect } from "@/lib/db";
import { Attempt } from "@/lib/models/attempts";
import { Question } from "@/lib/models/questions";
import { Quiz } from "@/lib/models/quizzes";

const attemptSchema = z.object({
   quizId: z.string(),
   answers: z.array(z.number()),
});

export async function GET(req: Request) {
   const session = await requireAdmin();
   if (session instanceof NextResponse) {
      return session;
   }

   const { searchParams } = new URL(req.url);
   const quizId = searchParams.get("quizId");

   if (!quizId) {
      return NextResponse.json({ error: "quizId is required" }, { status: 400 });
   }

   await dbConnect();
   const attempts = await Attempt.find({ quizId })
      .sort({ completedAt: -1 })
      .populate("userId", "name email")
      .populate("quizId", "title");

   return NextResponse.json(
      attempts.map((attempt) => {
         const quiz = attempt.quizId as unknown as { _id?: string; title?: string };
         const user = attempt.userId as unknown as {
            _id?: string;
            name?: string;
            email?: string;
         };

         return {
            id: attempt._id.toString(),
            quiz: {
               id: quiz?._id?.toString?.() ?? attempt.quizId?.toString?.(),
               title: quiz?.title ?? "Quiz",
            },
            user: {
               id: user?._id?.toString?.() ?? attempt.userId?.toString?.(),
               name: user?.name ?? "",
               email: user?.email ?? "",
            },
            score: attempt.score,
            totalQuestions: attempt.totalQuestions,
            percentage: attempt.percentage,
            completedAt: attempt.completedAt,
         };
      })
   );
}

export async function POST(req: Request) {
   const session = await requireStudent();
   if (session instanceof NextResponse) {
      return session;
   }

   const body = await req.json().catch(() => null);
   const parsed = attemptSchema.safeParse(body);

   if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
   }

   await dbConnect();
   const quiz = await Quiz.findById(parsed.data.quizId);

   if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
   }

   if (!quiz.isPublished) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
   }

   const questions = await Question.find({ quizId: parsed.data.quizId }).sort({
      order: 1,
      createdAt: 1,
   });

   if (questions.length === 0) {
      return NextResponse.json({ error: "Quiz has no questions" }, { status: 400 });
   }

   if (parsed.data.answers.length !== questions.length) {
      return NextResponse.json({ error: "Answer count mismatch" }, { status: 400 });
   }

   const score = questions.reduce((total, question, index) => {
      return parsed.data.answers[index] === question.correctIndex ? total + 1 : total;
   }, 0);

   const percentage = Math.round((score / questions.length) * 100);

   const attempt = await Attempt.create({
      quizId: parsed.data.quizId,
      userId: session.id,
      answers: parsed.data.answers,
      score,
      totalQuestions: questions.length,
      percentage,
      completedAt: new Date(),
   });

   return NextResponse.json(
      {
         id: attempt._id.toString(),
         score: attempt.score,
         totalQuestions: attempt.totalQuestions,
         percentage: attempt.percentage,
         completedAt: attempt.completedAt,
      },
      { status: 201 }
   );
}
