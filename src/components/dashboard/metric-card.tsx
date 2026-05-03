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
      "border border-border bg-card shadow-none transition-colors hover:border-primary/50",
      variant === "accent" ? "bg-primary/5 border-primary/20" : ""
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between space-y-0 pb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {title}
          </p>
          <div className="p-1.5 rounded bg-muted/50 border border-border">
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-2xl font-bold tracking-tighter font-mono">{value}</h2>
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 pt-1">
              <span className={cn(
                "flex items-center text-[10px] font-mono font-bold px-1.5 py-0 rounded border",
                isPositive 
                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                  : "bg-red-500/10 text-red-500 border-red-500/20"
              )}>
                {isPositive ? "+" : "-"}{Math.abs(trend)}%
              </span>
              <span className="text-[10px] uppercase tracking-tighter text-muted-foreground">
                {trendLabel || "PREV CLOSE"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}