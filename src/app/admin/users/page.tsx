"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { 
  Users, 
  Search, 
  Edit3, 
  Terminal,
  Save,
  X
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [overrides, setOverrides] = useState({
    manualAumOverride: "",
    manualLedgerOverride: "",
    manualPnlOverride: "",
  });

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "investorProfiles");
  }, [firestore]);

  const { data: users, isLoading } = useCollection(usersQuery);

  const filteredUsers = users?.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.firstName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setOverrides({
      manualAumOverride: user.manualAumOverride?.toString() || "",
      manualLedgerOverride: user.manualLedgerOverride?.toString() || "",
      manualPnlOverride: user.manualPnlOverride?.toString() || "",
    });
  };

  const handleSaveOverrides = () => {
    if (!firestore || !editingUser) return;

    const docRef = doc(firestore, "investorProfiles", editingUser.id);
    updateDocumentNonBlocking(docRef, {
      manualAumOverride: overrides.manualAumOverride === "" ? null : Number(overrides.manualAumOverride),
      manualLedgerOverride: overrides.manualLedgerOverride === "" ? null : Number(overrides.manualLedgerOverride),
      manualPnlOverride: overrides.manualPnlOverride === "" ? null : Number(overrides.manualPnlOverride),
      updatedAt: new Date().toISOString(),
    });

    toast({
      title: "Overrides Updated",
      description: `Manual changes for ${editingUser.email} have been saved.`,
    });
    setEditingUser(null);
  };

  return (
    <>
      <AppSidebar />
      <SidebarInset className="w-full">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-card sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border mx-2" />
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Manage Users
            </h1>
          </div>
        </header>

        <main className="p-6 md:p-8 space-y-6 w-full max-w-none">
          <Card className="border-border bg-card shadow-none">
            <CardHeader className="border-b bg-muted/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-black uppercase tracking-widest">Investor Accounts</CardTitle>
                  <p className="text-[10px] uppercase tracking-tighter text-muted-foreground">Modify account values and visibility</p>
                </div>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name or email..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9 pl-9 bg-background border-border text-xs focus-visible:ring-primary"
                  />
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
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Investor</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Role</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider">Total Balance (Manual)</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-bold tracking-wider">Cash (Manual)</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((u) => (
                      <TableRow key={u.id} className="border-border hover:bg-muted/30">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{u.firstName} {u.lastName}</span>
                            <span className="text-[10px] font-mono text-muted-foreground lowercase">{u.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-sm border ${u.role === 'admin' ? 'border-destructive/30 text-destructive bg-destructive/5' : 'border-primary/30 text-primary bg-primary/5'}`}>
                            {u.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {u.manualAumOverride ? `$${u.manualAumOverride.toLocaleString()}` : "AUTO"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {u.manualLedgerOverride ? `$${u.manualLedgerOverride.toLocaleString()}` : "AUTO"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleEdit(u)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!filteredUsers?.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-20 text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-30">
                          No users found matching search
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>

        <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="bg-card border-border sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm font-black uppercase tracking-widest">Manual Balance Overrides</DialogTitle>
              <p className="text-[10px] uppercase tracking-tighter text-muted-foreground mt-1">
                Leave blank to use automatic calculated values.
              </p>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Portfolio Balance ($)</Label>
                <Input 
                  type="number" 
                  value={overrides.manualAumOverride}
                  onChange={(e) => setOverrides({...overrides, manualAumOverride: e.target.value})}
                  className="bg-background border-border font-mono"
                  placeholder="e.g. 50000.00"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Settled Cash Balance ($)</Label>
                <Input 
                  type="number" 
                  value={overrides.manualLedgerOverride}
                  onChange={(e) => setOverrides({...overrides, manualLedgerOverride: e.target.value})}
                  className="bg-background border-border font-mono"
                  placeholder="e.g. 1500.00"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Profit / Loss Override ($)</Label>
                <Input 
                  type="number" 
                  value={overrides.manualPnlOverride}
                  onChange={(e) => setOverrides({...overrides, manualPnlOverride: e.target.value})}
                  className="bg-background border-border font-mono"
                  placeholder="e.g. +240.00"
                />
              </div>
            </div>
            <DialogFooter className="sm:justify-between gap-3">
              <Button variant="outline" className="flex-1 border-border font-bold uppercase tracking-widest text-[10px]" onClick={() => setEditingUser(null)}>
                <X className="mr-2 h-3.5 w-3.5" /> Cancel
              </Button>
              <Button onClick={handleSaveOverrides} className="flex-1 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px]">
                <Save className="mr-2 h-3.5 w-3.5" /> Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SidebarInset>
    </>
  );
}
