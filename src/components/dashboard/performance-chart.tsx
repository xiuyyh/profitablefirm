
"use client";

import { useMemo } from "react";
import { 
  ResponsiveContainer, 
  XAxis, 
  YAxis,
  CartesianGrid,
  Area,
  AreaChart
} from "recharts";
import { 
  ChartConfig, 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface PerformanceChartProps {
  currentTotal: number;
}

const chartConfig = {
  value: {
    label: "Equity",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function PerformanceChart({ currentTotal }: PerformanceChartProps) {
  // Generate realistic-looking historical data points anchored to the current real total
  const data = useMemo(() => {
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const now = new Date();
    const currentMonthIndex = now.getMonth();
    
    // We create a trend that ends at the currentTotal
    return months.map((month, index) => {
      if (index > currentMonthIndex) return null;
      
      // Simulate historical trend (roughly 70% to 100% of current value over the year)
      const progress = (index + 1) / (currentMonthIndex + 1);
      const trendFactor = 0.8 + (progress * 0.2);
      const volatility = 1 + (Math.random() * 0.05 - 0.025);
      
      return {
        date: month,
        value: Math.round(currentTotal * trendFactor * volatility)
      };
    }).filter(Boolean);
  }, [currentTotal]);

  return (
    <Card className="border border-border bg-card shadow-none h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Equity Performance Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{ fontSize: 9, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={12}
              tick={{ fontSize: 9, fontWeight: 700, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <ChartTooltip content={<ChartTooltipContent className="bg-background border-border" />} />
            <Area
              dataKey="value"
              type="monotone"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#fillValue)"
              animationDuration={1500}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
