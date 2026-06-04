"use client";

import { useEffect, use, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  ArrowLeft, 
  Briefcase, 
  DollarSign, 
  TrendingUp, 
  Terminal,
  ShieldAlert,
  Calendar,
  Mail,
  Trash2,
  Zap,
  Save,
  PlusCircle,
  History,
  Database,
  Loader2,
  Lock,
  Unlock,
  Activity,
  CheckCircle2,
  XCircle,
  Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { collection, doc, serverTimestamp } from "firebase/firestore";
import { MetricCard } from "@/components/dashboard/metric-card";
import { deleteDocumentNonBlocking, updateDocumentNonBlocking, addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function InvestorInspectPage({ params }: { params: Promise<{ investorId: string }> }) {
  const { investorId } = use(params);
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [yieldConfig, setYieldConfig] = useState({
    enabled: false,
    amount: "0",
    assetType: "Crypto"
  });
  
  const [manualOverrides, setManualOverrides] = useState({
    ledger: "",
    aum: "",
    pnl: ""
  });

  const [isInitialized, setIsInitialized] = useState(false);
  const [marketNoise, setMarketNoise] = useState(1);
  const [isProvisioning, setIsProvisioning] = useState(false);

  const [newTransaction, setNewTransaction] = useState({
    type: "Deposit",
    amount: "",
    description: ""
  });

  const adminProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "investorProfiles", user.uid);
  }, [firestore, user?.uid]);

  const { data: adminProfile } = useDoc(adminProfileRef);

  const targetProfileRef = useMemoFirebase(() => {
    if (!firestore || !investorId) return null;
    return doc(firestore, "investorProfiles", investorId);
  }, [firestore, investorId]);

  const { data: investorProfile, isLoading: isProfileLoading } = useDoc(targetProfileRef);

  useEffect(() => {
    if (investorProfile && !isInitialized) {
      setYieldConfig({
        enabled: investorProfile.autoProfitEnabled || false,
        amount: investorProfile.dailyProfitAmount?.toString() || "0",
        assetType: investorProfile.profitAssetType || "Crypto"
      });
      setManualOverrides({
        ledger: investorProfile.manualLedgerOverride?.toString() || "",
        aum: investorProfile.manualAumOverride?.toString() || "",
        pnl: investorProfile.manualPnlOverride?.toString() || ""
      });
      setIsInitialized(true);
    }
  }, [investorProfile, isInitialized]);

  useEffect(() => {
    if (!investorProfile?.autoProfitEnabled) {
      setMarketNoise(1);
      return;
    }
    const interval = setInterval(() => {
      const noise = 0.999 + (Math.random() * 0.002);
      setMarketNoise(noise);
    }, 400);
    return () => clearInterval(interval);
  }, [investorProfile?.autoProfitEnabled]);

  const investmentsQuery = useMemoFirebase(() => {
    if (!firestore || !investorId) return null;
    return collection(firestore, "investorProfiles", investorId, "investments");
  }, [firestore, investorId]);

  const { data: rawInvestments, isLoading: isInvestmentsLoading } = useCollection(investmentsQuery);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !investorId) return null;
    return collection(firestore, "investorProfiles", investorId, "transactions");
  }, [firestore, investorId]);

  const { data: rawTransactions, isLoading: isTransactionsLoading } = useCollection(transactionsQuery);

  const investments = useMemo(() => {
    if (!rawInvestments) return null;
    return [...rawInvestments].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawInvestments]);

  const transactions = useMemo(() => {
    if (!rawTransactions) return null;
    return [...rawTransactions].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawTransactions]);

  const pendingTransactions = useMemo(() => {
    return transactions?.filter(tx => tx.status === 'Pending') || [];
  }, [transactions]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
    if (adminProfile && adminProfile.role !== "admin") {
      router.push("/");
    }
  }, [user, isUserLoading, adminProfile, router]);

  const ledgerBalance = useMemo(() => {
    const calculated = transactions?.reduce((sum, tx) => {
      if (tx.status !== 'Completed') return sum;
      if (tx.type === 'Withdrawal') return sum - tx.amount;
      return sum + tx.amount;
    }, 0) || 0;
    return investorProfile?.manualLedgerOverride ?? calculated;
  }, [transactions, investorProfile]);

  const netExternalCapital = useMemo(() => {
    const assetCostBasis = investments?.reduce((sum, inv) => sum + (inv.purchasePricePerUnit * inv.quantity), 0) || 0;
    const netCashInjected = transactions?.reduce((sum, tx) => {
      if (tx.status !== 'Completed') return sum;
      if (tx.type === 'Deposit') return sum + tx.amount;
      if (tx.type === 'Withdrawal') return sum - tx.amount;
      return sum;
    }, 0) || 0;
    return assetCostBasis + netCashInjected;
  }, [investments, transactions]);

  const baseInvestmentValue = useMemo(() => {
    return investments?.reduce((sum, inv) => sum + (inv.currentMarketPricePerUnit * inv.quantity), 0) || 0;
  }, [investments]);

  const settledAUM = investorProfile?.manualAumOverride ?? (baseInvestmentValue + ledgerBalance);
  const liveAUM = settledAUM * marketNoise;
  const netPnL = investorProfile?.manualPnlOverride ?? (settledAUM - netExternalCapital);
  const pnlPercentage = netExternalCapital > 0 ? (netPnL / netExternalCapital) * 100 : 0;

  const handleSaveYieldConfig = () => {
    if (!firestore || !investorId) return;
    
    const docRef = doc(firestore, "investorProfiles", investorId);
    updateDocumentNonBlocking(docRef, {
      autoProfitEnabled: yieldConfig.enabled,
      dailyProfitAmount: Number(yieldConfig.amount),
      profitAssetType: yieldConfig.assetType,
      updatedAt: serverTimestamp()
    });

    toast({
      title: yieldConfig.enabled ? "Trading Started" : "Trading Paused",
      description: `Account is now ${yieldConfig.enabled ? 'active' : 'static'}.`,
    });
  };

  const handleExecuteOverride = () => {
    if (!firestore || !investorId) return;

    const docRef = doc(firestore, "investorProfiles", investorId);
    updateDocumentNonBlocking(docRef, {
      manualLedgerOverride: manualOverrides.ledger ? Number(manualOverrides.ledger) : null,
      manualAumOverride: manualOverrides.aum ? Number(manualOverrides.aum) : null,
      manualPnlOverride: manualOverrides.pnl ? Number(manualOverrides.pnl) : null,
      updatedAt: serverTimestamp()
    });

    toast({
      title: "Manual Changes Saved",
      description: "Balance details have been updated manually.",
    });
  };

  const handleApproveTransaction = (txId: string) => {
    if (!firestore || !investorId) return;
    const docRef = doc(firestore, "investorProfiles", investorId, "transactions", txId);
    updateDocumentNonBlocking(docRef, {
      status: "Completed",
      updatedAt: serverTimestamp()
    });
    toast({
      title: "Payment Approved",
      description: "Money has been added to the user's balance.",
    });
  };

  const handleDeclineTransaction = (txId: string) => {
    if (!firestore || !investorId) return;
    const docRef = doc(firestore, "investorProfiles", investorId, "transactions", txId);
    updateDocumentNonBlocking(docRef, {
      status: "Failed",
      updatedAt: serverTimestamp()
    });
    toast({
      variant: "destructive",
      title: "Payment Declined",
      description: "The request has been marked as failed.",
    });
  };

  const handleProvisionAssets = async () => {
    if (!firestore || !investorId) return;
    setIsProvisioning(true);

    const type = yieldConfig.assetType;
    const colRef = collection(firestore, "investorProfiles", investorId, "investments");
    const transRef = collection(firestore, "investorProfiles", investorId, "transactions");

    const assetData: Record<string, Array<{name: string, symbol: string, price: number}>> = {
      "Crypto": [
        { name: "Bitcoin", symbol: "BTC", price: 64200 },
        { name: "Ethereum", symbol: "ETH", price: 3450 }
      ],
      "Stock": [
        { name: "Apple Inc.", symbol: "AAPL", price: 189 },
        { name: "Nvidia Corp.", symbol: "NVDA", price: 875 }
      ]
    };

    const selected = assetData[type] || assetData["Stock"];
    const allocationPool = Math.max(ledgerBalance, 10); 
    const perAssetAllocation = allocationPool / selected.length;

    selected.forEach((asset) => {
      const quantity = perAssetAllocation / asset.price;
      addDocumentNonBlocking(colRef, {
        investorId,
        name: asset.name,
        symbol: asset.symbol,
        type: type,
        quantity: quantity,
        purchasePricePerUnit: asset.price,
        currentMarketPricePerUnit: asset.price,
        currency: "USD",
        purchaseDate: serverTimestamp(),
        lastPriceUpdate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    });

    addDocumentNonBlocking(transRef, {
      investorId,
      type: "Withdrawal",
      amount: allocationPool,
      currency: "USD",
      description: `Asset Setup: ${type} Allocation`,
      status: "Completed",
      createdAt: serverTimestamp()
    });

    setTimeout(() => {
      setIsProvisioning(false);
      toast({
        title: "Sample Assets Added",
        description: `Successfully added ${selected.length} assets to the portfolio.`,
      });
    }, 1500);
  };

  const handleAddTransaction = () => {
    if (!firestore || !investorId || !newTransaction.amount) return;

    const colRef = collection(firestore, "investorProfiles", investorId, "transactions");
    addDocumentNonBlocking(colRef, {
      investorId,
      type: newTransaction.type,
      amount: Number(newTransaction.amount),
      currency: "USD",
      description: newTransaction.description || `${newTransaction.type} recorded by admin`,
      status: "Completed",
      createdAt: serverTimestamp()
    });

    toast({
      title: "Balance Adjusted",
      description: `Added ${newTransaction.type} of $${newTransaction.amount}.`,
    });

    setNewTransaction({ type: "Deposit", amount: "", description: "" });
  };

  if (isUserLoading || isProfileLoading || !adminProfile || adminProfile.role !== "admin") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Terminal className="h-8 w-8 animate-pulse text-destructive" />
      </div>
    );
  }

  return (
    <>
      <AppSidebar />
      <SidebarInset className="w-full">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-card sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border mx-2" />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/admin")}
              className="h-8 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground shrink-0"
            >
              <ArrowLeft className="h-3 w-3 mr-1" /> Go Back
            </Button>
          </div>
          <div className="flex items-center gap-4 min-w-0">
            <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/5 font-mono text-[10px] uppercase tracking-widest truncate">
              USER ID: {investorId.substring(0, 12)}...
            </Badge>
          </div>
        </header>

        <main className="p-6 md:p-8 space-y-6 w-full max-w-none overflow-x-hidden">
          <div className="flex items-center gap-4 border-b border-border pb-6 min-w-0">
            <div className="h-16 w-16 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
              {investorProfile.firstName?.substring(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">{investorProfile.firstName} {investorProfile.lastName}</h1>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1 truncate">
                {investorProfile.email}
              </div>
            </div>
          </div>

          {pendingTransactions.length > 0 && (
            <Card className="border-primary/50 bg-primary/5 shadow-none overflow-hidden">
              <CardHeader className="py-3 px-4 bg-primary/10 border-b border-primary/20 flex flex-row items-center justify-between">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <ShieldAlert className="h-3.5 w-3.5 text-primary" /> Pending Payments
                </CardTitle>
                <Badge variant="outline" className="text-[8px] bg-primary/20 text-primary border-primary/30">
                  {pendingTransactions.length} REQUESTS
                </Badge>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-primary/5 border-primary/10">
                      <TableHead className="text-[9px] uppercase font-bold h-8 px-4">Amount</TableHead>
                      <TableHead className="text-[9px] uppercase font-bold h-8">Sender Wallet Address</TableHead>
                      <TableHead className="text-right text-[9px] uppercase font-bold h-8 px-4">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingTransactions.map((tx) => (
                      <TableRow key={tx.id} className="border-primary/10 hover:bg-primary/5">
                        <TableCell className="font-mono text-xs font-bold px-4 py-2">${tx.amount.toLocaleString()}</TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                            <Wallet className="h-3 w-3" /> {tx.senderAddress || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-4 py-2">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => handleApproveTransaction(tx.id)} className="h-7 px-3 bg-green-500 hover:bg-green-600 text-white text-[9px] font-bold uppercase tracking-widest">
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeclineTransaction(tx.id)} className="h-7 px-3 text-[9px] font-bold uppercase tracking-widest">
                              Decline
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard 
              title="Total Balance" 
              value={`$${liveAUM.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              icon={DollarSign}
              variant="accent"
              trend={Number(pnlPercentage.toFixed(2))}
              trendLabel="LIVE STATUS"
            />
            <MetricCard 
              title="Growth Trend" 
              value={`${netPnL >= 0 ? '+' : ''}$${netPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              trend={Number(pnlPercentage.toFixed(2))}
              icon={TrendingUp}
              trendLabel="PROFIT/LOSS"
            />
            <MetricCard 
              title="System Status" 
              value={investorProfile.autoProfitEnabled ? "RUNNING" : "STATIC"} 
              icon={Zap}
            />
            <MetricCard 
              title="Cash Balance" 
              value={`$${ledgerBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              icon={History}
            />
          </div>

          <Tabs defaultValue="yield" className="space-y-6">
            <TabsList className="bg-muted/20 border-border p-1 flex-wrap h-auto">
              <TabsTrigger value="yield" className="text-[10px] font-bold uppercase tracking-widest px-6">Earnings Settings</TabsTrigger>
              <TabsTrigger value="ledger" className="text-[10px] font-bold uppercase tracking-widest px-6">Add/Subtract Balance</TabsTrigger>
              <TabsTrigger value="override" className="text-[10px] font-bold uppercase tracking-widest px-6">Manual Changes</TabsTrigger>
              <TabsTrigger value="assets" className="text-[10px] font-bold uppercase tracking-widest px-6">View Assets</TabsTrigger>
            </TabsList>

            <TabsContent value="yield" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="w-full border-border bg-card shadow-none overflow-hidden">
                  <CardHeader className="bg-muted/10 border-b">
                    <div className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 truncate">
                      <Zap className="h-4 w-4 text-primary shrink-0" /> Automatic Earnings System
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-0.5 min-w-0">
                        <Label className="text-[10px] font-bold uppercase tracking-widest truncate block">Status</Label>
                        <p className="text-[9px] text-muted-foreground uppercase truncate block">Turn on/off automatic daily earnings</p>
                      </div>
                      <Switch 
                        checked={yieldConfig.enabled} 
                        onCheckedChange={(checked) => setYieldConfig({...yieldConfig, enabled: checked})} 
                        className="shrink-0"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest">Daily Earnings Target ($)</Label>
                      <Input 
                        type="number" 
                        value={yieldConfig.amount} 
                        onChange={(e) => setYieldConfig({...yieldConfig, amount: e.target.value})}
                        className="bg-background border-border font-mono text-sm text-foreground"
                      />
                    </div>

                    <Button onClick={handleSaveYieldConfig} className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px]">
                      <Save className="h-3 w-3 mr-2" /> Save Settings
                    </Button>
                  </CardContent>
                </Card>

                <Card className="w-full border-border bg-card shadow-none border-dashed border-primary/30 overflow-hidden">
                  <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <div className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary truncate">
                      <Database className="h-4 w-4 shrink-0" /> Add Sample Assets
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest leading-relaxed">Add a few starting stocks or coins to this user's portfolio.</p>
                    <Button onClick={handleProvisionAssets} disabled={isProvisioning} variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10 font-bold uppercase tracking-widest text-[10px]">
                      {isProvisioning ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Database className="h-3 w-3 mr-2" />}
                      Add Starting Assets
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ledger" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 border-border bg-card shadow-none overflow-hidden">
                  <CardHeader className="bg-muted/10 border-b">
                    <div className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 truncate">
                      <PlusCircle className="h-4 w-4 text-primary shrink-0" /> Manual Entry
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest">Type</Label>
                      <Select value={newTransaction.type} onValueChange={(val) => setNewTransaction({...newTransaction, type: val})}>
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Deposit">Deposit</SelectItem>
                          <SelectItem value="Bonus">Bonus</SelectItem>
                          <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest">Amount ($)</Label>
                      <Input type="number" value={newTransaction.amount} onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})} className="bg-background border-border font-mono text-sm" />
                    </div>
                    <Button onClick={handleAddTransaction} className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px]">
                      <History className="h-3 w-3 mr-2" /> Add to Balance
                    </Button>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-border bg-card shadow-none overflow-hidden">
                  <CardHeader className="bg-muted/10 border-b">
                    <div className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 truncate">
                      <History className="h-4 w-4 shrink-0" /> Activity History
                    </div>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent bg-muted/20 border-border">
                          <TableHead className="text-[10px] uppercase font-bold px-6 h-10 whitespace-nowrap">Date</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold h-10 whitespace-nowrap">Type</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold h-10 whitespace-nowrap">Status</TableHead>
                          <TableHead className="text-right text-[10px] uppercase font-bold px-6 h-10 whitespace-nowrap">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions?.map((tx) => (
                          <TableRow key={tx.id} className="border-border hover:bg-muted/30">
                            <TableCell className="text-[10px] font-mono px-6 whitespace-nowrap">{tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString() : 'Pending'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[9px] uppercase font-bold px-1.5 py-0 whitespace-nowrap ${tx.type === 'Withdrawal' ? 'border-red-500/30 text-red-500' : 'border-green-500/30 text-green-500'}`}>
                                {tx.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[8px] uppercase font-bold px-1 py-0 ${tx.status === 'Completed' ? 'border-green-500/30 text-green-500' : tx.status === 'Pending' ? 'border-yellow-500/30 text-yellow-500' : 'border-red-500/30 text-red-500'}`}>
                                {tx.status}
                              </Badge>
                            </TableCell>
                            <TableCell className={`text-right font-mono text-xs font-bold px-6 whitespace-nowrap ${tx.type === 'Withdrawal' ? 'text-red-500' : 'text-green-500'}`}>
                              {tx.type === 'Withdrawal' ? '-' : '+'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="override" className="space-y-6">
              <Card className="border-destructive/30 bg-card shadow-none border-dashed overflow-hidden">
                <CardHeader className="bg-destructive/10 border-b border-destructive/10">
                  <div className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-destructive truncate">
                    <ShieldAlert className="h-4 w-4 shrink-0" /> Manual Balance Adjustments
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <p className="text-[9px] text-muted-foreground uppercase leading-relaxed font-bold tracking-widest">
                    Use these fields to manually set the numbers displayed to the user. Leave empty to use system defaults.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 truncate">
                        <History className="h-3 w-3 shrink-0" /> Change Cash Balance ($)
                      </Label>
                      <Input 
                        type="number" 
                        value={manualOverrides.ledger} 
                        onChange={(e) => setManualOverrides({...manualOverrides, ledger: e.target.value})}
                        placeholder={ledgerBalance.toString()}
                        className="bg-background border-border font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 truncate">
                        <DollarSign className="h-3 w-3 shrink-0" /> Change Total Balance ($)
                      </Label>
                      <Input 
                        type="number" 
                        value={manualOverrides.aum} 
                        onChange={(e) => setManualOverrides({...manualOverrides, aum: e.target.value})}
                        placeholder={settledAUM.toString()}
                        className="bg-background border-border font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 truncate">
                        <TrendingUp className="h-3 w-3 shrink-0" /> Change Profit/Loss ($)
                      </Label>
                      <Input 
                        type="number" 
                        value={manualOverrides.pnl} 
                        onChange={(e) => setManualOverrides({...manualOverrides, pnl: e.target.value})}
                        placeholder={netPnL.toString()}
                        className="bg-background border-border font-mono text-sm"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleExecuteOverride}
                    variant="destructive"
                    className="w-full font-bold uppercase tracking-widest text-[10px] py-6 border border-destructive/50"
                  >
                    <Save className="h-3.5 w-3.5 mr-2" /> Save Manual Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assets" className="space-y-6">
              <Card className="border-border bg-card shadow-none overflow-hidden">
                <CardHeader className="border-b bg-muted/10">
                  <div className="text-sm font-bold uppercase tracking-widest truncate">Asset List</div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-muted/20 border-border">
                        <TableHead className="text-[10px] uppercase font-bold px-6 h-10 whitespace-nowrap">Asset</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold h-10 whitespace-nowrap">Type</TableHead>
                        <TableHead className="text-right text-[10px] uppercase font-bold px-6 h-10 whitespace-nowrap">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {investments?.map((inv) => (
                        <TableRow key={inv.id} className="border-border hover:bg-muted/30">
                          <TableCell className="px-6 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm uppercase truncate max-w-[150px]">{inv.name}</span>
                              <span className="text-[10px] font-mono text-muted-foreground uppercase">{inv.symbol}</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <Badge variant="secondary" className="text-[9px] uppercase font-bold py-0">{inv.type}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold px-6 text-primary whitespace-nowrap">
                            ${(inv.currentMarketPricePerUnit * inv.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </>
  );
}
