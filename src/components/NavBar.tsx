
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Bell, 
  LogOut, 
  Menu, 
  Settings as SettingsIcon, 
  Activity, 
  Clock, 
  CheckCircle, 
  Shield 
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function NavBar() {
  const location = useLocation();
  const { user, signOut, isAdmin } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;
  
  const navItems = [
    { name: "Status", path: "/", icon: <CheckCircle className="h-4 w-4 mr-2" /> },
    { name: "Vorfälle", path: "/incidents", icon: <Activity className="h-4 w-4 mr-2" /> },
    { name: "Verfügbarkeit", path: "/uptime", icon: <Clock className="h-4 w-4 mr-2" /> },
  ];

  const getUserInitials = () => {
    if (!user?.email) return "G";
    return user.email.substring(0, 1).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-8">
        <div className="flex items-center">
          <Link to="/" className="mr-6 flex items-center space-x-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary group-hover:shadow-md transition-all duration-300">
              <div className="h-3 w-3 rounded-full bg-primary-foreground animate-pulse" />
            </div>
            <span className="hidden font-bold text-lg sm:inline-block group-hover:text-primary transition-colors">
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
                        "rounded-full transition-colors hover:text-primary",
                        isActive(item.path) 
                          ? "bg-secondary text-primary font-medium" 
                          : "text-muted-foreground"
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
        
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          
          <SubscribeDialog 
            trigger={
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center gap-1 rounded-full hover:shadow-md transition-all"
              >
                <Bell className="h-4 w-4" />
                <span>Abonnieren</span>
              </Button>
            }
          />
          
          {user ? (
            <div className="flex items-center space-x-2">
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="rounded-full hover:bg-accent p-2">
                      <Avatar className="h-8 w-8 border-2 border-primary/30 hover:border-primary transition-all">
                        <AvatarFallback className="bg-secondary text-primary text-sm">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 mt-1">
                    <div className="px-2 py-1.5 text-sm font-medium text-center border-b">
                      {user.email}
                    </div>
                    <Link to="/settings">
                      <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                        <SettingsIcon className="h-4 w-4" />
                        <span>Einstellungen</span>
                      </DropdownMenuItem>
                    </Link>
                    {isAdmin && (
                      <Link to="/admin">
                        <DropdownMenuItem className="cursor-pointer flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>Administration</span>
                        </DropdownMenuItem>
                      </Link>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => signOut()}
                      className="cursor-pointer text-destructive focus:text-destructive flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Abmelden</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="hidden md:flex gap-2">
                <Link to="/admin">
                  {isAdmin && (
                    <Button variant="outline" size="sm" className="neo-button rounded-full">
                      <Shield className="h-4 w-4 mr-1" /> Admin
                    </Button>
                  )}
                </Link>
              </div>
            </div>
          ) : (
            <Link to="/login">
              <Button 
                variant="outline" 
                size="sm" 
                className="hidden md:flex neo-button rounded-full hover:shadow-md transition-all"
              >
                Anmelden
              </Button>
            </Link>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden hover:bg-accent rounded-full">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menü öffnen</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] sm:w-[350px] glass-panel border-l-4 border-primary">
              <div className="flex flex-col gap-4 mt-8">
                {user && (
                  <div className="flex items-center gap-3 px-3 py-3 mb-2 bg-secondary/50 rounded-lg">
                    <Avatar className="h-10 w-10 border-2 border-primary/30">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {isAdmin ? 'Administrator' : 'Benutzer'}
                      </p>
                    </div>
                  </div>
                )}
                
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "px-3 py-2 rounded-full transition-colors flex items-center",
                      isActive(item.path) 
                        ? "bg-secondary text-primary font-medium shadow-sm" 
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
                      className="flex items-center gap-2 px-3 py-2 rounded-full text-muted-foreground transition-colors hover:bg-accent/50"
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
                        "px-3 py-2 rounded-full transition-colors flex items-center gap-2",
                        isActive("/settings") 
                          ? "bg-secondary text-primary font-medium" 
                          : "text-muted-foreground hover:bg-accent/50"
                      )}
                    >
                      <SettingsIcon className="h-4 w-4" />
                      <span>Einstellungen</span>
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className={cn(
                          "px-3 py-2 rounded-full transition-colors flex items-center gap-2",
                          isActive("/admin") 
                            ? "bg-secondary text-primary font-medium" 
                            : "text-muted-foreground hover:bg-accent/50"
                        )}
                      >
                        <Shield className="h-4 w-4" />
                        <span>Administration</span>
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="flex items-center gap-2 px-3 py-2 rounded-full text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Abmelden</span>
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className={cn(
                      "px-3 py-2 rounded-full transition-colors",
                      isActive("/login") 
                        ? "bg-secondary text-primary font-medium" 
                        : "text-muted-foreground hover:bg-accent/50"
                    )}
                  >
                    Anmelden
                  </Link>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
