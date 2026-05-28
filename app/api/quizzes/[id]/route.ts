import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, requireAuth } from "@/lib/auth-guards";
import { dbConnect } from "@/lib/db";
import { Attempt } from "@/lib/models/attempts";
import { Question } from "@/lib/models/questions";
import { Quiz } from "@/lib/models/quizzes";

const quizUpdateSchema = z
   .object({
      title: z.string().min(3).max(100).optional(),
      description: z.string().optional(),
      timeLimit: z.number().min(0).optional(),
      tags: z.array(z.string()).optional(),
      isPublished: z.boolean().optional(),
      questionLimit: z.number()
         .int("Question limit must be a whole number")
         .min(1, "Question limit must be at least 1")
         .max(30, "Question limit cannot exceed 30")
         .optional(),
   })
   .refine((data) => Object.keys(data).length > 0, {
      message: "No fields to update",
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

   return NextResponse.json(serializeQuiz(quiz));
}

export async function PUT(
   req: Request,
   { params }: { params: Promise<{ id: string }> }
) {
   const session = await requireAdmin();
   if (session instanceof NextResponse) {
      return session;
   }

   const body = await req.json().catch(() => null);
   const parsed = quizUpdateSchema.safeParse(body);

   if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
   }

   const update = { ...parsed.data } as Record<string, unknown>;
   if (update.tags && Array.isArray(update.tags)) {
      update.tags = update.tags.map((tag) => tag.trim()).filter(Boolean);
   }

   const { id } = await params;
   await dbConnect();
   const quiz = await Quiz.findByIdAndUpdate(id, update, { new: true });

   if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
   }

   return NextResponse.json(serializeQuiz(quiz));
}

export async function DELETE(
   req: Request,
   { params }: { params: Promise<{ id: string }> }
) {
   const session = await requireAdmin();
   if (session instanceof NextResponse) {
      return session;
   }

   const { id } = await params;
   await dbConnect();
   const quiz = await Quiz.findById(id);

   if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
   }

   await Question.deleteMany({ quizId: id });
   await Attempt.deleteMany({ quizId: id });
   await Quiz.deleteOne({ _id: id });

   return NextResponse.json({ ok: true });
}
