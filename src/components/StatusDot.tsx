
import { cn } from "@/lib/utils";
import { ServiceStatus } from "@/lib/types";

interface StatusDotProps {
  status: ServiceStatus;
  className?: string;
}

const statusMap: Record<ServiceStatus, string> = {
  operational: "status-dot-operational",
  degraded: "status-dot-degraded",
  partial_outage: "status-dot-partial",
  major_outage: "status-dot-major",
  maintenance: "status-dot-maintenance",
};

export function StatusDot({ status, className }: StatusDotProps) {
  return (
    <span className={cn("status-dot", statusMap[status], className)} />
  );
}
