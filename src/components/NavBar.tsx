
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Bell, ExternalLink, Menu } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function NavBar() {
  const location = useLocation();
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { name: "Status", path: "/" },
    { name: "Incident History", path: "/incidents" },
    { name: "Uptime", path: "/uptime" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
              <div className="h-3 w-3 rounded-full bg-primary-foreground" />
            </div>
            <span className="hidden font-bold sm:inline-block">Status Haven</span>
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
          
          <Button
            variant="outline"
            size="sm"
            className="hidden md:flex items-center gap-1"
            onClick={() => setIsSubscribeOpen(true)}
          >
            <Bell className="h-4 w-4" />
            <span>Subscribe</span>
          </Button>
          
          <Link to="/admin">
            <Button variant="outline" size="sm" className="hidden md:flex">Admin</Button>
          </Link>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
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
                <Link
                  to="/admin"
                  className={cn(
                    "px-2 py-1 rounded-md transition-colors",
                    isActive("/admin") ? "bg-secondary text-primary" : "text-muted-foreground"
                  )}
                >
                  Admin
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
