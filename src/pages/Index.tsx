
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { ServiceCard } from "@/components/ServiceCard";
import { IncidentCard } from "@/components/IncidentCard";
import { Incident, Service } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SubscribeDialog } from "@/components/SubscribeDialog";
import { DiscordBotStatus } from "@/components/DiscordBotStatus";

export default function Index() {
  const [services, setServices] = useState<Service[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([]);
  const [serviceGroups, setServiceGroups] = useState<Record<string, Service[]>>({});
  const [systemStatus, setSystemStatus] = useState<"operational" | "degraded" | "outage">("operational");
  const [isLoading, setIsLoading] = useState(true);
  const [showDiscordView, setShowDiscordView] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch services
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*');
        
        if (servicesError) throw servicesError;
        
        // Map the data to match our type
        const mappedServices: Service[] = servicesData.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description || '',
          status: service.status,
          group: service.service_group,
          updatedAt: service.updated_at
        }));
        
        setServices(mappedServices);
        
        // Group services by their group
        const groups: Record<string, Service[]> = {};
        mappedServices.forEach(service => {
          if (!groups[service.group]) {
            groups[service.group] = [];
          }
          groups[service.group].push(service);
        });
        setServiceGroups(groups);
        
        // Fetch incidents
        const { data: incidentsData, error: incidentsError } = await supabase
          .from('incidents')
          .select(`
            *,
            incident_updates(*)
          `)
          .order('created_at', { ascending: false });
        
        if (incidentsError) throw incidentsError;
        
        // Map the data to match our type
        const mappedIncidents: Incident[] = incidentsData.map(incident => ({
          id: incident.id,
          title: incident.title,
          status: incident.status,
          impact: incident.impact,
          createdAt: incident.created_at,
          updatedAt: incident.updated_at,
          resolvedAt: incident.resolved_at,
          serviceIds: incident.service_ids,
          updates: incident.incident_updates.map((update: any) => ({
            id: update.id,
            incidentId: update.incident_id,
            status: update.status,
            message: update.message,
            createdAt: update.created_at
          }))
        }));
        
        setIncidents(mappedIncidents);
        
        // Filter active incidents
        const active = mappedIncidents.filter(incident => incident.status !== "resolved");
        setActiveIncidents(active);
        
        // Determine overall system status
        if (mappedServices.some(s => s.status === "major_outage")) {
          setSystemStatus("outage");
        } else if (mappedServices.some(s => ["degraded", "partial_outage"].includes(s.status))) {
          setSystemStatus("degraded");
        } else {
          setSystemStatus("operational");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error fetching data",
          description: "Could not load status data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Set up realtime subscription for updates
    const servicesChannel = supabase
      .channel('public:services')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'services' 
      }, () => {
        fetchData();
      })
      .subscribe();
      
    const incidentsChannel = supabase
      .channel('public:incidents')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'incidents' 
      }, () => {
        fetchData();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(servicesChannel);
      supabase.removeChannel(incidentsChannel);
    };
  }, [toast]);

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
        return "Alle Systeme betriebsbereit";
      case "degraded":
        return "Einige Systeme beeinträchtigt";
      case "outage":
        return "Systemausfall erkannt";
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="max-w-5xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <div className="animate-fade-in mb-2 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-secondary">
            {getStatusIcon()}
            <span className="font-medium">{getStatusMessage()}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Bot Search_AT Statusseite</h1>
          <p className="mt-2 text-muted-foreground">
            Live-Statusüberwachung für alle meine Dienste
          </p>
          
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDiscordView(!showDiscordView)}
              className="mr-2"
            >
              {showDiscordView ? "Standard-Ansicht" : "Discord Bot-Ansicht"}
            </Button>
          </div>
        </div>

        {showDiscordView ? (
          <DiscordBotStatus />
        ) : (
          <>
            {activeIncidents.length > 0 && (
              <div className="mb-8 animate-fade-in">
                <h2 className="text-xl font-bold mb-4">Aktive Vorfälle</h2>
                <div className="grid gap-4 grid-cols-1">
                  {activeIncidents.map(incident => (
                    <IncidentCard key={incident.id} incident={incident} services={services} />
                  ))}
                </div>
              </div>
            )}

            <Tabs defaultValue="all" className="mb-8 animate-fade-in">
              <TabsList className="mb-4">
                <TabsTrigger value="all">Alle Dienste</TabsTrigger>
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
                  <CardTitle className="text-lg">Letzte Vorfälle</CardTitle>
                  <CardDescription>Neueste gelöste und laufende Vorfälle</CardDescription>
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
                    <p className="text-sm text-muted-foreground">Keine Vorfälle anzuzeigen</p>
                  )}
                  
                  <div className="mt-4">
                    <Link to="/incidents">
                      <Button variant="outline" size="sm" className="w-full">Alle Vorfälle anzeigen</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Geplante Wartung</CardTitle>
                  <CardDescription>Anstehende geplante Wartungen</CardDescription>
                </CardHeader>
                <CardContent>
                  {services.filter(s => s.status === "maintenance").length > 0 ? (
                    <div className="space-y-4">
                      {services.filter(s => s.status === "maintenance").map(service => (
                        <div key={service.id} className="flex items-start space-x-3">
                          <Clock className="mt-0.5 h-4 w-4 text-status-maintenance" />
                          <div>
                            <p className="text-sm font-medium">{service.name} Wartung</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(service.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Keine geplante Wartung</p>
                  )}
                  
                  <div className="mt-4">
                    <SubscribeDialog
                      trigger={
                        <Button variant="outline" size="sm" className="w-full">
                          Updates abonnieren
                        </Button>
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
