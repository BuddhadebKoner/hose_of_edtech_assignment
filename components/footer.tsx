import Link from "next/link";

export default function Footer() {
   const currentYear = new Date().getFullYear();

   return (
      <footer className="rounded-tl-section rounded-tr-section" style={{ background: 'var(--foreground)' }}>
         <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-3">
               {/* Brand */}
               <div className="md:col-span-1">
                  <Link href="/" className="flex items-center group">
                     <span className="font-display italic font-semibold text-white text-lg">
                        QuizMaster
                     </span>
                  </Link>
                  <p className="mt-3 text-sm leading-relaxed" style={{ color: 'oklch(0.72 0.006 285)' }}>
                     The modern quiz platform built for educators and students. Create, share, and track assessments effortlessly.
                  </p>
               </div>

               {/* Platform */}
               <div>
                  <h4 className="mb-3 text-sm font-semibold text-white">Platform</h4>
                  <ul className="space-y-2">
                     <li>
                        <Link href="/dashboard" className="text-sm transition-colors hover:text-white" style={{ color: 'oklch(0.72 0.006 285)' }}>
                           Student Dashboard
                        </Link>
                     </li>
                     <li>
                        <Link href="/login" className="text-sm transition-colors hover:text-white" style={{ color: 'oklch(0.72 0.006 285)' }}>
                           Take a Quiz
                        </Link>
                     </li>
                     <li>
                        <Link href="/profile" className="text-sm transition-colors hover:text-white" style={{ color: 'oklch(0.72 0.006 285)' }}>
                           My Profile
                        </Link>
                     </li>
                  </ul>
               </div>

               {/* Account */}
               <div>
                  <h4 className="mb-3 text-sm font-semibold text-white">Account</h4>
                  <ul className="space-y-2">
                     <li>
                        <Link href="/login" className="text-sm transition-colors hover:text-white" style={{ color: 'oklch(0.72 0.006 285)' }}>
                           Log in
                        </Link>
                     </li>
                     <li>
                        <Link href="/signup" className="text-sm transition-colors hover:text-white" style={{ color: 'oklch(0.72 0.006 285)' }}>
                           Sign up
                        </Link>
                     </li>
                  </ul>
               </div>
            </div>

            {/* Bottom */}
            <div className="mt-10 border-t pt-6 text-center" style={{ borderColor: 'oklch(0.72 0.006 285 / 0.2)' }}>
               <p className="text-xs" style={{ color: 'oklch(0.72 0.006 285)' }}>
                  &copy; {currentYear} QuizMaster
               </p>
            </div>
         </div>
      </footer>
   );
}
