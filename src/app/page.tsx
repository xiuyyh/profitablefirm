
"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { 
  DollarSign, 
  TrendingUp, 
  Briefcase, 
  Activity, 
  Bell, 
  Search,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const recentInvestments = [
  { name: "Apple Inc.", ticker: "AAPL", type: "Stock", value: "$12,450.00", change: "+1.2%", status: "positive" },
  { name: "Vanguard S&P 500 ETF", ticker: "VOO", type: "ETF", value: "$28,900.00", change: "-0.4%", status: "negative" },
  { name: "Tesla Motors", ticker: "TSLA", type: "Stock", value: "$8,210.00", change: "+4.7%", status: "positive" },
  { name: "Bitcoin", ticker: "BTC", type: "Crypto", value: "$5,320.00", change: "+12.1%", status: "positive" },
];

export default function Dashboard() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <SidebarTrigger />
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search investments..."
                className="pl-9 bg-muted/50 border-none focus-visible:ring-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-secondary rounded-full border-2 border-white"></span>
            </Button>
            <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center text-primary font-bold">
              JS
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back, John. Here is your portfolio summary.</p>
            </div>
            <div className="flex gap-2">
              <Button className="bg-primary hover:bg-primary/90">
                <PlusCircle className="h-4 w-4 mr-2" /> Add Investment
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard 
              title="Total Portfolio Value" 
              value="$142,580.42" 
              trend={8.2} 
              icon={DollarSign}
              variant="accent"
            />
            <MetricCard 
              title="Overall Returns" 
              value="+$24,192.00" 
              trend={12.4} 
              icon={TrendingUp}
            />
            <MetricCard 
              title="Daily Gains" 
              value="+$1,420.50" 
              trend={1.2} 
              icon={Activity}
              trendLabel="today"
            />
            <MetricCard 
              title="Active Assets" 
              value="12" 
              icon={Briefcase}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <PerformanceChart />
            </div>
            <div className="space-y-8">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl font-bold">Asset Allocation</CardTitle>
                  <CardDescription>Diversification by asset type</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Stocks", value: 65, color: "bg-primary" },
                    { label: "Bonds", value: 20, color: "bg-secondary" },
                    { label: "Cash", value: 10, color: "bg-accent" },
                    { label: "Other", value: 5, color: "bg-muted-foreground" },
                  ].map((asset) => (
                    <div key={asset.label} className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{asset.label}</span>
                        <span className="text-muted-foreground">{asset.value}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${asset.color}`} 
                          style={{ width: `${asset.value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm bg-secondary text-primary">
                <CardHeader>
                  <CardTitle className="text-lg">AI Insight</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium leading-relaxed">
                    "Your tech exposure is currently 42%. Consider diversifying into emerging markets to hedge against sector-specific volatility."
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-none shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Top Investments</CardTitle>
                <CardDescription>Your best performing assets currently</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Asset</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">24h Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvestments.map((inv) => (
                    <TableRow key={inv.ticker}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{inv.name}</span>
                          <span className="text-xs text-muted-foreground">{inv.ticker}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-secondary/20 text-primary hover:bg-secondary/30">
                          {inv.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{inv.value}</TableCell>
                      <TableCell className="text-right">
                        <span className={`inline-flex items-center gap-1 ${inv.status === 'positive' ? 'text-green-600' : 'text-red-600'} font-medium`}>
                          {inv.status === 'positive' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {inv.change}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </div>
  );
}
