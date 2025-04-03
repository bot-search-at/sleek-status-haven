
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t mt-12 bg-secondary/30">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Bot Search_AT Status. Alle Rechte vorbehalten.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-primary transition-colors">
            Status
          </Link>
          <Link to="/incidents" className="hover:text-primary transition-colors">
            Vorfälle
          </Link>
          <Link to="/uptime" className="hover:text-primary transition-colors">
            Verfügbarkeit
          </Link>
        </div>
      </div>
    </footer>
  );
}
