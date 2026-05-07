import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, requireAuth } from "@/lib/auth-guards";
import { dbConnect } from "@/lib/db";
import { Quiz } from "@/lib/models/quizzes";

const quizSchema = z.object({
   title: z.string().min(3).max(100),
   description: z.string().optional(),
   timeLimit: z.number().min(0).optional(),
   tags: z.array(z.string()).optional(),
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
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
   }

   const tags = parsed.data.tags?.map((tag) => tag.trim()).filter(Boolean);

   await dbConnect();
   const quiz = await Quiz.create({
      title: parsed.data.title,
      description: parsed.data.description,
      timeLimit: parsed.data.timeLimit ?? 0,
      tags,
      createdBy: session.id,
   });

   return NextResponse.json(serializeQuiz(quiz), { status: 201 });
}
