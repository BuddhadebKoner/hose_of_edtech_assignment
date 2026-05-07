import Link from "next/link";

export default function Footer() {
   const currentYear = new Date().getFullYear();

   return (
      <footer className="border-t border-border/40 bg-muted/30">
         <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-4">
               {/* Brand */}
               <div className="md:col-span-1">
                  <Link href="/" className="flex items-center gap-2.5 group">
                     <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                           <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                           <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                     </div>
                     <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                        QuizMaster
                     </span>
                  </Link>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                     The modern quiz platform built for educators and students. Create, share, and track assessments effortlessly.
                  </p>
               </div>

               {/* Platform */}
               <div>
                  <h4 className="mb-3 text-sm font-semibold text-foreground">Platform</h4>
                  <ul className="space-y-2">
                     <li>
                        <Link href="/dashboard" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                           Student Dashboard
                        </Link>
                     </li>
                     <li>
                        <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                           Take a Quiz
                        </Link>
                     </li>
                     <li>
                        <Link href="/profile" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                           My Profile
                        </Link>
                     </li>
                  </ul>
               </div>

               {/* Admin */}
               <div>
                  <h4 className="mb-3 text-sm font-semibold text-foreground">Administration</h4>
                  <ul className="space-y-2">
                     <li>
                        <Link href="/admin" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                           Admin Panel
                        </Link>
                     </li>
                     <li>
                        <Link href="/admin/quiz/new" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                           Create Quiz
                        </Link>
                     </li>
                  </ul>
               </div>

               {/* Account */}
               <div>
                  <h4 className="mb-3 text-sm font-semibold text-foreground">Account</h4>
                  <ul className="space-y-2">
                     <li>
                        <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                           Log in
                        </Link>
                     </li>
                     <li>
                        <Link href="/signup" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                           Sign up
                        </Link>
                     </li>
                  </ul>
               </div>
            </div>

            {/* Bottom */}
            <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-6 sm:flex-row">
               <p className="text-xs text-muted-foreground">
                  &copy; {currentYear} QuizMaster. All rights reserved.
               </p>
               <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground">
                     Built with Next.js &amp; MongoDB
                  </span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                  <span className="text-xs text-muted-foreground">
                     House of EdTech Assignment
                  </span>
               </div>
            </div>
         </div>
      </footer>
   );
}
