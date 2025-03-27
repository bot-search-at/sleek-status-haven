
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { mockServices, mockIncidents } from "@/lib/mockData";
import { ServiceCard } from "@/components/ServiceCard";
import { IncidentCard } from "@/components/IncidentCard";
import { Incident, Service } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";

export default function Index() {
  const [services, setServices] = useState<Service[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
  const [serviceGroups, setServiceGroups] = useState<Record<string, Service[]>>({});
  const [systemStatus, setSystemStatus] = useState<"operational" | "degraded" | "outage">("operational");

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setServices(mockServices);
      setIncidents(mockIncidents);

      // Group services by their group
      const groups: Record<string, Service[]> = {};
      mockServices.forEach(service => {
        if (!groups[service.group]) {
          groups[service.group] = [];
        }
        groups[service.group].push(service);
      });
      setServiceGroups(groups);

      // Filter active incidents
      const active = mockIncidents.filter(incident => incident.status !== "resolved");
      setActiveIncidents(active);

      // Determine overall system status
      if (mockServices.some(s => s.status === "major_outage")) {
        setSystemStatus("outage");
      } else if (mockServices.some(s => ["degraded", "partial_outage"].includes(s.status))) {
        setSystemStatus("degraded");
      } else {
        setSystemStatus("operational");
      }
    }, 500);
  }, []);

  const getStatusIcon = () => {
    switch (systemStatus) {
      case "operational":
        return <CheckCircle className="h-5 w-5 text-status-operational" />;
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-status-degraded" />;
      case "outage":
        return <AlertTriangle className="h-5 w-5 text-status-major" />;
    }
  };

  const getStatusMessage = () => {
    switch (systemStatus) {
      case "operational":
        return "All Systems Operational";
      case "degraded":
        return "Some Systems Degraded";
      case "outage":
        return "System Outage Detected";
    }
  };

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <div className="animate-fade-in mb-2 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-secondary">
            {getStatusIcon()}
            <span className="font-medium">{getStatusMessage()}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">My Status Page</h1>
          <p className="mt-2 text-muted-foreground">
            Live status monitoring for all my services
          </p>
        </div>

        {activeIncidents.length > 0 && (
          <div className="mb-8 animate-fade-in">
            <h2 className="text-xl font-bold mb-4">Active Incidents</h2>
            <div className="grid gap-4 grid-cols-1">
              {activeIncidents.map(incident => (
                <IncidentCard key={incident.id} incident={incident} services={services} />
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="all" className="mb-8 animate-fade-in">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Services</TabsTrigger>
            {Object.keys(serviceGroups).map(group => (
              <TabsTrigger key={group} value={group}>{group}</TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map(service => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </TabsContent>
          
          {Object.entries(serviceGroups).map(([group, groupServices]) => (
            <TabsContent key={group} value={group}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupServices.map(service => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="grid gap-6 md:grid-cols-2 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Incidents</CardTitle>
              <CardDescription>Latest resolved and ongoing incidents</CardDescription>
            </CardHeader>
            <CardContent>
              {incidents.length > 0 ? (
                <div className="space-y-4">
                  {incidents.slice(0, 3).map(incident => (
                    <div key={incident.id} className="flex items-start space-x-3">
                      {incident.status === "resolved" ? (
                        <CheckCircle className="mt-0.5 h-4 w-4 text-status-operational" />
                      ) : (
                        <Clock className="mt-0.5 h-4 w-4 text-status-degraded" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{incident.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(incident.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No incidents to display</p>
              )}
              
              <div className="mt-4">
                <Link to="/incidents">
                  <Button variant="outline" size="sm" className="w-full">View All Incidents</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Scheduled Maintenance</CardTitle>
              <CardDescription>Upcoming planned maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              {services.filter(s => s.status === "maintenance").length > 0 ? (
                <div className="space-y-4">
                  {services.filter(s => s.status === "maintenance").map(service => (
                    <div key={service.id} className="flex items-start space-x-3">
                      <Clock className="mt-0.5 h-4 w-4 text-status-maintenance" />
                      <div>
                        <p className="text-sm font-medium">{service.name} Maintenance</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(service.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No scheduled maintenance</p>
              )}
              
              <div className="mt-4">
                <Button variant="outline" size="sm" className="w-full" disabled>
                  Subscribe to Updates
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
