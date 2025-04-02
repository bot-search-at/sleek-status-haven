
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Bell, LogOut, Menu, Settings as SettingsIcon } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { SubscribeDialog } from "@/components/SubscribeDialog";
import { cn } from "@/lib/utils";

export function NavBar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { name: "Status", path: "/" },
    { name: "Vorfälle", path: "/incidents" },
    { name: "Verfügbarkeit", path: "/uptime" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
              <div className="h-3 w-3 rounded-full bg-primary-foreground" />
            </div>
            <span className="hidden font-bold sm:inline-block">Bot Search_AT Status</span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "transition-colors hover:text-primary",
                  isActive(item.path) ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          <SubscribeDialog 
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-1"
              >
                <Bell className="h-4 w-4" />
                <span>Abonnieren</span>
              </Button>
            }
          />
          
          {user ? (
            <div className="flex items-center space-x-2">
              <Link to="/settings">
                <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-1">
                  <SettingsIcon className="h-4 w-4" />
                  <span>Einstellungen</span>
                </Button>
              </Link>
              <Link to="/admin">
                <Button variant="outline" size="sm" className="hidden md:flex">Admin</Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden md:flex items-center gap-1"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
                <span>Abmelden</span>
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm" className="hidden md:flex">Anmelden</Button>
            </Link>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menü öffnen</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
              <nav className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "px-2 py-1 rounded-md transition-colors",
                      isActive(item.path) ? "bg-secondary text-primary" : "text-muted-foreground"
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
                <SubscribeDialog 
                  trigger={
                    <button 
                      className="flex items-center gap-2 px-2 py-1 rounded-md text-muted-foreground transition-colors hover:bg-secondary"
                    >
                      <Bell className="h-4 w-4" />
                      <span>Abonnieren</span>
                    </button>
                  }
                />
                {user ? (
                  <>
                    <Link
                      to="/settings"
                      className={cn(
                        "px-2 py-1 rounded-md transition-colors flex items-center gap-2",
                        isActive("/settings") ? "bg-secondary text-primary" : "text-muted-foreground"
                      )}
                    >
                      <SettingsIcon className="h-4 w-4" />
                      <span>Einstellungen</span>
                    </Link>
                    <Link
                      to="/admin"
                      className={cn(
                        "px-2 py-1 rounded-md transition-colors",
                        isActive("/admin") ? "bg-secondary text-primary" : "text-muted-foreground"
                      )}
                    >
                      Admin
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-2 px-2 py-1 rounded-md text-muted-foreground transition-colors hover:bg-secondary"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Abmelden</span>
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className={cn(
                      "px-2 py-1 rounded-md transition-colors",
                      isActive("/login") ? "bg-secondary text-primary" : "text-muted-foreground"
                    )}
                  >
                    Anmelden
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
