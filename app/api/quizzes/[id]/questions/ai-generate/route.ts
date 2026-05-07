import { NextResponse } from "next/server";
import { z } from "zod";

import { generateAiQuestions } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth-guards";
import { dbConnect } from "@/lib/db";
import { Quiz } from "@/lib/models/quizzes";

const inputSchema = z.object({
   topic: z.string().min(3),
   count: z.number().min(1).max(10).default(5),
});

const outputSchema = z.array(
   z.object({
      questionText: z.string().min(5),
      options: z.array(z.string()).length(4),
      correctIndex: z.number().min(0).max(3),
      explanation: z.string().optional(),
   })
);

export async function POST(
   req: Request,
   { params }: { params: Promise<{ id: string }> }
) {
   const session = await requireAdmin();
   if (session instanceof NextResponse) {
      return session;
   }

   const body = await req.json().catch(() => null);
   const parsed = inputSchema.safeParse(body);

   if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
   }

   const { id } = await params;
   await dbConnect();
   const quiz = await Quiz.findById(id);
   if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
   }

   try {
      const raw = await generateAiQuestions(parsed.data.topic, parsed.data.count);
      const aiParsed = outputSchema.safeParse(raw);

      if (!aiParsed.success) {
         return NextResponse.json(
            { error: "AI response was not valid" },
            { status: 502 }
         );
      }

      return NextResponse.json(aiParsed.data);
   } catch (error) {
      const message = error instanceof Error ? error.message : "AI generation failed";
      return NextResponse.json({ error: message }, { status: 502 });
   }
}
