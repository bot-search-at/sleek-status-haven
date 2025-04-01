
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
import { Bell } from "lucide-react";

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
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsOpen(false);
      
      toast({
        title: "Subscription successful",
        description: "You are now subscribed to status updates",
      });
      
      // In a real implementation, you would save this to a database
      console.log("Subscription:", {
        email,
        preferences,
      });
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="items-center gap-1">
            <Bell className="h-4 w-4" />
            <span>Subscribe</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Subscribe to Status Updates</DialogTitle>
          <DialogDescription>
            Get notified about service incidents and scheduled maintenance.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="col-span-4">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="col-span-4"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="col-span-4">Notification preferences</Label>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="incidents" 
                  checked={preferences.incidents}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, incidents: checked === true }))
                  }
                />
                <Label htmlFor="incidents" className="cursor-pointer">New incidents</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="maintenance" 
                  checked={preferences.maintenance}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, maintenance: checked === true }))
                  }
                />
                <Label htmlFor="maintenance" className="cursor-pointer">Scheduled maintenance</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="resolved" 
                  checked={preferences.resolved}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, resolved: checked === true }))
                  }
                />
                <Label htmlFor="resolved" className="cursor-pointer">Resolved incidents</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Subscribing..." : "Subscribe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
