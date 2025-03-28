
export interface Service {
  id: string;
  name: string;
  description: string;
  status: ServiceStatus;
  group: string;
  updatedAt: string;
}

export type ServiceStatus = 
  | 'operational'
  | 'degraded'
  | 'partial_outage'
  | 'major_outage'
  | 'maintenance';

export interface Incident {
  id: string;
  title: string;
  status: IncidentStatus;
  impact: IncidentImpact;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  serviceIds: string[];
  updates: IncidentUpdate[];
}

export type IncidentStatus = 
  | 'investigating'
  | 'identified'
  | 'monitoring'
  | 'resolved';

export type IncidentImpact = 
  | 'none'
  | 'minor'
  | 'major'
  | 'critical';

export interface IncidentUpdate {
  id: string;
  incidentId: string;
  status: IncidentStatus;
  message: string;
  createdAt: string;
}

export interface UptimeDay {
  id?: string; // Added id field as optional since it comes from the database
  date: string;
  uptime: number; // Percentage (0-100)
  services: {
    [serviceId: string]: {
      uptime: number;
      incidents: string[]; // Incident IDs
    };
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}
