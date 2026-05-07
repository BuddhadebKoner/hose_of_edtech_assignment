import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth-guards";
import { dbConnect } from "@/lib/db";
import { Question } from "@/lib/models/questions";

const questionUpdateSchema = z
   .object({
      questionText: z.string().min(5).optional(),
      options: z.array(z.string()).length(4).optional(),
      correctIndex: z.number().min(0).max(3).optional(),
      explanation: z.string().optional(),
      order: z.number().optional(),
   })
   .refine((data) => Object.keys(data).length > 0, {
      message: "No fields to update",
   });

export async function PUT(
   req: Request,
   { params }: { params: Promise<{ id: string; qid: string }> }
) {
   const session = await requireAdmin();
   if (session instanceof NextResponse) {
      return session;
   }

   const body = await req.json().catch(() => null);
   const parsed = questionUpdateSchema.safeParse(body);

   if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
   }

   const { id, qid } = await params;
   await dbConnect();
   const question = await Question.findOneAndUpdate(
      { _id: qid, quizId: id },
      parsed.data,
      { new: true }
   );

   if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
   }

   return NextResponse.json({
      id: question._id.toString(),
      quizId: question.quizId?.toString?.() ?? question.quizId,
      questionText: question.questionText,
      options: question.options,
      correctIndex: question.correctIndex,
      explanation: question.explanation ?? "",
      order: question.order ?? 0,
   });
}

export async function DELETE(
   req: Request,
   { params }: { params: Promise<{ id: string; qid: string }> }
) {
   const session = await requireAdmin();
   if (session instanceof NextResponse) {
      return session;
   }

   const { id, qid } = await params;
   await dbConnect();
   const question = await Question.findOneAndDelete({
      _id: qid,
      quizId: id,
   });

   if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
   }

   return NextResponse.json({ ok: true });
}
