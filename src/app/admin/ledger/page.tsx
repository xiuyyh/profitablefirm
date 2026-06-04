"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  Globe, 
  Terminal, 
  ShieldAlert,
  Filter,
  Download,
  User as UserIcon,
  Activity,
  Search,
  Database
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { collectionGroup, doc } from "firebase/firestore";

export default function GlobalLedgerPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "investorProfiles", user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !profile || profile.role !== "admin") return null;
    return collectionGroup(firestore, "transactions");
  }, [firestore, profile]);

  const { data: rawTransactions, isLoading } = useCollection(transactionsQuery);

  const transactions = useMemo(() => {
    if (!rawTransactions) return [];
    
    return [...rawTransactions]
      .filter(tx => 
        tx.investorId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
  }, [rawTransactions, searchTerm]);

  const totalVolume = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  }, [transactions]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login");
    }
    if (profile && profile.role !== "admin") {
      router.push("/");
    }
  }, [user, isUserLoading, profile, router]);

  if (isUserLoading || isProfileLoading || !profile || profile.role !== "admin") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Terminal className="h-8 w-8 animate-pulse text-primary" />
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
            <h1 className="text-xl font-bold flex items-center gap-2 glow-text truncate">
              <Globe className="h-5 w-5 text-primary shrink-0" />
              <span className="truncate">GLOBAL LEDGER TERMINAL</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest border-primary/20 text-primary">
              <Download className="h-3 w-3 mr-2" /> EXPORT AUDIT LOG
            </Button>
          </div>
        </header>

        <main className="p-6 md:p-8 space-y-6 w-full max-w-none overflow-x-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-primary/5 border-primary/20 shadow-none border-glow overflow-hidden min-w-0">
              <CardContent className="pt-6 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate mr-2">TOTAL THROUGHPUT</span>
                  <Activity className="h-4 w-4 text-primary opacity-50 shrink-0" />
                </div>
                <h3 className="text-2xl font-black mt-2 font-mono glow-text truncate" title={`$${totalVolume.toLocaleString()}`}>
                  ${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
                <p className="text-[9px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter truncate">Aggregated network volume</p>
              </CardContent>
            </Card>
            <Card className="bg-card border-border shadow-none border-glow overflow-hidden min-w-0">
              <CardContent className="pt-6 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground truncate mr-2">NODE ACTIVITY</span>
                  <Database className="h-4 w-4 text-primary opacity-50 shrink-0" />
                </div>
                <h3 className="text-2xl font-black mt-2 font-mono truncate">{transactions.length}</h3>
                <p className="text-[9px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter truncate">Total historical events</p>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20 shadow-none overflow-hidden min-w-0">
              <CardContent className="pt-6 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-destructive truncate mr-2">SECURITY LEVEL</span>
                  <ShieldAlert className="h-4 w-4 text-destructive opacity-50 shrink-0" />
                </div>
                <h3 className="text-2xl font-black mt-2 font-mono text-destructive uppercase italic truncate">L4 TERMINAL</h3>
                <p className="text-[9px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter truncate">End-to-end audit enabled</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card shadow-none border-glow overflow-hidden min-w-0">
            <CardHeader className="border-b bg-muted/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="min-w-0">
                <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground truncate">Global Statement of Activity</CardTitle>
                <CardDescription className="text-[9px] uppercase mt-1 tracking-widest truncate">High-fidelity cross-investor financial history</CardDescription>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                 <div className="relative w-full md:w-[240px]">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="FILTER NODES..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-9 pl-8 text-xs bg-background border-border w-full font-mono rounded-none" 
                    />
                 </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {isLoading ? (
                <div className="h-60 flex items-center justify-center">
                  <Terminal className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/20 border-border">
                      <TableHead className="text-[10px] uppercase font-black tracking-widest px-6 h-12 whitespace-nowrap">Timestamp</TableHead>
                      <TableHead className="text-[10px] uppercase font-black tracking-widest h-12 whitespace-nowrap">Investor Node</TableHead>
                      <TableHead className="text-[10px] uppercase font-black tracking-widest h-12 whitespace-nowrap">Protocol</TableHead>
                      <TableHead className="text-[10px] uppercase font-black tracking-widest h-12 whitespace-nowrap">Description</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-black tracking-widest px-6 h-12 whitespace-nowrap">Delta (USD)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id} className="border-border hover:bg-primary/5 transition-all">
                        <TableCell className="font-mono text-[10px] font-bold text-muted-foreground px-6 whitespace-nowrap">
                          {tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleString() : 'PENDING'}
                        </TableCell>
                        <TableCell>
                          <span className="text-[9px] font-mono uppercase bg-muted px-2 py-0.5 rounded-none border border-border text-foreground whitespace-nowrap">
                            {tx.investorId?.substring(0, 12)}...
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-none whitespace-nowrap ${
                            tx.type === 'Deposit' ? 'border-green-500/30 text-green-500' : 
                            tx.type === 'Bonus' ? 'border-yellow-500/30 text-yellow-500' : 
                            tx.type === 'Withdrawal' ? 'border-red-500/30 text-red-500' : 'border-primary/30 text-primary'
                          }`}>
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase truncate block max-w-[200px]">{tx.description}</span>
                        </TableCell>
                        <TableCell className={`text-right font-mono text-xs font-black px-6 whitespace-nowrap ${tx.type === 'Withdrawal' ? 'text-red-500' : 'text-green-500 glow-text'}`}>
                          {tx.type === 'Withdrawal' ? '-' : '+'}${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!transactions.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-32">
                          <div className="flex flex-col items-center gap-4 opacity-30">
                            <Terminal className="h-12 w-12 mb-2" />
                            <span className="text-[10px] uppercase font-black tracking-[0.5em]">ZERO ACTIVITY RECORDS ON NETWORK</span>
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
    </>
  );
}
