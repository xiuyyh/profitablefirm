
"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Terminal
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, doc, serverTimestamp } from "firebase/firestore";

export default function InvestmentsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: "",
    symbol: "",
    type: "Stock",
    quantity: "",
    price: "",
  });

  const investmentsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, "investorProfiles", user.uid, "investments");
  }, [firestore, user?.uid]);

  const { data: investments, isLoading } = useCollection(investmentsQuery);

  const handleAddAsset = () => {
    if (!firestore || !user || !newAsset.name || !newAsset.symbol) return;

    const colRef = collection(firestore, "investorProfiles", user.uid, "investments");
    addDocumentNonBlocking(colRef, {
      investorId: user.uid,
      name: newAsset.name,
      symbol: newAsset.symbol.toUpperCase(),
      type: newAsset.type,
      quantity: Number(newAsset.quantity),
      purchasePricePerUnit: Number(newAsset.price),
      currentMarketPricePerUnit: Number(newAsset.price),
      currency: "USD",
      purchaseDate: serverTimestamp(),
      lastPriceUpdate: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setIsAddOpen(false);
    setNewAsset({ name: "", symbol: "", type: "Stock", quantity: "", price: "" });
  };

  const handleDelete = (id: string) => {
    if (!firestore || !user) return;
    const docRef = doc(firestore, "investorProfiles", user.uid, "investments", id);
    deleteDocumentNonBlocking(docRef);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-card sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <h1 className="text-xl font-bold">Investments</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="h-8 border-border uppercase text-[10px] font-bold tracking-widest">
              <Download className="h-3 w-3 mr-2" /> Export
            </Button>
            
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 px-4 bg-primary text-primary-foreground font-bold uppercase text-[10px] tracking-widest">
                  <Plus className="h-3 w-3 mr-2" /> Add Investment
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="uppercase tracking-widest text-sm font-bold">Add New Investment</DialogTitle>
                  <DialogDescription className="text-xs uppercase tracking-tight text-muted-foreground">
                    Enter the details of your new investment below.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Name</Label>
                    <Input
                      id="name"
                      value={newAsset.name}
                      onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                      className="col-span-3 bg-background border-border"
                      placeholder="Apple Inc."
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="symbol" className="text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ticker</Label>
                    <Input
                      id="symbol"
                      value={newAsset.symbol}
                      onChange={(e) => setNewAsset({ ...newAsset, symbol: e.target.value })}
                      className="col-span-3 bg-background border-border uppercase"
                      placeholder="AAPL"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type</Label>
                    <Select value={newAsset.type} onValueChange={(v) => setNewAsset({ ...newAsset, type: v })}>
                      <SelectTrigger className="col-span-3 bg-background border-border">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="Stock">Stock</SelectItem>
                        <SelectItem value="ETF">ETF</SelectItem>
                        <SelectItem value="Crypto">Crypto</SelectItem>
                        <SelectItem value="Bond">Bond</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="qty" className="text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quantity</Label>
                    <Input
                      id="qty"
                      type="number"
                      value={newAsset.quantity}
                      onChange={(e) => setNewAsset({ ...newAsset, quantity: e.target.value })}
                      className="col-span-3 bg-background border-border"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Unit Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newAsset.price}
                      onChange={(e) => setNewAsset({ ...newAsset, price: e.target.value })}
                      className="col-span-3 bg-background border-border"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddAsset} className="w-full bg-primary font-bold uppercase tracking-widest text-[10px]">Add Investment</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <main className="p-6 md:p-8 space-y-6 w-full">
          <Card className="border-border bg-card shadow-none">
            <CardHeader className="pb-4 border-b">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search investments..."
                    className="pl-9 bg-background border-border h-9 text-xs focus-visible:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-9 border-border text-[10px] font-bold uppercase tracking-widest">
                    <Filter className="h-3 w-3 mr-2" /> Filter
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <Terminal className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/20 border-border">
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Asset</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Type</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider">Quantity</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider">Purchase Price</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider">Current Price</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider">Gain/Loss</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investments?.map((inv) => {
                      const value = inv.currentMarketPricePerUnit * inv.quantity;
                      const cost = inv.purchasePricePerUnit * inv.quantity;
                      const pnl = value - cost;
                      const pnlPerc = cost > 0 ? (pnl / cost) * 100 : 0;
                      
                      return (
                        <TableRow key={inv.id} className="border-border hover:bg-muted/30">
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{inv.name}</span>
                              <span className="text-[10px] font-mono text-muted-foreground uppercase">{inv.symbol}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 border-border bg-muted/50">
                              {inv.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">{inv.quantity.toLocaleString()}</TableCell>
                          <TableCell className="text-right font-mono text-xs">${inv.purchasePricePerUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold">${inv.currentMarketPricePerUnit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right">
                            <span className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {pnl >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                              {pnlPerc >= 0 ? '+' : ''}{pnlPerc.toFixed(2)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card border-border">
                                <DropdownMenuLabel className="text-[10px] uppercase font-bold">Actions</DropdownMenuLabel>
                                <DropdownMenuItem className="text-xs uppercase">View History</DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem onClick={() => handleDelete(inv.id)} className="text-xs uppercase text-destructive font-bold">
                                  Delete Investment
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {!investments?.length && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-20">
                          <div className="flex flex-col items-center gap-2 opacity-50">
                            <Terminal className="h-6 w-6" />
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em]">No investments found</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </div>
  );
}
