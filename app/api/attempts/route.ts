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
   questionIds: z.array(z.string()),
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

   // Validate that questionIds and answers have the same length
   if (parsed.data.answers.length !== parsed.data.questionIds.length) {
      return NextResponse.json({ error: "Answer count must match question count" }, { status: 400 });
   }

   // Fetch the specific questions that were presented to the student
   const questions = await Question.find({
      _id: { $in: parsed.data.questionIds },
      quizId: parsed.data.quizId
   });

   if (questions.length === 0) {
      return NextResponse.json({ error: "Quiz has no questions" }, { status: 400 });
   }

   if (questions.length !== parsed.data.questionIds.length) {
      return NextResponse.json({ error: "Invalid question IDs" }, { status: 400 });
   }

   // Create a map of question ID to question for efficient lookup
   const questionMap = new Map(questions.map(q => [q._id.toString(), q]));

   // Calculate score based on the order of questionIds submitted
   let score = 0;
   for (let i = 0; i < parsed.data.questionIds.length; i++) {
      const questionId = parsed.data.questionIds[i];
      const question = questionMap.get(questionId);

      if (question && parsed.data.answers[i] === question.correctIndex) {
         score++;
      }
   }

   const totalQuestions = parsed.data.questionIds.length;
   const percentage = Math.round((score / totalQuestions) * 100);

   const attempt = await Attempt.create({
      quizId: parsed.data.quizId,
      userId: session.id,
      answers: parsed.data.answers,
      score,
      totalQuestions,
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
