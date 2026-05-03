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
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <Card className={cn(
      "relative border-border bg-card/80 backdrop-blur-md shadow-none transition-all hover:bg-card hover:border-primary/40 group overflow-hidden",
      variant === "accent" ? "border-primary/30 bg-primary/5" : "border-glow"
    )}>
      <div className="scan-line" />
      <CardContent className="p-5">
        <div className="flex items-center justify-between space-y-0 pb-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">
            {title}
          </p>
          <div className="p-2 rounded-sm bg-muted/30 border border-primary/10 group-hover:border-primary/40 transition-all">
            <Icon className="h-4 w-4 text-primary glow-text" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black tracking-tighter font-mono text-foreground glow-text">
            {value}
          </h2>
          {trend !== undefined && (
            <div className="flex items-center gap-2 pt-2">
              <span className={cn(
                "flex items-center text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm border",
                isPositive 
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-destructive/10 text-destructive border-destructive/20"
              )}>
                {isPositive ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                {isPositive ? "+" : "-"}{Math.abs(trend).toFixed(2)}%
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                {trendLabel || "DELTA"}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}