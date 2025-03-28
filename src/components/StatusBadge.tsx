
import { cn } from "@/lib/utils";
import { ServiceStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: ServiceStatus;
  className?: string;
  showLabel?: boolean;
}

const statusMap: Record<ServiceStatus, { class: string; label: string }> = {
  operational: { class: "status-badge-operational", label: "Betriebsbereit" },
  degraded: { class: "status-badge-degraded", label: "Beeinträchtigt" },
  partial_outage: { class: "status-badge-partial", label: "Teilausfall" },
  major_outage: { class: "status-badge-major", label: "Schwerer Ausfall" },
  maintenance: { class: "status-badge-maintenance", label: "Wartung" },
};

export function StatusBadge({ 
  status, 
  className,
  showLabel = true
}: StatusBadgeProps) {
  return (
    <span className={cn("status-badge", statusMap[status].class, className)}>
      {showLabel ? statusMap[status].label : <span className="sr-only">{statusMap[status].label}</span>}
    </span>
  );
}
