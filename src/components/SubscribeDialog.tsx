
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Bell, CheckCircle } from "lucide-react";

interface SubscribeDialogProps {
  trigger?: React.ReactNode;
}

export function SubscribeDialog({ trigger }: SubscribeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [preferences, setPreferences] = useState({
    incidents: true,
    maintenance: true,
    resolved: false,
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Ungültige E-Mail",
        description: "Bitte geben Sie eine gültige E-Mail-Adresse ein",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        
        toast({
          title: "Abonnement erfolgreich",
          description: "Sie erhalten nun Status-Updates",
        });
        
        // In a real implementation, you would save this to a database
        console.log("Subscription:", {
          email,
          preferences,
        });
      }, 1500);
    }, 1000);
  };

  const resetForm = () => {
    if (!isSuccess) {
      setEmail("");
      setPreferences({
        incidents: true,
        maintenance: true,
        resolved: false,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="items-center gap-1 hover:scale-105 transition-transform duration-200">
            <Bell className="h-4 w-4" />
            <span>Abonnieren</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] animate-scale-in">
        <DialogHeader>
          <DialogTitle className="text-xl">Status-Updates abonnieren</DialogTitle>
          <DialogDescription className="text-muted-foreground mt-2">
            Erhalten Sie Benachrichtigungen über Vorfälle und geplante Wartungen.
          </DialogDescription>
        </DialogHeader>
        
        {isSuccess ? (
          <div className="py-10 flex flex-col items-center justify-center space-y-4 animate-fade-in">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400 animate-scale-in" />
            </div>
            <h3 className="text-xl font-medium">Vielen Dank!</h3>
            <p className="text-center text-muted-foreground">
              Ihr Abonnement wurde erfolgreich eingerichtet. Sie werden in Kürze eine Bestätigungs-E-Mail erhalten.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4 animate-fade-in">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="col-span-4">
                  E-Mail-Adresse
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ihre@email.com"
                  className="col-span-4 transition-all duration-200 focus:ring-2 focus:ring-primary/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="col-span-4">Benachrichtigungseinstellungen</Label>
                <div className="flex items-center space-x-2 transition-all hover:bg-secondary/50 p-2 rounded-md">
                  <Checkbox 
                    id="incidents" 
                    checked={preferences.incidents}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, incidents: checked === true }))
                    }
                    className="data-[state=checked]:animate-pulse-status"
                  />
                  <Label htmlFor="incidents" className="cursor-pointer">Neue Vorfälle</Label>
                </div>
                <div className="flex items-center space-x-2 transition-all hover:bg-secondary/50 p-2 rounded-md">
                  <Checkbox 
                    id="maintenance" 
                    checked={preferences.maintenance}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, maintenance: checked === true }))
                    }
                    className="data-[state=checked]:animate-pulse-status"
                  />
                  <Label htmlFor="maintenance" className="cursor-pointer">Geplante Wartungen</Label>
                </div>
                <div className="flex items-center space-x-2 transition-all hover:bg-secondary/50 p-2 rounded-md">
                  <Checkbox 
                    id="resolved" 
                    checked={preferences.resolved}
                    onCheckedChange={(checked) => 
                      setPreferences(prev => ({ ...prev, resolved: checked === true }))
                    }
                    className="data-[state=checked]:animate-pulse-status"
                  />
                  <Label htmlFor="resolved" className="cursor-pointer">Gelöste Vorfälle</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isLoading} 
                className="w-full transition-all duration-300 hover:scale-105"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-current rounded-full"></span>
                    Abonniere...
                  </span>
                ) : "Abonnieren"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
