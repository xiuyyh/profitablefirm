
"use client";

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

const data = [
  { date: "JAN", value: 45000 },
  { date: "FEB", value: 47200 },
  { date: "MAR", value: 46800 },
  { date: "APR", value: 49500 },
  { date: "MAY", value: 52100 },
  { date: "JUN", value: 51200 },
  { date: "JUL", value: 54800 },
  { date: "AUG", value: 58900 },
  { date: "SEP", value: 57400 },
  { date: "OCT", value: 61200 },
  { date: "NOV", value: 64500 },
  { date: "DEC", value: 68200 },
];

const chartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function PerformanceChart() {
  return (
    <Card className="border border-border bg-card shadow-none h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Performance Over Time</CardTitle>
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
