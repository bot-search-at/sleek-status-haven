
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
import { toast } from "@/hooks/use-toast";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SubscribeDialogProps {
  trigger?: React.ReactNode;
}

export function SubscribeDialog({ trigger }: SubscribeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    incidents: true,
    maintenance: true,
    resolved: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast.error("Bitte geben Sie eine gültige E-Mail-Adresse ein");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real implementation, you would save this to a database
      console.log("Subscription:", {
        email,
        preferences,
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsOpen(false);
      toast.success("Sie haben sich erfolgreich für Status-Updates angemeldet");
    } catch (error) {
      console.error("Subscription error:", error);
      toast.error("Fehler bei der Anmeldung. Bitte versuchen Sie es später erneut.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="items-center gap-1">
            <Bell className="h-4 w-4" />
            <span>Updates abonnieren</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Status-Updates abonnieren</DialogTitle>
          <DialogDescription>
            Erhalten Sie Benachrichtigungen über Vorfälle und geplante Wartungen.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="col-span-4">
                E-Mail-Adresse
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="ihre@email.com"
                className="col-span-4"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="col-span-4">Benachrichtigungseinstellungen</Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="incidents" 
                  checked={preferences.incidents}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, incidents: checked === true }))
                  }
                />
                <Label htmlFor="incidents" className="cursor-pointer">Neue Vorfälle</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="maintenance" 
                  checked={preferences.maintenance}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, maintenance: checked === true }))
                  }
                />
                <Label htmlFor="maintenance" className="cursor-pointer">Geplante Wartung</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="resolved" 
                  checked={preferences.resolved}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, resolved: checked === true }))
                  }
                />
                <Label htmlFor="resolved" className="cursor-pointer">Gelöste Vorfälle</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Wird abonniert..." : "Abonnieren"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
