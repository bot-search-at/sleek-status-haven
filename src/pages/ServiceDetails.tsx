
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
import { de } from "date-fns/locale";
import { ArrowLeft, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function ServiceDetails() {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [uptimeData, setUptimeData] = useState<UptimeDay[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchServiceData = async () => {
      setLoading(true);
      try {
        if (id) {
          // Fetch service data
          const { data: serviceData, error: serviceError } = await supabase
            .from('services')
            .select('*')
            .eq('id', id)
            .single();
          
          if (serviceError) throw serviceError;
          
          // Map to our type
          const mappedService: Service = {
            id: serviceData.id,
            name: serviceData.name,
            description: serviceData.description || '',
            status: serviceData.status,
            group: serviceData.service_group,
            updatedAt: serviceData.updated_at
          };
          
          setService(mappedService);
          
          // Fetch incidents related to this service
          const { data: incidentsData, error: incidentsError } = await supabase
            .from('incidents')
            .select(`
              *,
              incident_updates(*)
            `)
            .contains('service_ids', [id])
            .order('created_at', { ascending: false });
          
          if (incidentsError) throw incidentsError;
          
          // Map to our type
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
          
          // Fetch uptime data
          const { data: uptimeData, error: uptimeError } = await supabase
            .from('uptime_data')
            .select('*')
            .order('date', { ascending: true });
          
          if (!uptimeError && uptimeData) {
            setUptimeData(uptimeData);
          } else {
            // Fallback to mock data if we couldn't fetch real data
            setUptimeData(mockUptimeData);
          }
        }
      } catch (error) {
        console.error("Fehler beim Laden der Servicedaten:", error);
        toast({
          title: "Fehler beim Laden",
          description: "Die Servicedaten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.",
          variant: "destructive",
        });
        
        // Fallback to mock data
        const foundService = mockServices.find(s => s.id === id);
        setService(foundService || null);
        
        const serviceIncidents = mockIncidents.filter(
          incident => incident.serviceIds.includes(id || '')
        );
        setIncidents(serviceIncidents);
        
        setUptimeData(mockUptimeData);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceData();
  }, [id, toast]);

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
          <h1 className="text-2xl font-bold mb-4">Service nicht gefunden</h1>
          <p className="text-muted-foreground mb-6">
            Der gesuchte Service existiert nicht oder wurde entfernt.
          </p>
          <Link to="/">
            <Button>Zurück zur Übersicht</Button>
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
            Zurück zur Übersicht
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
            Zuletzt aktualisiert: {format(new Date(service.updatedAt), "d. MMMM yyyy 'um' HH:mm 'Uhr'", { locale: de })}
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 mb-8 animate-fade-in">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">30-Tage Verfügbarkeit</CardTitle>
              <CardDescription>Historische Verfügbarkeit</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-4">
                {getServiceUptime(30).toFixed(2)}%
              </div>
              <UptimeChart 
                data={uptimeData} 
                title={`${service.name} Verfügbarkeit`}
                days={30}
                height={200}
                serviceId={service.id}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service-Status</CardTitle>
              <CardDescription>Aktuelle Betriebsdetails</CardDescription>
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
                  <dt className="text-sm font-medium text-muted-foreground">Gruppe</dt>
                  <dd className="mt-1">{service.group}</dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Aktive Vorfälle</dt>
                  <dd className="mt-1">
                    {incidents.filter(i => i.status !== "resolved").length || "Keine"}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Historische Vorfälle</dt>
                  <dd className="mt-1">{incidents.length || "Keine"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-8 animate-fade-in">
          <h2 className="text-xl font-bold mb-4">Letzte Vorfälle</h2>
          
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
                <h3 className="text-lg font-medium mb-2">Keine Vorfälle</h3>
                <p className="text-muted-foreground">
                  Für diesen Service wurden keine Vorfälle gemeldet.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
