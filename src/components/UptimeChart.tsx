
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UptimeDay } from "@/lib/types";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { useTheme } from "@/components/ThemeProvider";

interface UptimeChartProps {
  data: UptimeDay[];
  title?: string;
  days?: number;
  height?: number;
  serviceId?: string | null; // Add serviceId as an optional prop
}

export function UptimeChart({ 
  data, 
  title = "Uptime", 
  days = 30,
  height = 240,
  serviceId = null
}: UptimeChartProps) {
  const { theme } = useTheme();
  const [chartData, setChartData] = useState<any[]>([]);
  
  useEffect(() => {
    // Use the most recent days from the data
    const recentData = data.slice(-days);
    const formattedData = recentData.map(day => ({
      date: day.date,
      uptime: serviceId && day.services[serviceId] 
        ? day.services[serviceId].uptime 
        : day.uptime,
      formattedDate: format(new Date(day.date), "MMM d")
    }));
    
    setChartData(formattedData);
  }, [data, days, serviceId]); // Add serviceId to dependency array

  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`h-[${height}px]`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid 
                stroke={isDark ? "#374151" : "#e5e7eb"} 
                strokeDasharray="3 3" 
                vertical={false}
              />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 12 }} 
                stroke={isDark ? "#9ca3af" : "#6b7280"}
                tickMargin={10}
                tickFormatter={(value) => value}
                minTickGap={30}
              />
              <YAxis 
                domain={[90, 100]} 
                tick={{ fontSize: 12 }} 
                stroke={isDark ? "#9ca3af" : "#6b7280"}
                tickMargin={10}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isDark ? "#1f2937" : "#ffffff",
                  borderColor: isDark ? "#374151" : "#e5e7eb",
                  borderRadius: "0.375rem",
                  fontSize: "0.875rem",
                  color: isDark ? "#f3f4f6" : "#1f2937",
                }}
                labelFormatter={(value) => `Date: ${value}`}
                formatter={(value: any) => [`${value.toFixed(2)}%`, "Uptime"]}
              />
              <Area 
                type="monotone" 
                dataKey="uptime" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#uptimeGradient)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
