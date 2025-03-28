
import React from "react";
import { PageLayout } from "@/components/PageLayout";
import { CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Service } from "@/lib/types";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ServiceStatus {
  name: string;
  online: boolean;
  uptime: number;
  responseTime?: number;
  message?: string;
}

export function DiscordBotStatus() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [currentDate, setCurrentDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Aktuelles Datum im Format "22. Juli 2024" setzen
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    setCurrentDate(date.toLocaleDateString('de-DE', options));
    
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('services')
          .select('*');

        if (error) throw error;

        // Services in das benötigte Format umwandeln
        const mappedServices: ServiceStatus[] = data.map((service: any) => ({
          name: service.name,
          online: service.status === 'operational',
          uptime: Math.random() * 1 > 0.9 ? 99.86 : 100.00, // Für Demozwecke
          responseTime: Math.floor(Math.random() * 200) + 1, // Zufällige Reaktionszeit zwischen 1-200ms
        }));

        // Discord API als "problematischen" Service hinzufügen
        mappedServices.push({
          name: "Discord API",
          online: false,
          uptime: 99.5,
          responseTime: 274,
          message: "Increased API Response Time"
        });

        setServices(mappedServices);
      } catch (error) {
        console.error("Fehler beim Laden der Services:", error);
        toast({
          title: "Fehler beim Laden",
          description: "Die Services konnten nicht geladen werden.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="bg-gradient-to-br from-indigo-900 to-purple-900 border-none text-white shadow-xl">
        <CardContent className="p-0">
          {/* Header mit Datum */}
          <div className="text-center py-2 border-b border-gray-700">
            {currentDate}
          </div>

          {/* Bot Nachricht */}
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center overflow-hidden shrink-0">
                <span className="text-xl">🤖</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-yellow-400">PowerBot | Watchdog</span>
                  <span className="bg-blue-600 text-xs px-2 py-0.5 rounded">APP</span>
                  <span className="text-gray-400 text-xs">22.07.24, 18:03</span>
                </div>
                <div className="text-gray-400 text-xs">(Bearbeitet)</div>
              </div>
            </div>

            {/* Bot Content */}
            <div className="ml-16 mt-2 border-l-4 border-blue-500 pl-3 bg-opacity-20 bg-blue-900 rounded-r p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center overflow-hidden shrink-0">
                  <span className="text-sm">🤖</span>
                </span>
                <span className="font-semibold">PowerBot Watchdog</span>
              </div>

              <div>
                <h3 className="font-semibold mb-4">PowerBot Monitoring Übersicht:</h3>
                
                {services.map((service, index) => (
                  <div key={index} className="mb-4">
                    {service.online ? (
                      <div className="flex items-start">
                        <CheckCircle className="text-green-400 mr-2 shrink-0 mt-1" size={20} />
                        <div>
                          <div className="font-semibold">{service.name}</div>
                          <div className="text-gray-400">
                            Online {service.responseTime ? `(${service.responseTime} ms)` : ''}
                          </div>
                          <div className="text-gray-400">Uptime: {service.uptime.toFixed(2)}%</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start">
                        <AlertCircle className="text-orange-400 mr-2 shrink-0 mt-1" size={20} />
                        <div>
                          <div className="font-semibold">{service.name}</div>
                          <div className="text-orange-400">{service.message}</div>
                          <div className="text-gray-400">Response Time: {service.responseTime} ms</div>
                          <div className="text-gray-400">Rate Limits: ok</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="py-3 px-4 border-t border-gray-700 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center overflow-hidden shrink-0">
              <span>🎂</span>
            </div>
            <span>Fertig? Sieh dir #🎉 | geburtstag an.</span>
            <div className="flex-grow"></div>
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-xl">➡️</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
