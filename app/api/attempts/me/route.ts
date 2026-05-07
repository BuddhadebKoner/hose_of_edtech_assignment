import { NextResponse } from "next/server";

import { requireStudent } from "@/lib/auth-guards";
import { dbConnect } from "@/lib/db";
import { Attempt } from "@/lib/models/attempts";

export async function GET() {
   const session = await requireStudent();
   if (session instanceof NextResponse) {
      return session;
   }

   await dbConnect();
   const attempts = await Attempt.find({ userId: session.id })
      .sort({ completedAt: -1 })
      .populate("quizId", "title");

   return NextResponse.json(
      attempts.map((attempt) => {
         const quiz = attempt.quizId as unknown as { _id?: string; title?: string };

         return {
            id: attempt._id.toString(),
            quiz: {
               id: quiz?._id?.toString?.() ?? attempt.quizId?.toString?.(),
               title: quiz?.title ?? "Quiz",
            },
            score: attempt.score,
            totalQuestions: attempt.totalQuestions,
            percentage: attempt.percentage,
            completedAt: attempt.completedAt,
         };
      })
   );
}
