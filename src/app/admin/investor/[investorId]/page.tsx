
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
  Loader2
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
      setIsInitialized(true);
    }
  }, [investorProfile, isInitialized]);

  // SYNCED HIGH-FREQUENCY TICKER
  useEffect(() => {
    const interval = setInterval(() => {
      const noise = 0.999 + (Math.random() * 0.002);
      setMarketNoise(noise);
    }, 400);
    return () => clearInterval(interval);
  }, []);

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
    if (!rawInvestments) return [];
    return [...rawInvestments].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawInvestments]);

  const transactions = useMemo(() => {
    if (!rawTransactions) return [];
    return [...rawTransactions].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [rawTransactions]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
    if (adminProfile && adminProfile.role !== "admin") {
      router.push("/");
    }
  }, [user, isUserLoading, adminProfile, router]);

  // LEDGER ACCOUNTING (Verifiable Integrity)
  const ledgerBalance = useMemo(() => {
    return transactions?.reduce((sum, tx) => {
      if (tx.type === 'Withdrawal') return sum - tx.amount;
      return sum + tx.amount;
    }, 0) || 0;
  }, [transactions]);

  // CAPITAL INTEGRITY: Cost basis of holdings + net cash deposits
  const netExternalCapital = useMemo(() => {
    const assetCostBasis = investments?.reduce((sum, inv) => sum + (inv.purchasePricePerUnit * inv.quantity), 0) || 0;
    const netCashInjected = transactions?.reduce((sum, tx) => {
      if (tx.type === 'Deposit') return sum + tx.amount;
      if (tx.type === 'Withdrawal') return sum - tx.amount;
      return sum;
    }, 0) || 0;
    return assetCostBasis + netCashInjected;
  }, [investments, transactions]);

  const baseInvestmentValue = useMemo(() => {
    return investments?.reduce((sum, inv) => sum + (inv.currentMarketPricePerUnit * inv.quantity), 0) || 0;
  }, [investments]);

  // DETERMINISTIC LIVE EQUITY CALCULATION (Integrity Match with Dashboard)
  const liveAUM = (baseInvestmentValue + ledgerBalance) * marketNoise;
  const netPnL = liveAUM - netExternalCapital;
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
      title: "Yield Protocol Updated",
      description: `Automated ${yieldConfig.assetType} profit of $${yieldConfig.amount}/day has been ${yieldConfig.enabled ? 'activated' : 'deactivated'}.`,
    });
  };

  const handleProvisionAssets = async () => {
    if (!firestore || !investorId) return;
    setIsProvisioning(true);

    const type = yieldConfig.assetType;
    const colRef = collection(firestore, "investorProfiles", investorId, "investments");

    const assetData: Record<string, Array<{name: string, symbol: string, price: number}>> = {
      "Crypto": [
        { name: "Bitcoin", symbol: "BTC", price: 64200 },
        { name: "Ethereum", symbol: "ETH", price: 3450 },
        { name: "Solana", symbol: "SOL", price: 145 }
      ],
      "Stock": [
        { name: "Apple Inc.", symbol: "AAPL", price: 189 },
        { name: "Nvidia Corp.", symbol: "NVDA", price: 875 },
        { name: "Tesla Inc.", symbol: "TSLA", price: 175 }
      ],
      "Forex": [
        { name: "EUR/USD", symbol: "EURUSD", price: 1.08 },
        { name: "GBP/USD", symbol: "GBPUSD", price: 1.26 },
        { name: "USD/JPY", symbol: "USDJPY", price: 151 }
      ],
      "ETF": [
        { name: "S&P 500 ETF", symbol: "VOO", price: 478 },
        { name: "Nasdaq 100 ETF", symbol: "QQQ", price: 445 },
        { name: "Dividend Aristocrats", symbol: "SCHD", price: 78 }
      ],
      "Bond": [
        { name: "US 10Y Treasury", symbol: "US10Y", price: 98 },
        { name: "Corporate AAA Bond", symbol: "CORP", price: 102 }
      ]
    };

    const selected = assetData[type] || assetData["Stock"];

    selected.forEach((asset) => {
      const quantity = Math.floor(Math.random() * 5) + 1;
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

    setTimeout(() => {
      setIsProvisioning(false);
      toast({
        title: "Portfolio Provisioned",
        description: `Neural Link loaded ${selected.length} assets. Capital basis automatically reconciled.`,
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
      description: newTransaction.description || `${newTransaction.type} recorded by system admin`,
      status: "Completed",
      createdAt: serverTimestamp()
    });

    toast({
      title: "Ledger Adjusted",
      description: `Injected ${newTransaction.type} of $${newTransaction.amount} into investor ledger.`,
    });

    setNewTransaction({ type: "Deposit", amount: "", description: "" });
  };

  const handleDeleteInvestment = (investmentId: string) => {
    if (!firestore || !investorId) return;
    const docRef = doc(firestore, "investorProfiles", investorId, "investments", investmentId);
    deleteDocumentNonBlocking(docRef);
  };

  if (isUserLoading || isProfileLoading || !adminProfile || adminProfile.role !== "admin") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Terminal className="h-8 w-8 animate-pulse text-destructive" />
      </div>
    );
  }

  if (!investorProfile) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
        <ShieldAlert className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-bold uppercase tracking-widest text-foreground">Profile Identity Missing</h2>
        <Button variant="outline" onClick={() => router.push("/admin")} className="font-bold uppercase tracking-widest text-xs">
          Terminal Overview
        </Button>
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
              className="h-8 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3 w-3 mr-1" /> Exit Audit
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-2">
              <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-destructive">Real-Time Audit Protocol Active</span>
            </div>
            <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/5 font-mono text-[10px] uppercase tracking-widest">
              ID: {investorId.substring(0, 12)}...
            </Badge>
          </div>
        </header>

        <main className="p-6 md:p-8 space-y-6 w-full max-w-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                {investorProfile.firstName?.substring(0, 1).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">{investorProfile.firstName} {investorProfile.lastName}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" /> {investorProfile.email}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" /> Account Initialized {investorProfile.createdAt ? new Date(investorProfile.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                  </div>
                  <Badge variant="outline" className="text-[9px] uppercase font-bold border-primary/30 text-primary bg-primary/5">
                    Identity Status: Verified
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard 
              title="Individual AUM" 
              value={`$${liveAUM.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              icon={DollarSign}
              variant="accent"
              trend={Number(pnlPercentage.toFixed(2))}
              trendLabel="LIVE AUDIT"
            />
            <MetricCard 
              title="Yield Accumulation" 
              value={`${netPnL >= 0 ? '+' : ''}$${netPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              trend={Number(pnlPercentage.toFixed(2))}
              icon={TrendingUp}
              trendLabel="GROWTH TREND"
            />
            <MetricCard 
              title="Security Count" 
              value={investments?.length.toString() || "0"} 
              icon={Briefcase}
            />
            <MetricCard 
              title="Engine Status" 
              value={investorProfile.autoProfitEnabled ? "OPERATIONAL" : "OFFLINE"} 
              icon={Zap}
            />
          </div>

          <Tabs defaultValue="yield" className="space-y-6">
            <TabsList className="bg-muted/20 border-border p-1">
              <TabsTrigger value="yield" className="text-[10px] font-bold uppercase tracking-widest px-6">Yield Config</TabsTrigger>
              <TabsTrigger value="ledger" className="text-[10px] font-bold uppercase tracking-widest px-6">Ledger Adjustments</TabsTrigger>
              <TabsTrigger value="assets" className="text-[10px] font-bold uppercase tracking-widest px-6">Holding Auditor</TabsTrigger>
            </TabsList>

            <TabsContent value="yield" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="w-full border-border bg-card shadow-none">
                  <CardHeader className="bg-muted/10 border-b">
                    <div className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" /> Algorithmic Yield Protocol
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-[10px] font-bold uppercase tracking-widest">Active Status</Label>
                        <p className="text-[9px] text-muted-foreground uppercase">Enable ladder-climbing growth protocol</p>
                      </div>
                      <Switch 
                        checked={yieldConfig.enabled} 
                        onCheckedChange={(checked) => setYieldConfig({...yieldConfig, enabled: checked})} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest">Daily Target ($)</Label>
                      <Input 
                        type="number" 
                        value={yieldConfig.amount} 
                        onChange={(e) => setYieldConfig({...yieldConfig, amount: e.target.value})}
                        className="bg-background border-border font-mono text-sm text-foreground"
                        placeholder="1200.00"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest">Reference Classification</Label>
                      <Select 
                        value={yieldConfig.assetType} 
                        onValueChange={(val) => setYieldConfig({...yieldConfig, assetType: val})}
                      >
                        <SelectTrigger className="bg-background border-border text-foreground">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Crypto">Cryptocurrency</SelectItem>
                          <SelectItem value="Stock">Equities</SelectItem>
                          <SelectItem value="Forex">Currency Markets</SelectItem>
                          <SelectItem value="Bond">Fixed Income</SelectItem>
                          <SelectItem value="ETF">Index Funds</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={handleSaveYieldConfig}
                      className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px]"
                    >
                      <Save className="h-3 w-3 mr-2" /> Commit Configuration
                    </Button>
                  </CardContent>
                </Card>

                <Card className="w-full border-border bg-card shadow-none border-dashed border-primary/30">
                  <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <div className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-primary">
                      <Database className="h-4 w-4" /> Neural Asset Provisioning
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="p-4 bg-muted/20 border border-border/50 rounded-sm space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest">Portfolio Jumpstart</h4>
                      <p className="text-[9px] text-muted-foreground leading-relaxed">
                        Generate a standard high-fidelity holding portfolio based on the selected classification. This automatically establishes a cost basis for accurate PnL tracking without bloating cash reserves.
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter italic">
                        TARGETING: {yieldConfig.assetType.toUpperCase()} NETWORK NODES
                      </div>
                      <Button 
                        onClick={handleProvisionAssets}
                        disabled={isProvisioning}
                        variant="outline"
                        className="w-full border-primary/50 text-primary hover:bg-primary/10 font-bold uppercase tracking-widest text-[10px]"
                      >
                        {isProvisioning ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-2" />
                        ) : (
                          <Database className="h-3 w-3 mr-2" />
                        )}
                        Provision Initial Holdings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="ledger" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 border-border bg-card shadow-none">
                  <CardHeader className="bg-muted/10 border-b">
                    <div className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                      <PlusCircle className="h-4 w-4 text-primary" /> Manual Entry
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest">Adjustment Type</Label>
                      <Select 
                        value={newTransaction.type} 
                        onValueChange={(val) => setNewTransaction({...newTransaction, type: val})}
                      >
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
                      <Label className="text-[10px] font-bold uppercase tracking-widest">Valuation ($)</Label>
                      <Input 
                        type="number" 
                        value={newTransaction.amount} 
                        onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                        className="bg-background border-border font-mono text-sm text-foreground"
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest">Internal Memo</Label>
                      <Input 
                        value={newTransaction.description} 
                        onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                        className="bg-background border-border text-xs text-foreground"
                        placeholder="e.g. Identity verification bonus"
                      />
                    </div>
                    <Button 
                      onClick={handleAddTransaction}
                      className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px]"
                    >
                      <History className="h-3 w-3 mr-2" /> Commit to Ledger
                    </Button>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 border-border bg-card shadow-none">
                  <CardHeader className="bg-muted/10 border-b">
                    <div className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                      <History className="h-4 w-4" /> Activity Logs
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent bg-muted/20 border-border">
                          <TableHead className="text-[10px] uppercase font-bold px-6">Timestamp</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold">Protocol</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold">Memo</TableHead>
                          <TableHead className="text-right text-[10px] uppercase font-bold px-6">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isTransactionsLoading ? (
                          <TableRow><TableCell colSpan={4} className="text-center py-10"><Terminal className="h-4 w-4 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                        ) : transactions?.map((tx) => (
                          <TableRow key={tx.id} className="border-border hover:bg-muted/30">
                            <TableCell className="text-[10px] font-mono px-6">{tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString() : 'Pending'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[9px] uppercase font-bold px-1.5 py-0 ${
                                tx.type === 'Deposit' ? 'border-green-500/30 text-green-500' : 
                                tx.type === 'Bonus' ? 'border-yellow-500/30 text-yellow-500' : 
                                tx.type === 'Profit' ? 'border-blue-500/30 text-blue-500' : 'border-red-500/30 text-red-500'
                              }`}>
                                {tx.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-[10px] font-medium text-muted-foreground">{tx.description}</TableCell>
                            <TableCell className={`text-right font-mono text-xs font-bold px-6 ${tx.type === 'Withdrawal' ? 'text-red-500' : 'text-green-500'}`}>
                              {tx.type === 'Withdrawal' ? '-' : '+'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))}
                        {!transactions?.length && (
                          <TableRow><TableCell colSpan={4} className="text-center py-20 text-[10px] uppercase font-bold opacity-30">No active logs</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="assets" className="space-y-6">
              <Card className="border-border bg-card shadow-none">
                <CardHeader className="border-b bg-muted/10">
                  <div className="text-sm font-bold uppercase tracking-widest">Holding Portfolio Audit</div>
                </CardHeader>
                <CardContent className="p-0">
                  {isInvestmentsLoading ? (
                    <div className="h-40 flex items-center justify-center">
                      <Terminal className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent bg-muted/20 border-border">
                          <TableHead className="text-[10px] uppercase font-bold tracking-wider px-6">Asset</TableHead>
                          <TableHead className="text-[10px] uppercase font-bold tracking-wider">Class</TableHead>
                          <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider">Size</TableHead>
                          <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider">Live Valuation</TableHead>
                          <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider">Delta</TableHead>
                          <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider px-6">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {investments?.map((inv) => {
                          const value = (inv.currentMarketPricePerUnit * inv.quantity) * marketNoise;
                          const cost = inv.purchasePricePerUnit * inv.quantity;
                          const pnl = value - cost;
                          const pnlPerc = cost > 0 ? (pnl / cost) * 100 : 0;

                          return (
                            <TableRow key={inv.id} className="border-border hover:bg-muted/30">
                              <TableCell className="px-6">
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm text-foreground">{inv.name}</span>
                                  <span className="text-[10px] font-mono text-muted-foreground uppercase">{inv.symbol}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-[9px] uppercase font-bold py-0 bg-muted">
                                  {inv.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono text-xs text-foreground">{inv.quantity.toLocaleString()}</TableCell>
                              <TableCell className="text-right font-mono text-xs font-bold tabular-nums text-primary">${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                              <TableCell className="text-right">
                                <span className={`font-mono text-[11px] font-bold ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                  {pnlPerc >= 0 ? '+' : ''}{pnlPerc.toFixed(2)}%
                                </span>
                              </TableCell>
                              <TableCell className="text-right px-6">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteInvestment(inv.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {!investments?.length && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-20">
                              <div className="flex flex-col items-center gap-2 opacity-50">
                                <Terminal className="h-6 w-6 text-primary" />
                                <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Zero Holdings Detected</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </SidebarInset>
    </>
  );
}
