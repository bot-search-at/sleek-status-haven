
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Service } from "@/lib/types";
import { StatusDot } from "./StatusDot";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const { toast } = useToast();

  return (
    <Link 
      to={`/service/${service.id}`}
      onMouseEnter={() => {
        const audio = new Audio('/hover.mp3');
        audio.volume = 0.1;
        audio.play().catch(() => {});
      }}
    >
      <Card 
        className="overflow-hidden hover:cursor-pointer transition-all duration-500 hover:translate-y-[-5px] hover:shadow-xl border-l-4 relative group bg-card/80 backdrop-blur-sm before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:to-primary/5 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500 animate-fade-in" 
        style={{ 
          borderLeftColor: getStatusColor(service.status)
        }}
        onClick={() => {
          toast({
            title: `${service.name} Status`,
            description: `Status: ${getStatusText(service.status)}`,
          });
        }}
      >
        <div className="absolute -right-12 -top-12 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-500"></div>
        <CardHeader className="pb-2 relative">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center">
              <StatusDot status={service.status} />
              <span className="group-hover:text-primary transition-colors duration-300">{service.name}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground transform group-hover:translate-x-1 transition-transform duration-300 opacity-0 group-hover:opacity-100" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">{service.description}</p>
          <div className="mt-4 text-xs text-muted-foreground flex items-center opacity-70 group-hover:opacity-100 transition-opacity duration-300">
            <Clock className="h-3 w-3 mr-1 animate-pulse-slow" />
            Aktualisiert am {format(new Date(service.updatedAt), "dd. MMM, HH:mm 'Uhr'", { locale: de })}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function getStatusColor(status: string): string {
  switch(status) {
    case 'operational':
      return 'hsl(var(--status-operational))';
    case 'degraded':
    case 'partial_outage':
      return 'hsl(var(--status-degraded))';
    case 'major_outage':
      return 'hsl(var(--status-major))';
    case 'maintenance':
      return 'hsl(var(--status-maintenance))';
    default:
      return 'hsl(var(--muted-foreground))';
  }
}

function getStatusText(status: string): string {
  switch(status) {
    case 'operational':
      return 'Betriebsbereit';
    case 'degraded':
      return 'Beeinträchtigt';
    case 'partial_outage':
      return 'Teilweiser Ausfall';
    case 'major_outage':
      return 'Größerer Ausfall';
    case 'maintenance':
      return 'Wartung';
    default:
      return 'Unbekannt';
  }
}
