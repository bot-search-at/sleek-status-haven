
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
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Uptime() {
  const [uptimeData, setUptimeData] = useState<UptimeDay[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [timeRange, setTimeRange] = useState("30");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [currentUptimeDay, setCurrentUptimeDay] = useState<UptimeDay | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { toast } = useToast();
  const { user } = useAuth();
  
  const fetchData = async () => {
    setIsLoading(true);
    setIsRefreshing(true);
    try {
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
      
      const { data: uptimeDataResult, error: uptimeError } = await supabase
        .from('uptime_data')
        .select('*')
        .order('date', { ascending: false });
      
      if (uptimeError) throw uptimeError;
      
      const mappedUptimeData: UptimeDay[] = uptimeDataResult.map(day => ({
        date: day.date,
        uptime: day.uptime as number,
        services: day.services as Record<string, { uptime: number; incidents: string[] }>
      }));
      
      setUptimeData(mappedUptimeData);
      
      const dayData = mappedUptimeData.find(day => day.date === selectedDate);
      setCurrentUptimeDay(dayData || null);
      
      // Update last refresh time
      setLastUpdate(new Date());
      
      // Show success toast on manual refresh
      if (isRefreshing && !isLoading) {
        toast({
          title: "Daten aktualisiert",
          description: "Die Verfügbarkeitsdaten wurden erfolgreich aktualisiert.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Fehler beim Laden der Daten",
        description: "Die Verfügbarkeitsdaten konnten nicht geladen werden. Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    
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
    { value: "7", label: "7 Tage" },
    { value: "30", label: "30 Tage" },
    { value: "90", label: "90 Tage" },
  ];

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const formatLastUpdateTime = () => {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(lastUpdate);
  };

  const handleRefresh = () => {
    fetchData();
  };

  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center animate-fade-in">
          <h1 className="text-3xl font-bold tracking-tight">Verfügbarkeitshistorie</h1>
          <p className="mt-2 text-muted-foreground">
            Historische Verfügbarkeitsleistung unserer Dienste
          </p>
          
          <div className="mt-4 flex justify-center items-center text-sm text-muted-foreground">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground flex items-center gap-1"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? "Aktualisiere..." : "Aktualisieren"}
            </Button>
            <span className="mx-2">•</span>
            <span>Zuletzt aktualisiert: {formatLastUpdateTime()}</span>
          </div>
        </div>
        
        <div className="mb-8 flex flex-col sm:flex-row justify-between gap-4 animate-fade-in">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Zeitraum wählen" />
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
            Gesamtverfügbarkeit: <span className="font-medium text-foreground">
              {getOverallUptime(parseInt(timeRange)).toFixed(2)}%
            </span> in den letzten {timeRange} Tagen
          </div>
        </div>
        
        <div className="mb-4 animate-fade-in flex justify-between items-center">
          <Select 
            value={selectedDate} 
            onValueChange={handleDateSelect}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Datum wählen" />
            </SelectTrigger>
            <SelectContent>
              {uptimeData.map(day => (
                <SelectItem key={day.date} value={day.date}>
                  {new Date(day.date).toLocaleDateString('de-DE')}
                </SelectItem>
              ))}
              {uptimeData.findIndex(day => day.date === selectedDate) === -1 && (
                <SelectItem value={selectedDate}>
                  {new Date(selectedDate).toLocaleDateString('de-DE')} (Neu)
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
                  ? `${services.find(s => s.id === selectedService)?.name} Verfügbarkeit` 
                  : "Systemverfügbarkeit"
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
                Zeigt Verfügbarkeit für die letzten {timeRange} Tage
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="all" className="animate-fade-in">
          <TabsList className="mb-4">
            <TabsTrigger value="all">Alle Dienste</TabsTrigger>
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
                        Letzte {timeRange} Tage
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
                            Letzte {timeRange} Tage
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
        
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>Diese Übersicht zeigt die historische Verfügbarkeit aller Dienste.</p>
          <p className="mt-1">Bei Fragen wenden Sie sich bitte an den Support.</p>
        </div>
      </div>
    </PageLayout>
  );
}
