
import { NavBar } from "./NavBar";
import { Footer } from "./Footer";
import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <NavBar />
      <main className={cn("flex-1 container px-4 sm:px-8 py-8", className)}>
        <div className="page-transition">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
