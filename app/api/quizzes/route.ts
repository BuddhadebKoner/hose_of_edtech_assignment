import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, requireAuth } from "@/lib/auth-guards";
import { dbConnect } from "@/lib/db";
import { Quiz } from "@/lib/models/quizzes";

const quizSchema = z.object({
   title: z.string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must not exceed 100 characters")
      .transform(val => val.trim()),
   description: z.string()
      .max(500, "Description must not exceed 500 characters")
      .optional()
      .transform(val => val?.trim()),
   timeLimit: z.number()
      .int("Time limit must be a whole number")
      .min(0, "Time limit cannot be negative")
      .max(1440, "Time limit cannot exceed 1440 minutes (24 hours)")
      .optional(),
   tags: z.array(
      z.string()
         .max(30, "Each tag must not exceed 30 characters")
         .regex(/^[a-zA-Z0-9\s-]+$/, "Tags can only contain letters, numbers, spaces, and hyphens")
   )
      .max(10, "Maximum 10 tags allowed")
      .optional(),
   questionLimit: z.number()
      .int("Question limit must be a whole number")
      .min(1, "Question limit must be at least 1")
      .max(30, "Question limit cannot exceed 30")
      .optional()
      .default(10),
});

function serializeQuiz(quiz: typeof Quiz.prototype) {
   return {
      id: quiz._id.toString(),
      title: quiz.title,
      description: quiz.description ?? "",
      createdBy: quiz.createdBy?.toString?.() ?? quiz.createdBy,
      isPublished: quiz.isPublished,
      timeLimit: quiz.timeLimit ?? 0,
      tags: quiz.tags ?? [],
      questionLimit: quiz.questionLimit ?? 10,
      createdAt: quiz.createdAt ?? null,
      updatedAt: quiz.updatedAt ?? null,
   };
}

export async function GET() {
   const session = await requireAuth();
   if (session instanceof NextResponse) {
      return session;
   }

   await dbConnect();
   const filter = session.role === "student" ? { isPublished: true } : {};
   const quizzes = await Quiz.find(filter).sort({ createdAt: -1 });

   return NextResponse.json(quizzes.map(serializeQuiz));
}

export async function POST(req: Request) {
   const session = await requireAdmin();
   if (session instanceof NextResponse) {
      return session;
   }

   const body = await req.json().catch(() => null);
   const parsed = quizSchema.safeParse(body);

   if (!parsed.success) {
      const firstError = parsed.error.issues[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
   }

   const tags = parsed.data.tags?.map((tag) => tag.trim()).filter(Boolean);

   await dbConnect();
   const quiz = await Quiz.create({
      title: parsed.data.title,
      description: parsed.data.description,
      timeLimit: parsed.data.timeLimit ?? 0,
      tags,
      questionLimit: parsed.data.questionLimit ?? 10,
      createdBy: session.id,
   });

   return NextResponse.json(serializeQuiz(quiz), { status: 201 });
}
