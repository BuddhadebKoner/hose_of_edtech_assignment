"use client";

import Link from "next/link";
import { useStudentAuth } from "@/context/student-auth-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const features = [
   {
      title: "Create Quizzes Instantly",
      desc: "Admins can build quizzes with multiple-choice questions, time limits, and tags in minutes.",
      icon: (
         <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
      ),
   },
   {
      title: "AI-Powered Questions",
      desc: "Generate quiz questions automatically using AI. Just provide a topic and let the system do the rest.",
      icon: (
         <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z"/><circle cx="12" cy="15" r="2"/></svg>
      ),
   },
   {
      title: "Real-Time Results",
      desc: "Students get instant scores with detailed explanations for every question after submission.",
      icon: (
         <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      ),
   },
   {
      title: "Progress Tracking",
      desc: "View attempt history, accuracy stats, and best scores all in one profile dashboard.",
      icon: (
         <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
      ),
   },
   {
      title: "Admin Analytics",
      desc: "Admins can view all student attempts, publish/unpublish quizzes, and manage content.",
      icon: (
         <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
      ),
   },
   {
      title: "Timed Assessments",
      desc: "Set time limits for quizzes to simulate real exam conditions and build test-taking skills.",
      icon: (
         <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      ),
   },
];

const steps = [
   { num: "01", title: "Sign Up", desc: "Create your free student account in seconds." },
   { num: "02", title: "Browse Quizzes", desc: "Explore published quizzes across various topics." },
   { num: "03", title: "Take the Quiz", desc: "Answer questions within the time limit." },
   { num: "04", title: "Track Progress", desc: "View scores, accuracy, and attempt history." },
];

export default function HomePage() {
   const { student } = useStudentAuth();
   const { admin } = useAdminAuth();
   const isLoggedIn = !!student || !!admin;

   return (
      <div className="flex min-h-screen flex-col">
         <Navbar />

         {/* Hero */}
         <section className="relative overflow-hidden bg-gradient-to-br from-violet-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/30">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
               <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-violet-200/30 blur-3xl dark:bg-violet-900/20" />
               <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-900/20" />
            </div>
            <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32 lg:py-40">
               <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-semibold text-violet-700 dark:border-violet-800 dark:bg-violet-950/50 dark:text-violet-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                  House of EdTech Assignment
               </span>
               <h1 className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  Master Any Subject with{" "}
                  <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                     Interactive Quizzes
                  </span>
               </h1>
               <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                  A modern quiz platform where educators create engaging assessments and students track their learning journey — all powered by AI.
               </p>
               <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                  {isLoggedIn ? (
                     <Link
                        href={admin ? "/admin" : "/dashboard"}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-xl hover:brightness-110"
                        id="hero-cta-dashboard"
                     >
                        Go to {admin ? "Admin Panel" : "Dashboard"}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                     </Link>
                  ) : (
                     <>
                        <Link
                           href="/signup"
                           className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-200 hover:shadow-xl hover:brightness-110"
                           id="hero-cta-signup"
                        >
                           Get Started Free
                           <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </Link>
                        <Link
                           href="/login"
                           className="inline-flex items-center gap-2 rounded-xl border border-border px-8 py-3.5 text-sm font-semibold text-foreground transition-all duration-200 hover:bg-accent"
                           id="hero-cta-login"
                        >
                           Log in
                        </Link>
                     </>
                  )}
               </div>
               {/* Stats */}
               <div className="mt-16 grid grid-cols-3 gap-8 sm:gap-16">
                  {[
                     { val: "∞", label: "Quizzes to create" },
                     { val: "AI", label: "Powered questions" },
                     { val: "100%", label: "Free to use" },
                  ].map((s) => (
                     <div key={s.label} className="text-center">
                        <p className="text-2xl font-bold text-foreground sm:text-3xl">{s.val}</p>
                        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</p>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* Features */}
         <section className="bg-background py-20 sm:py-28" id="features">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
               <div className="text-center">
                  <span className="text-sm font-semibold uppercase tracking-wider text-violet-600">Features</span>
                  <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
                     Everything you need for assessments
                  </h2>
                  <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                     From quiz creation to analytics, our platform provides a complete toolkit for modern education.
                  </p>
               </div>
               <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {features.map((f) => (
                     <div
                        key={f.title}
                        className="group rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-500/5 dark:hover:border-violet-800"
                     >
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition-colors group-hover:bg-violet-600 group-hover:text-white dark:bg-violet-950/50 dark:text-violet-400 dark:group-hover:bg-violet-600">
                           {f.icon}
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* How It Works */}
         <section className="bg-muted/30 py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
               <div className="text-center">
                  <span className="text-sm font-semibold uppercase tracking-wider text-violet-600">How it works</span>
                  <h2 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
                     Start learning in 4 simple steps
                  </h2>
               </div>
               <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                  {steps.map((s) => (
                     <div key={s.num} className="relative text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-xl font-bold text-white shadow-lg shadow-violet-500/20">
                           {s.num}
                        </div>
                        <h3 className="mt-5 text-lg font-semibold text-foreground">{s.title}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* For Students & Admins */}
         <section className="bg-background py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
               <div className="grid gap-12 lg:grid-cols-2">
                  {/* Student */}
                  <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-violet-50 to-indigo-50 p-8 dark:from-violet-950/20 dark:to-indigo-950/20">
                     <span className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/50 dark:text-violet-300">
                        For Students
                     </span>
                     <h3 className="mt-4 text-2xl font-bold text-foreground">Your Learning Hub</h3>
                     <ul className="mt-6 space-y-3">
                        {["Browse & take published quizzes", "Instant scoring with explanations", "Track all your attempts & progress", "View best scores and accuracy stats", "Retake quizzes to improve"].map((item) => (
                           <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                              <svg className="mt-0.5 flex-shrink-0 text-violet-600" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              {item}
                           </li>
                        ))}
                     </ul>
                     <Link href="/signup" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700">
                        Create student account
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                     </Link>
                  </div>
                  {/* Admin */}
                  <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-slate-50 to-gray-50 p-8 dark:from-gray-900/50 dark:to-gray-800/30">
                     <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        For Admins
                     </span>
                     <h3 className="mt-4 text-2xl font-bold text-foreground">Complete Control</h3>
                     <ul className="mt-6 space-y-3">
                        {["Create & manage unlimited quizzes", "Add questions manually or with AI", "Publish/unpublish quizzes anytime", "View all student attempts & scores", "Full admin dashboard with stats"].map((item) => (
                           <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                              <svg className="mt-0.5 flex-shrink-0 text-slate-600 dark:text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              {item}
                           </li>
                        ))}
                     </ul>
                     <Link href="/admin" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                        Go to admin panel
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                     </Link>
                  </div>
               </div>
            </div>
         </section>

         {/* CTA */}
         <section className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 py-20">
            <div className="absolute inset-0 pointer-events-none">
               <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
               <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            </div>
            <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
               <h2 className="text-3xl font-bold text-white sm:text-4xl">
                  Ready to start your learning journey?
               </h2>
               <p className="mx-auto mt-4 max-w-xl text-lg text-violet-100">
                  Join QuizMaster today and take your first quiz. It&apos;s completely free.
               </p>
               <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <Link
                     href="/signup"
                     className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-violet-700 shadow-lg transition-all duration-200 hover:bg-violet-50 hover:shadow-xl"
                     id="cta-signup"
                  >
                     Sign up for free
                  </Link>
                  <Link
                     href="/login"
                     className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10"
                     id="cta-login"
                  >
                     Log in
                  </Link>
               </div>
            </div>
         </section>

         <Footer />
      </div>
   );
}
