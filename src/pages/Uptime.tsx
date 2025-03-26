
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/PageLayout";
import { mockUptimeData, mockServices } from "@/lib/mockData";
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

export default function Uptime() {
  const [uptimeData, setUptimeData] = useState<UptimeDay[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [timeRange, setTimeRange] = useState("30");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setUptimeData(mockUptimeData);
      setServices(mockServices);
    }, 500);
  }, []);

  const getServiceUptime = (serviceId: string, days: number): number => {
    const recentData = uptimeData.slice(-days);
    if (recentData.length === 0) return 100;
    
    let totalUptime = 0;
    recentData.forEach(day => {
      if (day.services[serviceId]) {
        totalUptime += day.services[serviceId].uptime;
      }
    });
    
    return totalUptime / recentData.length;
  };

  const getOverallUptime = (days: number): number => {
    const recentData = uptimeData.slice(-days);
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
