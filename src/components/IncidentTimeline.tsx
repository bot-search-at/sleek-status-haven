
import { Incident, IncidentUpdate } from "@/lib/types";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface IncidentTimelineProps {
  incident: Incident;
}

const statusStyles = {
  investigating: "bg-destructive text-destructive-foreground",
  identified: "bg-amber-500 text-white",
  monitoring: "bg-blue-500 text-white",
  resolved: "bg-green-500 text-white",
};

// Translation map for incident status
const statusTranslations = {
  investigating: "Untersuchung",
  identified: "Identifiziert",
  monitoring: "Überwachung",
  resolved: "Gelöst",
};

export function IncidentTimeline({ incident }: IncidentTimelineProps) {
  // Sort updates chronologically
  const sortedUpdates = [...incident.updates].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="space-y-6 mt-6">
      {sortedUpdates.map((update, index) => (
        <div key={update.id} className="relative pl-6 pb-8">
          {/* Timeline line */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
          
          {/* Timeline dot */}
          <div className="absolute left-0 top-1 w-2 h-2 -ml-1 rounded-full bg-primary" />
          
          {/* Update content */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
              <Badge className={cn("w-fit uppercase mb-1 sm:mb-0", statusStyles[update.status])}>
                {statusTranslations[update.status] || update.status}
              </Badge>
              <time className="text-sm text-muted-foreground">
                {format(new Date(update.createdAt), "dd. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: de })}
              </time>
            </div>
            <p className="text-sm">{update.message}</p>
          </div>
          
          {/* Hide the line after the last item */}
          {index === sortedUpdates.length - 1 && (
            <div className="absolute left-0 bottom-0 w-px h-8 bg-background" />
          )}
        </div>
      ))}
    </div>
  );
}
