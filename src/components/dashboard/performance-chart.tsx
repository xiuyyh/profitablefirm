
"use client";

import { 
  Line, 
  LineChart, 
  ResponsiveContainer, 
  Tooltip, 
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
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const data = [
  { date: "Jan", value: 45000 },
  { date: "Feb", value: 47200 },
  { date: "Mar", value: 46800 },
  { date: "Apr", value: 49500 },
  { date: "May", value: 52100 },
  { date: "Jun", value: 51200 },
  { date: "Jul", value: 54800 },
  { date: "Aug", value: 58900 },
  { date: "Sep", value: 57400 },
  { date: "Oct", value: 61200 },
  { date: "Nov", value: 64500 },
  { date: "Dec", value: 68200 },
];

const chartConfig = {
  value: {
    label: "Portfolio Value",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

export function PerformanceChart() {
  return (
    <Card className="border-none shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-8">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold">Historical Performance</CardTitle>
          <CardDescription>Visualizing your wealth growth over time</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <AreaChart data={data} margin={{ left: 12, right: 12, top: 12 }}>
            <defs>
              <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.1} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Area
              dataKey="value"
              type="monotone"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#fillValue)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
