import { useState, useEffect } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Incident, Service, ServiceStatus, IncidentStatus, IncidentImpact } from "@/lib/types";
import { PlusCircle, Edit, Trash, AlertTriangle, CheckCircle, Bot } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { DiscordBotAdmin } from "@/components/DiscordBotAdmin";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Admin() {
  const [services, setServices] = useState<Service[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDescription, setNewServiceDescription] = useState("");
  const [newServiceGroup, setNewServiceGroup] = useState("");
  const [newServiceStatus, setNewServiceStatus] = useState<ServiceStatus>("operational");
  const [newIncidentTitle, setNewIncidentTitle] = useState("");
  const [newIncidentStatus, setNewIncidentStatus] = useState<IncidentStatus>("investigating");
  const [newIncidentImpact, setNewIncidentImpact] = useState<IncidentImpact>("minor");
  const [newIncidentMessage, setNewIncidentMessage] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: 'service' | 'incident', id: string} | null>(null);
  const [activeTab, setActiveTab] = useState<string>("services");
  
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && ['services', 'incidents', 'integrations'].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    window.location.hash = value;
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .order('name');
        
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
        
        const { data: incidentsData, error: incidentsError } = await supabase
          .from('incidents')
          .select(`
            *,
            incident_updates(*)
          `)
          .order('created_at', { ascending: false });
        
        if (incidentsError) throw incidentsError;
        
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
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error fetching data",
          description: "Could not load admin data. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    const servicesChannel = supabase
      .channel('admin:services')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'services' 
      }, () => {
        fetchData();
      })
      .subscribe();
      
    const incidentsChannel = supabase
      .channel('admin:incidents')
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
  }, [toast, navigate, isAdmin]);

  const openNewServiceDialog = () => {
    setEditingService(null);
    setNewServiceName("");
    setNewServiceDescription("");
    setNewServiceGroup("");
    setNewServiceStatus("operational");
    setIsServiceDialogOpen(true);
  };

  const openEditServiceDialog = (service: Service) => {
    setEditingService(service);
    setNewServiceName(service.name);
    setNewServiceDescription(service.description);
    setNewServiceGroup(service.group);
    setNewServiceStatus(service.status);
    setIsServiceDialogOpen(true);
  };

  const openNewIncidentDialog = () => {
    setEditingIncident(null);
    setNewIncidentTitle("");
    setNewIncidentStatus("investigating");
    setNewIncidentImpact("minor");
    setNewIncidentMessage("");
    setSelectedServiceIds([]);
    setIsIncidentDialogOpen(true);
  };

  const openEditIncidentDialog = (incident: Incident) => {
    setEditingIncident(incident);
    setNewIncidentTitle(incident.title);
    setNewIncidentStatus(incident.status);
    setNewIncidentImpact(incident.impact);
    setNewIncidentMessage("");
    setSelectedServiceIds(incident.serviceIds);
    setIsIncidentDialogOpen(true);
  };

  const confirmDelete = (type: 'service' | 'incident', id: string) => {
    setItemToDelete({ type, id });
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    
    try {
      let error;
      if (itemToDelete.type === 'service') {
        const { error: deleteError } = await supabase
          .from('services')
          .delete()
          .eq('id', itemToDelete.id);
        error = deleteError;
      } else {
        const { error: deleteError } = await supabase
          .from('incidents')
          .delete()
          .eq('id', itemToDelete.id);
        error = deleteError;
      }
      
      if (error) throw error;
      
      toast({
        title: "Deleted Successfully",
        description: `The ${itemToDelete.type} has been deleted.`,
      });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: `Could not delete the ${itemToDelete.type}.`,
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleSaveService = async () => {
    try {
      if (!newServiceName || !newServiceGroup) {
        toast({
          title: "Missing Fields",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }
      
      const serviceData = {
        name: newServiceName,
        description: newServiceDescription,
        service_group: newServiceGroup,
        status: newServiceStatus,
        updated_at: new Date().toISOString()
      };
      
      let error;
      if (editingService) {
        const { error: updateError } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('services')
          .insert([serviceData]);
        error = insertError;
      }
      
      if (error) throw error;
      
      toast({
        title: editingService ? "Service Updated" : "Service Created",
        description: editingService 
          ? `${newServiceName} has been updated successfully.` 
          : `${newServiceName} has been added successfully.`,
      });
      setIsServiceDialogOpen(false);
    } catch (error) {
      console.error("Error saving service:", error);
      toast({
        title: "Error",
        description: "Could not save the service. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveIncident = async () => {
    try {
      if (!newIncidentTitle || selectedServiceIds.length === 0 || !newIncidentMessage) {
        toast({
          title: "Missing Fields",
          description: "Please fill in all required fields and select at least one service.",
          variant: "destructive",
        });
        return;
      }
      
      const now = new Date().toISOString();
      const resolvedAt = newIncidentStatus === 'resolved' ? now : null;
      
      if (editingIncident) {
        const { error: updateError } = await supabase
          .from('incidents')
          .update({
            title: newIncidentTitle,
            status: newIncidentStatus,
            impact: newIncidentImpact,
            service_ids: selectedServiceIds,
            updated_at: now,
            resolved_at: resolvedAt
          })
          .eq('id', editingIncident.id);
          
        if (updateError) throw updateError;
        
        const { error: updateMsgError } = await supabase
          .from('incident_updates')
          .insert([{
            incident_id: editingIncident.id,
            status: newIncidentStatus,
            message: newIncidentMessage,
          }]);
          
        if (updateMsgError) throw updateMsgError;
      } else {
        const { data: newIncident, error: insertError } = await supabase
          .from('incidents')
          .insert([{
            title: newIncidentTitle,
            status: newIncidentStatus,
            impact: newIncidentImpact,
            service_ids: selectedServiceIds,
            resolved_at: resolvedAt
          }])
          .select()
          .single();
          
        if (insertError) throw insertError;
        
        const { error: updateError } = await supabase
          .from('incident_updates')
          .insert([{
            incident_id: newIncident.id,
            status: newIncidentStatus,
            message: newIncidentMessage,
          }]);
          
        if (updateError) throw updateError;
      }
      
      toast({
        title: editingIncident ? "Incident Updated" : "Incident Created",
        description: editingIncident 
          ? `The incident has been updated successfully.` 
          : `A new incident has been created successfully.`,
      });
      setIsIncidentDialogOpen(false);
    } catch (error) {
      console.error("Error saving incident:", error);
      toast({
        title: "Error",
        description: "Could not save the incident. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleServiceSelection = (serviceId: string) => {
    if (selectedServiceIds.includes(serviceId)) {
      setSelectedServiceIds(selectedServiceIds.filter(id => id !== serviceId));
    } else {
      setSelectedServiceIds([...selectedServiceIds, serviceId]);
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Manage services, incidents, and system status
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="incidents">Incidents</TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center">
              <Bot className="h-4 w-4 mr-2" />
              Discord Bot
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Services</h2>
              <Button onClick={openNewServiceDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Service
              </Button>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Group</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.length > 0 ? (
                      services.map(service => (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">{service.name}</TableCell>
                          <TableCell>{service.group}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  service.status === 'operational' ? 'bg-status-operational' :
                                  service.status === 'degraded' ? 'bg-status-degraded' :
                                  service.status === 'partial_outage' ? 'bg-status-degraded' :
                                  service.status === 'major_outage' ? 'bg-status-major' :
                                  'bg-status-maintenance'
                                }`}
                              />
                              <span className="capitalize">{service.status.replace(/_/g, ' ')}</span>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(service.updatedAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditServiceDialog(service)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => confirmDelete('service', service.id)}
                              >
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          No services found. Add a service to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incidents" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Incidents</h2>
              <Button onClick={openNewIncidentDialog}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Incident
              </Button>
            </div>
            
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Impact</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incidents.length > 0 ? (
                      incidents.map(incident => (
                        <TableRow key={incident.id}>
                          <TableCell className="font-medium">{incident.title}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {incident.status === 'resolved' ? (
                                <CheckCircle className="h-4 w-4 text-status-operational" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-status-degraded" />
                              )}
                              <span className="capitalize">{incident.status}</span>
                            </div>
                          </TableCell>
                          <TableCell className="capitalize">{incident.impact}</TableCell>
                          <TableCell>{new Date(incident.createdAt).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditIncidentDialog(incident)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => confirmDelete('incident', incident.id)}
                              >
                                <Trash className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                          No incidents found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="integrations">
            <DiscordBotAdmin />
          </TabsContent>
        </Tabs>

        <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingService ? 'Edit Service' : 'Add Service'}</DialogTitle>
              <DialogDescription>
                {editingService 
                  ? 'Update the service details below.' 
                  : 'Fill in the details for the new service.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <Input
                  id="name"
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="API Service"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="description"
                  value={newServiceDescription}
                  onChange={(e) => setNewServiceDescription(e.target.value)}
                  placeholder="Handles API requests for the application"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="group" className="text-sm font-medium">Group</label>
                <Input
                  id="group"
                  value={newServiceGroup}
                  onChange={(e) => setNewServiceGroup(e.target.value)}
                  placeholder="Core Services"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">Status</label>
                <Select
                  value={newServiceStatus}
                  onValueChange={(value) => setNewServiceStatus(value as ServiceStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="degraded">Degraded</SelectItem>
                    <SelectItem value="partial_outage">Partial Outage</SelectItem>
                    <SelectItem value="major_outage">Major Outage</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveService}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isIncidentDialogOpen} onOpenChange={setIsIncidentDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingIncident ? 'Update Incident' : 'Add Incident'}</DialogTitle>
              <DialogDescription>
                {editingIncident 
                  ? 'Update the incident details below.' 
                  : 'Fill in the details for the new incident.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Title</label>
                <Input
                  id="title"
                  value={newIncidentTitle}
                  onChange={(e) => setNewIncidentTitle(e.target.value)}
                  placeholder="API Latency Issues"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="status" className="text-sm font-medium">Status</label>
                <Select
                  value={newIncidentStatus}
                  onValueChange={(value) => setNewIncidentStatus(value as IncidentStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="identified">Identified</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label htmlFor="impact" className="text-sm font-medium">Impact</label>
                <Select
                  value={newIncidentImpact}
                  onValueChange={(value) => setNewIncidentImpact(value as IncidentImpact)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select impact" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Affected Services</label>
                <div className="max-h-40 overflow-y-auto space-y-2 border rounded-md p-3">
                  {services.length > 0 ? (
                    services.map(service => (
                      <div key={service.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`service-${service.id}`}
                          checked={selectedServiceIds.includes(service.id)}
                          onChange={() => handleServiceSelection(service.id)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor={`service-${service.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {service.name}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No services available.</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="update" className="text-sm font-medium">
                  {editingIncident ? 'Add Update Message' : 'Initial Update Message'}
                </label>
                <Textarea
                  id="update"
                  value={newIncidentMessage}
                  onChange={(e) => setNewIncidentMessage(e.target.value)}
                  placeholder="We are investigating issues with API latency..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsIncidentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveIncident}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-4">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteItem}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
