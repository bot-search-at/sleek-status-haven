
import { Incident, IncidentUpdate, Service, UptimeDay, User } from "./types";

export const mockServices: Service[] = [
  {
    id: "s1",
    name: "API",
    description: "Core API services for all application functionality",
    status: "operational",
    group: "Core Services",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "s2",
    name: "Web App",
    description: "Main web application interface",
    status: "operational",
    group: "User Interfaces",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "s3",
    name: "Authentication",
    description: "User authentication and authorization services",
    status: "degraded",
    group: "Security",
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "s4",
    name: "Database",
    description: "Core database services",
    status: "operational",
    group: "Core Services",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    id: "s5",
    name: "Storage",
    description: "File storage services",
    status: "operational",
    group: "Core Services",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: "s6",
    name: "Mobile App",
    description: "Native mobile application",
    status: "partial_outage",
    group: "User Interfaces",
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "s7",
    name: "CDN",
    description: "Content delivery network for static assets",
    status: "operational",
    group: "Core Services",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "s8",
    name: "Email Service",
    description: "Email sending and receiving functionality",
    status: "operational",
    group: "Communication",
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: "s9",
    name: "Search",
    description: "Search functionality across the platform",
    status: "maintenance",
    group: "Core Services",
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
];

export const mockIncidents: Incident[] = [
  {
    id: "i1",
    title: "API Performance Degradation",
    status: "resolved",
    impact: "minor",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 60 * 2).toISOString(),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 60 * 4).toISOString(),
    serviceIds: ["s1"],
    updates: [],
  },
  {
    id: "i2",
    title: "Authentication Service Outage",
    status: "investigating",
    impact: "major",
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    resolvedAt: null,
    serviceIds: ["s3"],
    updates: [],
  },
  {
    id: "i3",
    title: "Mobile App Connectivity Issues",
    status: "identified",
    impact: "minor",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    resolvedAt: null,
    serviceIds: ["s6"],
    updates: [],
  },
  {
    id: "i4",
    title: "Scheduled Maintenance: Search Services",
    status: "monitoring",
    impact: "minor",
    createdAt: new Date(Date.now() - 1000 * 60 * 150).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    resolvedAt: null,
    serviceIds: ["s9"],
    updates: [],
  },
];

// Generate incident updates
mockIncidents.forEach((incident) => {
  // Create 2-4 updates for each incident
  const updateCount = 2 + Math.floor(Math.random() * 3);
  
  for (let i = 0; i < updateCount; i++) {
    let status: any;
    if (i === 0) status = "investigating";
    else if (i === updateCount - 1 && incident.status === "resolved") status = "resolved";
    else status = ["investigating", "identified", "monitoring"][Math.floor(Math.random() * 3)];
    
    const update: IncidentUpdate = {
      id: `u${incident.id.substring(1)}-${i + 1}`,
      incidentId: incident.id,
      status,
      message: getIncidentUpdateMessage(status, incident.title),
      createdAt: new Date(new Date(incident.createdAt).getTime() + 1000 * 60 * 30 * i).toISOString(),
    };
    
    incident.updates.push(update);
  }
});

function getIncidentUpdateMessage(status: string, title: string): string {
  const messages = {
    investigating: [
      `We're investigating reports of issues with ${title.toLowerCase()}.`,
      `Our team is looking into potential problems with ${title.toLowerCase()}.`,
      `We've received reports about ${title.toLowerCase()} and are investigating.`,
    ],
    identified: [
      `We've identified the cause of the issue with ${title.toLowerCase()}.`,
      `The root cause of the problem has been identified. Our engineers are working on a fix.`,
      `We've pinpointed the issue affecting ${title.toLowerCase()} and are implementing a solution.`,
    ],
    monitoring: [
      `A fix has been deployed and we're monitoring the situation.`,
      `We've implemented a fix and are keeping a close eye on the systems.`,
      `The issue should be resolved. We're monitoring to ensure stability.`,
    ],
    resolved: [
      `The incident has been fully resolved. Service is back to normal.`,
      `All systems are operational again. The issue has been resolved.`,
      `We've resolved the problem and confirmed that all services are functioning properly.`,
    ],
  };
  
  const options = messages[status as keyof typeof messages];
  return options[Math.floor(Math.random() * options.length)];
}

// Generate uptime data for the last 90 days
export const mockUptimeData: UptimeDay[] = Array.from({ length: 90 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (89 - i));
  
  // Generate slightly random uptime (mostly high but with occasional dips)
  const baseUptime = Math.random() > 0.95 ? 90 + Math.random() * 9 : 99 + Math.random();
  const uptime = Math.min(100, baseUptime);
  
  const services: Record<string, { uptime: number; incidents: string[] }> = {};
  
  mockServices.forEach(service => {
    const serviceUptime = Math.random() > 0.92 ? 
      85 + Math.random() * 14 : 
      Math.min(100, uptime + (Math.random() * 0.5 - 0.25));
    
    services[service.id] = {
      uptime: serviceUptime,
      incidents: [], // We'll populate this with any incidents that occurred on this day
    };
  });
  
  return {
    date: date.toISOString().split('T')[0],
    uptime,
    services,
  };
});

export const mockUsers: User[] = [
  {
    id: "u1",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
  },
  {
    id: "u2",
    name: "Editor User",
    email: "editor@example.com",
    role: "editor",
  },
  {
    id: "u3",
    name: "Viewer User",
    email: "viewer@example.com",
    role: "viewer",
  },
];
