
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Incident, Service } from "@/lib/types";
import { format } from "date-fns";
import { de } from "date-fns/locale"; // Import German locale correctly
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface IncidentCardProps {
  incident: Incident;
  services: Service[];
}

const statusStyles = {
  investigating: "bg-destructive text-destructive-foreground",
  identified: "bg-amber-500 text-white",
  monitoring: "bg-blue-500 text-white",
  resolved: "bg-green-500 text-white",
};

const impactStyles = {
  none: "bg-secondary text-secondary-foreground",
  minor: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
  major: "bg-orange-500/20 text-orange-700 dark:text-orange-400",
  critical: "bg-red-500/20 text-red-700 dark:text-red-400",
};

// Translation map for incident status
const statusTranslations = {
  investigating: "Untersuchung",
  identified: "Identifiziert",
  monitoring: "Überwachung",
  resolved: "Gelöst",
};

// Translation map for impact levels
const impactTranslations = {
  none: "Keine",
  minor: "Geringfügig",
  major: "Erheblich",
  critical: "Kritisch",
};

export function IncidentCard({ incident, services }: IncidentCardProps) {
  // Find the services affected by this incident
  const affectedServices = services.filter(service => 
    incident.serviceIds.includes(service.id)
  );

  const lastUpdate = incident.updates.length > 0 
    ? incident.updates[incident.updates.length - 1] 
    : null;

  return (
    <Card className="service-transition">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-base">{incident.title}</CardTitle>
          <Badge className={cn("uppercase", statusStyles[incident.status])}>
            {statusTranslations[incident.status] || incident.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-2">
          <Badge className={cn(impactStyles[incident.impact])}>
            {impactTranslations[incident.impact] || incident.impact} Auswirkung
          </Badge>
          <span className="ml-2 text-xs text-muted-foreground">
            {format(new Date(incident.createdAt), "dd. MMM, HH:mm 'Uhr'", { locale: de })}
          </span>
        </div>
        
        {affectedServices.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1">
            {affectedServices.map(service => (
              <Badge key={service.id} variant="outline" className="text-xs">
                {service.name}
              </Badge>
            ))}
          </div>
        )}
        
        {lastUpdate && (
          <div className="mt-2 text-sm border-l-2 border-muted pl-3">
            <p className="text-muted-foreground">{lastUpdate.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {format(new Date(lastUpdate.createdAt), "dd. MMM, HH:mm 'Uhr'", { locale: de })}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
