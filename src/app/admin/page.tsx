
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  Users, 
  ShieldAlert, 
  TrendingUp, 
  DollarSign, 
  MoreHorizontal,
  ChevronRight,
  Terminal,
  Activity,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { collection, doc, query, orderBy } from "firebase/firestore";
import { MetricCard } from "@/components/dashboard/metric-card";

export default function AdminControlPanel() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  // Check admin privileges
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, "investorProfiles", user.uid);
  }, [firestore, user?.uid]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef);

  const investorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "investorProfiles"), orderBy("createdAt", "desc"));
  }, [firestore]);

  const { data: investors, isLoading: isInvestorsLoading } = useCollection(investorsQuery);

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
        <Terminal className="h-8 w-8 animate-pulse text-destructive" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground font-body">
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-card sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border mx-2" />
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" />
              Administrative Control Panel
            </h1>
          </div>
          <Badge variant="outline" className="border-destructive/30 text-destructive bg-destructive/5 font-mono text-[10px] uppercase tracking-widest">
            Level 4 Authorization Required
          </Badge>
        </header>

        <main className="p-6 md:p-8 space-y-6 w-full">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <Activity className="h-3 w-3" />
            System Overview
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard 
              title="Total Investors" 
              value={investors?.length.toString() || "0"} 
              icon={Users}
            />
            <MetricCard 
              title="Global AUM" 
              value="$0.00" 
              icon={DollarSign}
              trend={0}
              variant="accent"
            />
            <MetricCard 
              title="Network Status" 
              value="STABLE" 
              icon={Activity}
            />
          </div>

          <Card className="border-border bg-card shadow-none overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest">Active Investor Profiles</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground uppercase mt-1">
                    Manage and monitor identity verification and portfolio status
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold uppercase tracking-widest">
                  Export Audit Log
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isInvestorsLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <Terminal className="h-6 w-6 animate-spin text-destructive" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent bg-muted/10 border-border">
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Identity</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Email Access</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Status</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Registration</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {investors?.map((investor) => (
                      <TableRow key={investor.id} className="border-border hover:bg-muted/30">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                              {investor.firstName?.substring(0, 1).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm tracking-tight">{investor.firstName} {investor.lastName}</span>
                              <span className="text-[9px] font-mono text-muted-foreground uppercase">{investor.id}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-mono">{investor.email}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[9px] uppercase font-bold py-0 ${investor.role === 'admin' ? 'border-destructive text-destructive bg-destructive/5' : 'border-green-500/30 text-green-500 bg-green-500/5'}`}>
                            {investor.role || 'investor'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {investor.createdAt ? new Date(investor.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => router.push(`/admin/investor/${investor.id}`)}
                            className="h-8 px-2 text-[10px] font-bold uppercase tracking-widest text-primary"
                          >
                            Inspect <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!investors?.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20">
                          <div className="flex flex-col items-center gap-2 opacity-50">
                            <Terminal className="h-6 w-6" />
                            <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Zero Identities Registered</span>
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
