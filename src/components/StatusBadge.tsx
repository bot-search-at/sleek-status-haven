
import { cn } from "@/lib/utils";
import { ServiceStatus } from "@/lib/types";

interface StatusBadgeProps {
  status: ServiceStatus;
  className?: string;
  showLabel?: boolean;
}

const statusMap: Record<ServiceStatus, { class: string; label: string }> = {
  operational: { class: "status-badge-operational", label: "Operational" },
  degraded: { class: "status-badge-degraded", label: "Degraded" },
  partial_outage: { class: "status-badge-partial", label: "Partial Outage" },
  major_outage: { class: "status-badge-major", label: "Major Outage" },
  maintenance: { class: "status-badge-maintenance", label: "Maintenance" },
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
