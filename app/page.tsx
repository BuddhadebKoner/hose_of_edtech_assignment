"use client";

import Link from "next/link";
import { useStudentAuth } from "@/context/student-auth-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function HomePage() {
   const { student } = useStudentAuth();
   const { admin } = useAdminAuth();
   const isLoggedIn = !!student || !!admin;

   return (
      <div className="flex min-h-screen flex-col">
         <Navbar />

         {/* Hero Section */}
         <section className="relative overflow-hidden" style={{ padding: '80px 0 64px' }}>
            {/* Subtle grid pattern */}
            <div
               className="absolute inset-0 z-0 pointer-events-none"
               style={{
                  backgroundImage: `
                     repeating-linear-gradient(
                        45deg,
                        oklch(0.54 0.175 292 / 0.04) 0,
                        oklch(0.54 0.175 292 / 0.04) 1px,
                        transparent 1px,
                        transparent 20px
                     ),
                     repeating-linear-gradient(
                        -45deg,
                        oklch(0.54 0.175 292 / 0.04) 0,
                        oklch(0.54 0.175 292 / 0.04) 1px,
                        transparent 1px,
                        transparent 20px
                     )
                  `,
                  backgroundSize: '40px 40px',
               }}
            />
            {/* Radial fade */}
            <div
               className="absolute inset-0 z-0 pointer-events-none"
               style={{
                  background: 'radial-gradient(ellipse 80% 70% at 50% 30%, var(--background) 50%, transparent 100%)',
               }}
            />
            <div className="relative z-10 mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8">
               <div className="grid gap-12 lg:grid-cols-[58%_42%] lg:gap-16">
                  {/* Left Column - Text */}
                  <div>
                     <span className="tag text-xs">Quiz Platform</span>
                     <h1 className="mt-6 font-display italic font-bold leading-[1.1] tracking-tight" style={{ fontSize: 'clamp(3rem, 6vw, 4.5rem)', letterSpacing: '-0.02em' }}>
                        <span className="block text-foreground">Test What</span>
                        <span className="block text-foreground">You Know.</span>
                        <span className="block text-purple-500">Prove It.</span>
                     </h1>
                     <p className="mt-5 max-w-[420px] text-lg text-foreground-muted">
                        A clean, focused quiz experience built for students who mean business.
                     </p>
                     <div className="mt-8 flex flex-wrap items-center gap-3">
                        {isLoggedIn ? (
                           <Link
                              href={admin ? "/admin" : "/dashboard"}
                              className="rounded-button bg-purple-500 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-purple-600 shadow-button"
                           >
                              Go to {admin ? "Admin Panel" : "Dashboard"}
                           </Link>
                        ) : (
                           <>
                              <Link
                                 href="/signup"
                                 className="rounded-button bg-purple-500 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-purple-600 shadow-button"
                              >
                                 Start Learning
                              </Link>
                              <Link
                                 href="/login"
                                 className="rounded-button border-[1.5px] border-border-strong bg-transparent px-6 py-3 text-sm font-medium text-foreground transition-all duration-200 hover:border-purple-400 hover:bg-purple-100"
                              >
                                 View Quizzes
                              </Link>
                           </>
                        )}
                     </div>
                     <p className="mt-6 text-xs text-foreground-faint">
                        2,400+ quizzes taken · No account needed to browse
                     </p>
                  </div>

                  {/* Right Column - Quiz Card Mockup */}
                  <div className="flex items-center justify-center">
                     <div className="surface-raised w-full max-w-sm p-6 transform rotate-2">
                        <h3 className="font-sans font-semibold text-foreground text-base">Introduction to JavaScript</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                           <span className="tag text-xs">Programming</span>
                           <span className="tag text-xs">Beginner</span>
                        </div>
                        <div className="mt-4 space-y-2">
                           <div className="h-3 bg-border rounded w-full"></div>
                           <div className="h-3 bg-border rounded w-5/6"></div>
                           <div className="h-3 bg-border rounded w-4/6"></div>
                        </div>
                        <div className="mt-6 flex items-center justify-between">
                           <div className="inline-flex items-center gap-2 rounded-tag bg-success-surface px-3 py-1.5 border border-success/20">
                              <span className="score-mono text-success text-lg font-medium">94%</span>
                           </div>
                           <button className="rounded-button bg-purple-500 px-4 py-2 text-xs font-medium text-white">
                              Start Quiz
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* Features Section */}
         <section className="bg-background py-16 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
               <div className="text-center mb-12">
                  <span className="text-sm font-semibold uppercase tracking-wider text-purple-600">Features</span>
                  <h2 className="mt-2 text-3xl font-sans font-semibold text-foreground">
                     Everything you need
                  </h2>
               </div>

               {/* Asymmetric Layout */}
               <div className="space-y-4">
                  {/* Row 1: Large + Small */}
                  <div className="grid gap-4 lg:grid-cols-3">
                     <div className="surface lg:col-span-2 p-8">
                        <h3 className="font-sans font-semibold text-foreground text-xl">AI-Powered Questions</h3>
                        <p className="mt-3 text-foreground-muted leading-relaxed">
                           Generate quiz questions automatically using AI. Just provide a topic and let the system create engaging, relevant questions in seconds.
                        </p>
                        <p className="mt-2 text-foreground-muted leading-relaxed">
                           Save time on content creation and focus on what matters — teaching and learning.
                        </p>
                     </div>
                     <div className="surface p-8 relative overflow-hidden">
                        <span className="absolute top-4 right-4 font-display text-[5rem] leading-none" style={{ color: 'var(--purple-200)' }}>01</span>
                        <h3 className="font-sans font-semibold text-foreground text-xl relative z-10">Instant Scoring</h3>
                     </div>
                  </div>

                  {/* Row 2: Small + Large */}
                  <div className="grid gap-4 lg:grid-cols-3">
                     <div className="surface p-8 relative overflow-hidden">
                        <span className="absolute top-4 right-4 font-display text-[5rem] leading-none" style={{ color: 'var(--purple-200)' }}>02</span>
                        <h3 className="font-sans font-semibold text-foreground text-xl relative z-10">Progress Tracking</h3>
                     </div>
                     <div className="surface lg:col-span-2 p-8">
                        <h3 className="font-sans font-semibold text-foreground text-xl">Real-Time Analytics</h3>
                        <p className="mt-3 text-foreground-muted leading-relaxed">
                           Track every attempt, view accuracy stats, and monitor improvement over time. Students see their best scores and can retake quizzes to improve.
                        </p>
                        <p className="mt-2 text-foreground-muted leading-relaxed">
                           Admins get complete visibility into student performance with detailed analytics dashboards.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* How It Works Section */}
         <section className="py-16 sm:py-20" style={{ background: 'oklch(0.94 0.030 292 / 0.3)' }}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
               <div className="rounded-section overflow-hidden" style={{ background: 'oklch(0.94 0.030 292 / 0.3)', padding: '40px 48px' }}>
                  <div className="grid gap-8 md:grid-cols-4">
                     <div className="text-center">
                        <div className="score-mono text-purple-400 text-2xl font-medium">01</div>
                        <h3 className="mt-3 font-sans font-semibold text-foreground">Sign Up</h3>
                        <p className="mt-2 text-sm text-foreground-muted">Create your account</p>
                     </div>
                     <div className="hidden md:flex items-center justify-center">
                        <div className="h-px w-full bg-border"></div>
                     </div>
                     <div className="text-center">
                        <div className="score-mono text-purple-400 text-2xl font-medium">02</div>
                        <h3 className="mt-3 font-sans font-semibold text-foreground">Browse Quizzes</h3>
                        <p className="mt-2 text-sm text-foreground-muted">Find your topic</p>
                     </div>
                     <div className="hidden md:flex items-center justify-center">
                        <div className="h-px w-full bg-border"></div>
                     </div>
                     <div className="text-center">
                        <div className="score-mono text-purple-400 text-2xl font-medium">03</div>
                        <h3 className="mt-3 font-sans font-semibold text-foreground">Take Quiz</h3>
                        <p className="mt-2 text-sm text-foreground-muted">Answer questions</p>
                     </div>
                     <div className="hidden md:flex items-center justify-center">
                        <div className="h-px w-full bg-border"></div>
                     </div>
                     <div className="text-center">
                        <div className="score-mono text-purple-400 text-2xl font-medium">04</div>
                        <h3 className="mt-3 font-sans font-semibold text-foreground">Track Progress</h3>
                        <p className="mt-2 text-sm text-foreground-muted">View your results</p>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* For Students Section */}
         <section className="bg-background py-16 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
               <div className="grid gap-12 lg:grid-cols-2">
                  {/* Left - Benefits */}
                  <div>
                     <h2 className="text-2xl font-sans font-semibold text-foreground">For Students</h2>
                     <ul className="mt-6 space-y-3">
                        {[
                           "Browse published quizzes across topics",
                           "Instant scoring with detailed explanations",
                           "Track all attempts and progress",
                           "Retake quizzes to improve scores"
                        ].map((item) => (
                           <li key={item} className="flex items-start gap-3 text-foreground-muted">
                              <span className="text-purple-500 mt-1">•</span>
                              <span>{item}</span>
                           </li>
                        ))}
                     </ul>
                  </div>

                  {/* Right - Stats Cluster */}
                  <div className="surface-raised p-8">
                     <div className="grid grid-cols-2 gap-6">
                        <div>
                           <div className="score-mono text-4xl font-medium text-foreground">2.4k</div>
                           <div className="mt-1 text-sm text-foreground-muted">Quizzes Taken</div>
                        </div>
                        <div>
                           <div className="score-mono text-4xl font-medium text-foreground">98%</div>
                           <div className="mt-1 text-sm text-foreground-muted">Satisfaction</div>
                        </div>
                        <div className="col-span-2">
                           <div className="score-mono text-4xl font-medium text-foreground">12min</div>
                           <div className="mt-1 text-sm text-foreground-muted">Average Duration</div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </section>

         {/* CTA Section */}
         <section className="mx-4 my-10 sm:mx-6 lg:mx-8">
            <div className="mx-auto max-w-7xl rounded-section overflow-hidden bg-purple-600 px-8 py-16 text-center">
               <h2 className="font-display italic text-3xl font-semibold text-white sm:text-4xl">
                  Ready to test yourself?
               </h2>
               <p className="mx-auto mt-4 max-w-xl text-lg" style={{ color: 'oklch(1 0 0 / 0.85)' }}>
                  Join QuizMaster today and start your learning journey.
               </p>
               <div className="mt-8">
                  <Link
                     href="/signup"
                     className="inline-flex items-center gap-2 rounded-button bg-white px-8 py-3.5 text-sm font-semibold text-purple-600 transition-all duration-200 hover:bg-purple-50"
                  >
                     Get Started Free
                  </Link>
               </div>
            </div>
         </section>

         <Footer />
      </div>
   );
}
