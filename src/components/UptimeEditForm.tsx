
import { useState } from "react";
import { Service, UptimeDay } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UptimeEditFormProps {
  date: string;
  services: Service[];
  uptimeData: UptimeDay | null;
  onUptimeUpdated: () => void;
}

export function UptimeEditForm({ date, services, uptimeData, onUptimeUpdated }: UptimeEditFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [overallUptime, setOverallUptime] = useState(
    uptimeData?.uptime ? uptimeData.uptime.toString() : "100"
  );
  const [serviceUptimes, setServiceUptimes] = useState<Record<string, string>>(
    uptimeData?.services
      ? Object.fromEntries(
          Object.entries(uptimeData.services).map(([id, data]) => [
            id,
            data.uptime.toString(),
          ])
        )
      : Object.fromEntries(services.map((service) => [service.id, "100"]))
  );

  const handleServiceUptimeChange = (serviceId: string, value: string) => {
    setServiceUptimes((prev) => ({
      ...prev,
      [serviceId]: value,
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Prepare the data for submission
      const servicesData: Record<string, { uptime: number; incidents: string[] }> = {};
      
      services.forEach((service) => {
        const uptime = parseFloat(serviceUptimes[service.id] || "100");
        servicesData[service.id] = {
          uptime: isNaN(uptime) ? 100 : Math.min(Math.max(uptime, 0), 100),
          incidents: uptimeData?.services[service.id]?.incidents || [],
        };
      });

      const parsedOverallUptime = parseFloat(overallUptime);
      const finalOverallUptime = isNaN(parsedOverallUptime) 
        ? 100 
        : Math.min(Math.max(parsedOverallUptime, 0), 100);

      if (uptimeData) {
        // Update existing uptime data
        const { error } = await supabase
          .from("uptime_data")
          .update({
            uptime: finalOverallUptime,
            services: servicesData,
          })
          .eq("id", uptimeData.id);

        if (error) throw error;
      } else {
        // Create new uptime data
        const { error } = await supabase.from("uptime_data").insert({
          date: date,
          uptime: finalOverallUptime,
          services: servicesData,
        });

        if (error) throw error;
      }

      toast.success("Uptime data has been updated successfully");
      
      onUptimeUpdated();
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating uptime data:", error);
      toast.error("Failed to update uptime data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {uptimeData ? "Edit Uptime Data" : "Add Uptime Data"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{uptimeData ? "Edit" : "Add"} Uptime Data</DialogTitle>
          <DialogDescription>
            Update the uptime percentages for {new Date(date).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="overall-uptime" className="col-span-2">
              Overall Uptime %
            </Label>
            <Input
              id="overall-uptime"
              className="col-span-2"
              type="number"
              min="0"
              max="100"
              value={overallUptime}
              onChange={(e) => setOverallUptime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Services Uptime</h3>
            {services.map((service) => (
              <div key={service.id} className="grid grid-cols-4 items-center gap-4">
                <Label className="col-span-2">{service.name}</Label>
                <Input
                  className="col-span-2"
                  type="number"
                  min="0"
                  max="100"
                  value={serviceUptimes[service.id] || "100"}
                  onChange={(e) =>
                    handleServiceUptimeChange(service.id, e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
