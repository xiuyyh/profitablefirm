
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
  Unlock
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

  // SYNCED HIGH-FREQUENCY TICKER (PAUSES ON STATIC)
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

  // LEDGER ACCOUNTING
  const ledgerBalance = useMemo(() => {
    const calculated = transactions?.reduce((sum, tx) => {
      if (tx.type === 'Withdrawal') return sum - tx.amount;
      return sum + tx.amount;
    }, 0) || 0;
    return investorProfile?.manualLedgerOverride ?? calculated;
  }, [transactions, investorProfile]);

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
      title: yieldConfig.enabled ? "Protocol Online" : "Protocol Suspended",
      description: `Neural Link ${yieldConfig.enabled ? 'activated' : 'deactivated'}. Account balance is now ${yieldConfig.enabled ? 'active' : 'static'}.`,
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
      variant: "destructive",
      title: "System Override Executed",
      description: "Manual financial parameters have been committed to the neural core.",
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
      description: `Neural Provisioning: ${type} Allocation`,
      status: "Completed",
      createdAt: serverTimestamp()
    });

    setTimeout(() => {
      setIsProvisioning(false);
      toast({
        title: "Portfolio Provisioned",
        description: `Neural Link loaded ${selected.length} assets. Capital basis adjusted.`,
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
      description: `Injected ${newTransaction.type} of $${newTransaction.amount}.`,
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
            <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/5 font-mono text-[10px] uppercase tracking-widest">
              ID: {investorId.substring(0, 12)}...
            </Badge>
          </div>
        </header>

        <main className="p-6 md:p-8 space-y-6 w-full max-w-none">
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <div className="h-16 w-16 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
              {investorProfile.firstName?.substring(0, 1).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{investorProfile.firstName} {investorProfile.lastName}</h1>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                {investorProfile.email}
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
              title="Engine Status" 
              value={investorProfile.autoProfitEnabled ? "OPERATIONAL" : "STATIC"} 
              icon={Zap}
            />
            <MetricCard 
              title="Financial Ledger" 
              value={`$${ledgerBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              icon={History}
            />
          </div>

          <Tabs defaultValue="yield" className="space-y-6">
            <TabsList className="bg-muted/20 border-border p-1">
              <TabsTrigger value="yield" className="text-[10px] font-bold uppercase tracking-widest px-6">Yield Config</TabsTrigger>
              <TabsTrigger value="ledger" className="text-[10px] font-bold uppercase tracking-widest px-6">Ledger Adjustments</TabsTrigger>
              <TabsTrigger value="override" className="text-[10px] font-bold uppercase tracking-widest px-6">System Override</TabsTrigger>
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
                        <p className="text-[9px] text-muted-foreground uppercase">Toggle trading & market movement</p>
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
                      />
                    </div>

                    <Button onClick={handleSaveYieldConfig} className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px]">
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
                    <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Generate standard high-fidelity holdings based on the selected classification.</p>
                    <Button onClick={handleProvisionAssets} disabled={isProvisioning} variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10 font-bold uppercase tracking-widest text-[10px]">
                      {isProvisioning ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Database className="h-3 w-3 mr-2" />}
                      Provision Initial Holdings
                    </Button>
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
                      <Label className="text-[10px] font-bold uppercase tracking-widest">Valuation ($)</Label>
                      <Input type="number" value={newTransaction.amount} onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})} className="bg-background border-border font-mono text-sm" />
                    </div>
                    <Button onClick={handleAddTransaction} className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px]">
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
                          <TableHead className="text-right text-[10px] uppercase font-bold px-6">Value</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions?.map((tx) => (
                          <TableRow key={tx.id} className="border-border hover:bg-muted/30">
                            <TableCell className="text-[10px] font-mono px-6">{tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString() : 'Pending'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[9px] uppercase font-bold px-1.5 py-0 ${tx.type === 'Withdrawal' ? 'border-red-500/30 text-red-500' : 'border-green-500/30 text-green-500'}`}>
                                {tx.type}
                              </Badge>
                            </TableCell>
                            <TableCell className={`text-right font-mono text-xs font-bold px-6 ${tx.type === 'Withdrawal' ? 'text-red-500' : 'text-green-500'}`}>
                              {tx.type === 'Withdrawal' ? '-' : '+'}${tx.amount.toLocaleString()}
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
              <Card className="border-destructive/30 bg-card shadow-none border-dashed">
                <CardHeader className="bg-destructive/10 border-b border-destructive/10">
                  <div className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-destructive">
                    <ShieldAlert className="h-4 w-4" /> System Override Terminal
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <p className="text-[9px] text-muted-foreground uppercase leading-relaxed font-bold tracking-widest">
                    Manual overrides will supersede neural calculations. Leave empty to return to deterministic tracking.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <History className="h-3 w-3" /> Manual Ledger ($)
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
                      <Label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <DollarSign className="h-3 w-3" /> Manual Total AUM ($)
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
                      <Label className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <TrendingUp className="h-3 w-3" /> Manual Net PnL ($)
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
                    <Unlock className="h-3.5 w-3.5 mr-2" /> Execute Security Override
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assets" className="space-y-6">
              <Card className="border-border bg-card shadow-none">
                <CardHeader className="border-b bg-muted/10">
                  <div className="text-sm font-bold uppercase tracking-widest">Holding Portfolio Audit</div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-muted/20 border-border">
                        <TableHead className="text-[10px] uppercase font-bold px-6">Asset</TableHead>
                        <TableHead className="text-[10px] uppercase font-bold">Class</TableHead>
                        <TableHead className="text-right text-[10px] uppercase font-bold px-6">Valuation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {investments?.map((inv) => (
                        <TableRow key={inv.id} className="border-border hover:bg-muted/30">
                          <TableCell className="px-6">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{inv.name}</span>
                              <span className="text-[10px] font-mono text-muted-foreground uppercase">{inv.symbol}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-[9px] uppercase font-bold py-0">{inv.type}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-bold px-6 text-primary">
                            ${(inv.currentMarketPricePerUnit * inv.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
