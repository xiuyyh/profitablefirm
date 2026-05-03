
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  icon: LucideIcon;
  variant?: "default" | "accent";
}

export function MetricCard({
  title,
  value,
  trend,
  trendLabel,
  icon: Icon,
  variant = "default",
}: MetricCardProps) {
  const isPositive = trend && trend > 0;

  return (
    <Card className={cn(
      "border-none shadow-sm transition-transform hover:scale-[1.02]",
      variant === "accent" ? "bg-primary text-white" : "bg-white"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-4">
          <p className={cn(
            "text-sm font-medium",
            variant === "accent" ? "text-white/70" : "text-muted-foreground"
          )}>
            {title}
          </p>
          <div className={cn(
            "p-2 rounded-lg",
            variant === "accent" ? "bg-white/10" : "bg-secondary/10 text-secondary"
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight">{value}</h2>
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 pt-1">
              <span className={cn(
                "flex items-center text-xs font-semibold px-2 py-0.5 rounded-full",
                isPositive 
                  ? (variant === "accent" ? "bg-white/20 text-white" : "bg-green-100 text-green-700")
                  : (variant === "accent" ? "bg-red-400/20 text-red-100" : "bg-red-100 text-red-700")
              )}>
                {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {Math.abs(trend)}%
              </span>
              <span className={cn(
                "text-xs",
                variant === "accent" ? "text-white/60" : "text-muted-foreground"
              )}>
                {trendLabel || "vs last month"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
