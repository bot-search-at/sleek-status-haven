
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Service } from "@/lib/types";
import { StatusDot } from "./StatusDot";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Link to={`/service/${service.id}`}>
      <Card className="service-transition hover:cursor-pointer">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center">
              <StatusDot status={service.status} />
              {service.name}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{service.description}</p>
          <div className="mt-4 text-xs text-muted-foreground">
            Aktualisiert am {format(new Date(service.updatedAt), "dd. MMM, HH:mm 'Uhr'", { locale: de })}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
