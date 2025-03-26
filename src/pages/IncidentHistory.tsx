
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { mockIncidents, mockServices } from "@/lib/mockData";
import { IncidentCard } from "@/components/IncidentCard";
import { Incident, Service } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function IncidentHistory() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [impactFilter, setImpactFilter] = useState("all");
  
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setIncidents(mockIncidents);
      setServices(mockServices);
      setFilteredIncidents(mockIncidents);
    }, 500);
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
      const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      
      groups[monthYear].push(incident);
    });
    
    return groups;
  };
  
  const incidentGroups = getIncidentGroups();
  
  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight">Incident History</h1>
          <p className="mt-2 text-muted-foreground">
            A complete history of all incidents and their resolutions
          </p>
        </div>
        
        <div className="mb-8 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="Search incidents..."
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
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="identified">Identified</SelectItem>
                  <SelectItem value="monitoring">Monitoring</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={impactFilter} onValueChange={setImpactFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Impact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Impacts</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="all" className="animate-fade-in">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Incidents</TabsTrigger>
            <TabsTrigger value="active">Active Incidents</TabsTrigger>
            <TabsTrigger value="resolved">Resolved Incidents</TabsTrigger>
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
                  <p className="text-lg font-medium">No incidents found</p>
                  <p className="text-muted-foreground">Try adjusting your search criteria</p>
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
                  <p className="text-lg font-medium">No active incidents</p>
                  <p className="text-muted-foreground">All systems are currently operational</p>
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
                  <p className="text-lg font-medium">No resolved incidents</p>
                  <p className="text-muted-foreground">No data available for the selected filters</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
