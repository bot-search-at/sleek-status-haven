
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { IncidentCard } from "@/components/IncidentCard";
import { Incident, Service } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function IncidentHistory() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [impactFilter, setImpactFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
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
        
        const mappedServices: Service[] = servicesData.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description || '',
          status: service.status,
          group: service.service_group,
          updatedAt: service.updated_at
        }));
        
        setServices(mappedServices);
        
        // Fetch incidents with updates
        const { data: incidentsData, error: incidentsError } = await supabase
          .from('incidents')
          .select(`
            *,
            incident_updates(*)
          `)
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
        setFilteredIncidents(mappedIncidents);
      } catch (error) {
        console.error("Fehler beim Laden der Vorfälle:", error);
        toast({
          title: "Fehler beim Laden",
          description: "Die Vorfälle konnten nicht geladen werden. Bitte versuchen Sie es später erneut.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);
  
  useEffect(() => {
    let result = [...incidents];
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(incident => 
        incident.title.toLowerCase().includes(query) || 
        incident.updates.some(update => update.message.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter(incident => incident.status === statusFilter);
    }
    
    // Apply impact filter
    if (impactFilter !== "all") {
      result = result.filter(incident => incident.impact === impactFilter);
    }
    
    setFilteredIncidents(result);
  }, [incidents, searchQuery, statusFilter, impactFilter]);
  
  // Group incidents by month/year
  const getIncidentGroups = () => {
    const groups: Record<string, Incident[]> = {};
    
    filteredIncidents.forEach(incident => {
      const date = new Date(incident.createdAt);
      const monthYear = date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
      
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      
      groups[monthYear].push(incident);
    });
    
    return groups;
  };
  
  const incidentGroups = getIncidentGroups();
  
  if (isLoading) {
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
  
  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight">Vorfallshistorie</h1>
          <p className="mt-2 text-muted-foreground">
            Eine vollständige Geschichte aller Vorfälle und deren Lösungen
          </p>
        </div>
        
        <div className="mb-8 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Vorfälle suchen..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="sm:max-w-xs"
            />
            
            <div className="flex flex-wrap gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Status</SelectItem>
                  <SelectItem value="investigating">Untersuchen</SelectItem>
                  <SelectItem value="identified">Identifiziert</SelectItem>
                  <SelectItem value="monitoring">Überwachung</SelectItem>
                  <SelectItem value="resolved">Gelöst</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={impactFilter} onValueChange={setImpactFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Auswirkung" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Auswirkungen</SelectItem>
                  <SelectItem value="none">Keine</SelectItem>
                  <SelectItem value="minor">Gering</SelectItem>
                  <SelectItem value="major">Erheblich</SelectItem>
                  <SelectItem value="critical">Kritisch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="all" className="animate-fade-in">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Alle Vorfälle</TabsTrigger>
            <TabsTrigger value="active">Aktive Vorfälle</TabsTrigger>
            <TabsTrigger value="resolved">Gelöste Vorfälle</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="space-y-8">
              {Object.keys(incidentGroups).length > 0 ? (
                Object.entries(incidentGroups).map(([monthYear, groupIncidents]) => (
                  <div key={monthYear} className="animate-fade-in">
                    <h2 className="text-xl font-bold mb-4">{monthYear}</h2>
                    <div className="grid gap-4 grid-cols-1">
                      {groupIncidents.map(incident => (
                        <IncidentCard 
                          key={incident.id} 
                          incident={incident} 
                          services={services} 
                        />
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 animate-fade-in">
                  <p className="text-lg font-medium">Keine Vorfälle gefunden</p>
                  <p className="text-muted-foreground">Passen Sie Ihre Suchkriterien an</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="active">
            <div className="space-y-4">
              {filteredIncidents.filter(i => i.status !== "resolved").length > 0 ? (
                filteredIncidents
                  .filter(i => i.status !== "resolved")
                  .map(incident => (
                    <IncidentCard 
                      key={incident.id} 
                      incident={incident} 
                      services={services} 
                    />
                  ))
              ) : (
                <div className="text-center py-12 animate-fade-in">
                  <p className="text-lg font-medium">Keine aktiven Vorfälle</p>
                  <p className="text-muted-foreground">Alle Systeme sind derzeit betriebsbereit</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="resolved">
            <div className="space-y-4">
              {filteredIncidents.filter(i => i.status === "resolved").length > 0 ? (
                filteredIncidents
                  .filter(i => i.status === "resolved")
                  .map(incident => (
                    <IncidentCard 
                      key={incident.id} 
                      incident={incident} 
                      services={services} 
                    />
                  ))
              ) : (
                <div className="text-center py-12 animate-fade-in">
                  <p className="text-lg font-medium">Keine gelösten Vorfälle</p>
                  <p className="text-muted-foreground">Keine Daten für die ausgewählten Filter verfügbar</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}

