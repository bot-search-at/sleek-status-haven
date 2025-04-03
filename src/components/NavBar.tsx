
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Bell, LogOut, Menu, Settings as SettingsIcon, Activity, Clock, CheckCircle } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { SubscribeDialog } from "@/components/SubscribeDialog";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export function NavBar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { name: "Status", path: "/", icon: <CheckCircle className="h-4 w-4 mr-2" /> },
    { name: "Vorfälle", path: "/incidents", icon: <Activity className="h-4 w-4 mr-2" /> },
    { name: "Verfügbarkeit", path: "/uptime", icon: <Clock className="h-4 w-4 mr-2" /> },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center">
          <Link to="/" className="mr-6 flex items-center space-x-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary group-hover:scale-110 transition-transform duration-300">
              <div className="h-3 w-3 rounded-full bg-primary-foreground" />
            </div>
            <span className="hidden font-bold sm:inline-block group-hover:text-primary transition-colors">
              Bot Search_AT Status
            </span>
          </Link>
          
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              {navItems.map((item) => (
                <NavigationMenuItem key={item.path}>
                  <Link to={item.path}>
                    <NavigationMenuLink
                      className={cn(
                        navigationMenuTriggerStyle(),
                        "transition-colors hover:text-primary",
                        isActive(item.path) ? "bg-secondary text-primary" : "text-muted-foreground"
                      )}
                    >
                      <div className="flex items-center">
                        {item.icon}
                        <span>{item.name}</span>
                      </div>
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          <SubscribeDialog 
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-1 hover-glow"
              >
                <Bell className="h-4 w-4" />
                <span>Abonnieren</span>
              </Button>
            }
          />
          
          {user ? (
            <div className="flex items-center space-x-2">
              <Link to="/settings">
                <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-1 hover:bg-accent">
                  <SettingsIcon className="h-4 w-4" />
                  <span>Einstellungen</span>
                </Button>
              </Link>
              <Link to="/admin">
                <Button variant="outline" size="sm" className="hidden md:flex neo-button">Admin</Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden md:flex items-center gap-1 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
                <span>Abmelden</span>
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm" className="hidden md:flex neo-button">Anmelden</Button>
            </Link>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden hover:bg-accent">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menü öffnen</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] sm:w-[350px] glass-panel border-l-4 border-primary">
              <nav className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "px-3 py-2 rounded-md transition-colors flex items-center",
                      isActive(item.path) 
                        ? "bg-secondary text-primary font-medium" 
                        : "text-muted-foreground hover:bg-accent/50"
                    )}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
                <div className="h-px w-full bg-border my-2"></div>
                <SubscribeDialog 
                  trigger={
                    <button 
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-muted-foreground transition-colors hover:bg-accent/50"
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
                        "px-3 py-2 rounded-md transition-colors flex items-center gap-2",
                        isActive("/settings") 
                          ? "bg-secondary text-primary font-medium" 
                          : "text-muted-foreground hover:bg-accent/50"
                      )}
                    >
                      <SettingsIcon className="h-4 w-4" />
                      <span>Einstellungen</span>
                    </Link>
                    <Link
                      to="/admin"
                      className={cn(
                        "px-3 py-2 rounded-md transition-colors flex items-center",
                        isActive("/admin") 
                          ? "bg-secondary text-primary font-medium" 
                          : "text-muted-foreground hover:bg-accent/50"
                      )}
                    >
                      <span className="ml-6">Admin</span>
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Abmelden</span>
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className={cn(
                      "px-3 py-2 rounded-md transition-colors",
                      isActive("/login") 
                        ? "bg-secondary text-primary font-medium" 
                        : "text-muted-foreground hover:bg-accent/50"
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
