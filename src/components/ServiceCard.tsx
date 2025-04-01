
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Service } from "@/lib/types";
import { StatusDot } from "./StatusDot";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Link } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Link to={`/service/${service.id}`}>
      <Card className="service-transition overflow-hidden hover:cursor-pointer hover:shadow-lg transition-all duration-300 hover:translate-y-[-5px] border-l-4" 
        style={{ 
          borderLeftColor: getStatusColor(service.status)
        }}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center">
              <StatusDot status={service.status} />
              {service.name}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform duration-300" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{service.description}</p>
          <div className="mt-4 text-xs text-muted-foreground flex items-center">
            <Clock className="h-3 w-3 mr-1 opacity-70" />
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
      return 'hsl(142, 72%, 29%)';
    case 'degraded':
    case 'partial_outage':
      return 'hsl(28, 96%, 54%)';
    case 'major_outage':
      return 'hsl(0, 84%, 60%)';
    case 'maintenance':
      return 'hsl(246, 70%, 60%)';
    default:
      return 'hsl(220, 20%, 64%)';
  }
}
