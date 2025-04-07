
import { Link } from "react-router-dom";
import { Github, Globe, Mail, MessageSquare } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t mt-12 bg-gradient-to-b from-secondary/20 to-background/80 backdrop-blur-sm">
      <div className="container px-4 py-8 sm:py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Branding and Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="h-9 w-9 flex items-center justify-center rounded-full bg-primary">
                <div className="h-3 w-3 rounded-full bg-primary-foreground animate-pulse"></div>
              </div>
              <span className="font-bold text-lg">Your Hoster Status</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Echtzeitüberwachung und Statusinformationen für alle Your Hoster Dienste und Anwendungen.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="hover:text-primary transition-colors" aria-label="GitHub">
                <Github size={18} />
              </a>
              <a href="#" className="hover:text-primary transition-colors" aria-label="Webseite">
                <Globe size={18} />
              </a>
              <a href="#" className="hover:text-primary transition-colors" aria-label="E-Mail">
                <Mail size={18} />
              </a>
              <a href="#" className="hover:text-primary transition-colors" aria-label="Discord">
                <MessageSquare size={18} />
              </a>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="md:col-span-1 grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-3 text-sm">Seiten</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Status
                  </Link>
                </li>
                <li>
                  <Link to="/incidents" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Vorfälle
                  </Link>
                </li>
                <li>
                  <Link to="/uptime" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Verfügbarkeit
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-sm">Rechtliches</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/impressum" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Impressum
                  </Link>
                </li>
                <li>
                  <Link to="/datenschutz" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Datenschutz
                  </Link>
                </li>
                <li>
                  <Link to="/nutzungsbedingungen" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Nutzungsbedingungen
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Newsletter Signup or Status Summary */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm">Aktueller Status</h3>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/30 border border-border/30">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <span className="text-sm">Alle Systeme funktionieren normal</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Abonniere Statusaktualisierungen, um immer auf dem Laufenden zu bleiben.
            </p>
          </div>
        </div>
        
        {/* Copyright */}
        <div className="border-t border-border/40 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} Your Hoster Status. Alle Rechte vorbehalten.
          </p>
          <p className="text-xs text-muted-foreground mt-2 sm:mt-0">
            Erstellt mit <span className="text-primary">♥</span> in Österreich
          </p>
        </div>
      </div>
    </footer>
  );
}
