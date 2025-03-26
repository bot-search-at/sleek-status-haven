
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { mockServices, mockIncidents, mockUptimeData } from "@/lib/mockData";
import { Incident, Service, UptimeDay } from "@/lib/types";
import { UptimeChart } from "@/components/UptimeChart";
import { IncidentCard } from "@/components/IncidentCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { ArrowLeft, Clock } from "lucide-react";

export default function ServiceDetails() {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [uptimeData, setUptimeData] = useState<UptimeDay[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      if (id) {
        const foundService = mockServices.find(s => s.id === id);
        setService(foundService || null);
        
        // Find incidents related to this service
        const serviceIncidents = mockIncidents.filter(
          incident => incident.serviceIds.includes(id)
        );
        setIncidents(serviceIncidents);
        
        setUptimeData(mockUptimeData);
      }
      setLoading(false);
    }, 500);
  }, [id]);

  const getServiceUptime = (days: number): number => {
    const recentData = uptimeData.slice(-days);
    if (recentData.length === 0 || !service) return 100;
    
    let totalUptime = 0;
    let daysWithData = 0;
    
    recentData.forEach(day => {
      if (day.services[service.id]) {
        totalUptime += day.services[service.id].uptime;
        daysWithData++;
      }
    });
    
    return daysWithData > 0 ? totalUptime / daysWithData : 100;
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="max-w-5xl mx-auto text-center py-12">
          <div className="animate-pulse w-24 h-6 bg-secondary rounded mx-auto mb-2"></div>
          <div className="animate-pulse w-48 h-8 bg-secondary rounded mx-auto mb-4"></div>
          <div className="animate-pulse w-64 h-4 bg-secondary rounded mx-auto"></div>
        </div>
      </PageLayout>
    );
  }

  if (!service) {
    return (
      <PageLayout>
        <div className="max-w-5xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The service you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/">
            <Button>Return to Dashboard</Button>
          </Link>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <Link to="/" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center mb-4">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{service.name}</h1>
              <p className="mt-1 text-muted-foreground">
                {service.description}
              </p>
            </div>
            
            <StatusBadge status={service.status} className="h-7 flex items-center justify-center text-sm" />
          </div>
          
          <div className="mt-2 text-sm text-muted-foreground">
            Last updated: {format(new Date(service.updatedAt), "MMMM d, yyyy 'at' h:mm aaa")}
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 mb-8 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">30-Day Uptime</CardTitle>
              <CardDescription>Historical availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">
                {getServiceUptime(30).toFixed(2)}%
              </div>
              <UptimeChart 
                data={uptimeData} 
                title={`${service.name} Uptime`}
                days={30}
                height={200}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service Status</CardTitle>
              <CardDescription>Current operational details</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                  <dd className="mt-1 flex items-center">
                    <StatusBadge status={service.status} />
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Group</dt>
                  <dd className="mt-1">{service.group}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Active Incidents</dt>
                  <dd className="mt-1">
                    {incidents.filter(i => i.status !== "resolved").length || "None"}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Historical Incidents</dt>
                  <dd className="mt-1">{incidents.length}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-8 animate-fade-in">
          <h2 className="text-xl font-bold mb-4">Recent Incidents</h2>
          
          {incidents.length > 0 ? (
            <div className="space-y-4">
              {incidents.slice(0, 5).map(incident => (
                <IncidentCard 
                  key={incident.id}
                  incident={incident}
                  services={[service]}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Incidents</h3>
                <p className="text-muted-foreground">
                  No incidents have been reported for this service.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
