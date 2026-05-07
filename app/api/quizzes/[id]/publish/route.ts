import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth-guards";
import { dbConnect } from "@/lib/db";
import { Quiz } from "@/lib/models/quizzes";

const publishSchema = z.object({
   isPublished: z.boolean().optional(),
});

export async function PATCH(
   req: Request,
   { params }: { params: Promise<{ id: string }> }
) {
   const session = await requireAdmin();
   if (session instanceof NextResponse) {
      return session;
   }

   const body = await req.json().catch(() => null);
   const parsed = publishSchema.safeParse(body ?? {});

   if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
   }

   const { id } = await params;
   await dbConnect();
   const quiz = await Quiz.findById(id);

   if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
   }

   quiz.isPublished = parsed.data.isPublished ?? !quiz.isPublished;
   await quiz.save();

   return NextResponse.json({ id: quiz._id.toString(), isPublished: quiz.isPublished });
}
