
"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Download,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const allInvestments = [
  { id: "1", name: "Apple Inc.", ticker: "AAPL", type: "Stock", qty: 45, avgPrice: "$145.20", currentPrice: "$182.40", value: "$8,208.00", return: "+25.6%", status: "positive" },
  { id: "2", name: "Microsoft Corp.", ticker: "MSFT", type: "Stock", qty: 20, avgPrice: "$280.10", currentPrice: "$415.60", value: "$8,312.00", return: "+48.4%", status: "positive" },
  { id: "3", name: "Vanguard S&P 500 ETF", ticker: "VOO", type: "ETF", qty: 60, avgPrice: "$390.45", currentPrice: "$472.10", value: "$28,326.00", return: "+20.9%", status: "positive" },
  { id: "4", name: "Bitcoin", ticker: "BTC", type: "Crypto", qty: 0.15, avgPrice: "$42,000.00", currentPrice: "$64,200.00", value: "$9,630.00", return: "+52.8%", status: "positive" },
  { id: "5", name: "Tesla Inc.", ticker: "TSLA", type: "Stock", qty: 15, avgPrice: "$210.00", currentPrice: "$185.30", value: "$2,779.50", return: "-11.7%", status: "negative" },
  { id: "6", name: "NVIDIA Corp.", ticker: "NVDA", type: "Stock", qty: 30, avgPrice: "$120.00", currentPrice: "$850.00", value: "$25,500.00", return: "+608.3%", status: "positive" },
  { id: "7", name: "US Treasury Bond 10Y", ticker: "BOND", type: "Bond", qty: 100, avgPrice: "$98.50", currentPrice: "$95.20", value: "$9,520.00", return: "-3.3%", status: "negative" },
];

export default function InvestmentsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-xl font-bold">Investments</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add Asset
            </Button>
          </div>
        </header>

        <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or ticker..."
                    className="pl-9 bg-muted/50 border-none focus-visible:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" /> Filter
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        Sort by: Performance
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Value (High to Low)</DropdownMenuItem>
                      <DropdownMenuItem>Performance (Best first)</DropdownMenuItem>
                      <DropdownMenuItem>Alphabetical (A-Z)</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Asset</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Avg. Price</TableHead>
                    <TableHead className="text-right">Current Price</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
                    <TableHead className="text-right">Total Return</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allInvestments.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold">{inv.name}</span>
                          <span className="text-xs text-muted-foreground">{inv.ticker}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal capitalize">
                          {inv.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{inv.qty}</TableCell>
                      <TableCell className="text-right">{inv.avgPrice}</TableCell>
                      <TableCell className="text-right">{inv.currentPrice}</TableCell>
                      <TableCell className="text-right font-bold">{inv.value}</TableCell>
                      <TableCell className="text-right">
                        <span className={`inline-flex items-center gap-1 font-semibold ${inv.status === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                          {inv.status === 'positive' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {inv.return}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit Position</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">Sell Asset</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
