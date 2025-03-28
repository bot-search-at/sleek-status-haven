
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { UptimeChart } from "@/components/UptimeChart";
import { Service, UptimeDay } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusDot } from "@/components/StatusDot";
import { UptimeEditForm } from "@/components/UptimeEditForm";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

export default function Uptime() {
  const [uptimeData, setUptimeData] = useState<UptimeDay[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [timeRange, setTimeRange] = useState("30");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentUptimeDay, setCurrentUptimeDay] = useState<UptimeDay | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
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
      
      // Fetch uptime data
      const { data: uptimeDataResult, error: uptimeError } = await supabase
        .from('uptime_data')
        .select('*')
        .order('date', { ascending: false });
      
      if (uptimeError) throw uptimeError;
      
      // Map the data to match our type
      const mappedUptimeData: UptimeDay[] = uptimeDataResult.map(day => ({
        date: day.date,
        uptime: day.uptime as number,
        services: day.services as Record<string, { uptime: number; incidents: string[] }>
      }));
      
      setUptimeData(mappedUptimeData);
      
      // Find the uptime data for the selected date
      const dayData = mappedUptimeData.find(day => day.date === selectedDate);
      setCurrentUptimeDay(dayData || null);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error fetching data",
        description: "Could not load uptime data. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Set up realtime subscription for updates
    const uptimeChannel = supabase
      .channel('public:uptime_data')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'uptime_data' 
      }, () => {
        fetchData();
      })
      .subscribe();
      
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
      
    return () => {
      supabase.removeChannel(uptimeChannel);
      supabase.removeChannel(servicesChannel);
    };
  }, []);

  useEffect(() => {
    // Update current uptime day when selected date changes
    const dayData = uptimeData.find(day => day.date === selectedDate);
    setCurrentUptimeDay(dayData || null);
  }, [selectedDate, uptimeData]);

  const getServiceUptime = (serviceId: string, days: number): number => {
    const recentData = uptimeData.slice(0, days);
    if (recentData.length === 0) return 100;
    
    let totalUptime = 0;
    let daysWithData = 0;
    
    recentData.forEach(day => {
      if (day.services[serviceId]) {
        totalUptime += day.services[serviceId].uptime;
        daysWithData++;
      }
    });
    
    return daysWithData > 0 ? totalUptime / daysWithData : 100;
  };

  const getOverallUptime = (days: number): number => {
    const recentData = uptimeData.slice(0, days);
    if (recentData.length === 0) return 100;
    
    let totalUptime = 0;
    recentData.forEach(day => {
      totalUptime += day.uptime;
    });
    
    return totalUptime / recentData.length;
  };

  const timeRangeOptions = [
    { value: "7", label: "7 days" },
    { value: "30", label: "30 days" },
    { value: "90", label: "90 days" },
  ];

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight">Uptime History</h1>
          <p className="mt-2 text-muted-foreground">
            Historical uptime performance of our services
          </p>
        </div>
        
        <div className="mb-8 flex flex-col sm:flex-row justify-between gap-4 animate-fade-in">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="text-sm text-muted-foreground">
            Overall uptime: <span className="font-medium text-foreground">
              {getOverallUptime(parseInt(timeRange)).toFixed(2)}%
            </span> in the last {timeRange} days
          </div>
        </div>
        
        <div className="mb-4 animate-fade-in flex justify-between items-center">
          <Select 
            value={selectedDate} 
            onValueChange={handleDateSelect}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date" />
            </SelectTrigger>
            <SelectContent>
              {uptimeData.map(day => (
                <SelectItem key={day.date} value={day.date}>
                  {new Date(day.date).toLocaleDateString()}
                </SelectItem>
              ))}
              {uptimeData.findIndex(day => day.date === selectedDate) === -1 && (
                <SelectItem value={selectedDate}>
                  {new Date(selectedDate).toLocaleDateString()} (New)
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          
          {user && (
            <UptimeEditForm 
              date={selectedDate}
              services={services}
              uptimeData={currentUptimeDay}
              onUptimeUpdated={fetchData}
            />
          )}
        </div>
        
        <div className="mb-8 animate-fade-in">
          <Card>
            <CardHeader className="pb-0">
              <CardTitle className="text-lg">
                {selectedService 
                  ? `${services.find(s => s.id === selectedService)?.name} Uptime` 
                  : "System Uptime"
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <UptimeChart 
                data={uptimeData} 
                days={parseInt(timeRange)}
                height={300}
                serviceId={selectedService}
              />
              
              <div className="mt-4 text-xs text-center text-muted-foreground">
                Showing uptime for the last {timeRange} days
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="all" className="animate-fade-in">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Services</TabsTrigger>
            {Array.from(new Set(services.map(s => s.group))).map(group => (
              <TabsTrigger key={group} value={group}>{group}</TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map(service => (
                <Card 
                  key={service.id}
                  className={`service-transition cursor-pointer ${
                    selectedService === service.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedService(
                    selectedService === service.id ? null : service.id
                  )}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center">
                      <StatusDot status={service.status} />
                      {service.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-2xl font-bold">
                        {getServiceUptime(service.id, parseInt(timeRange)).toFixed(2)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Last {timeRange} days
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {Array.from(new Set(services.map(s => s.group))).map(group => (
            <TabsContent key={group} value={group}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services
                  .filter(service => service.group === group)
                  .map(service => (
                    <Card 
                      key={service.id}
                      className={`service-transition cursor-pointer ${
                        selectedService === service.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedService(
                        selectedService === service.id ? null : service.id
                      )}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          <StatusDot status={service.status} />
                          {service.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div className="text-2xl font-bold">
                            {getServiceUptime(service.id, parseInt(timeRange)).toFixed(2)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Last {timeRange} days
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                }
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </PageLayout>
  );
}
