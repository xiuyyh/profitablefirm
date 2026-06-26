
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
  X,
  Trash2,
  AlertTriangle
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase";
import { collection, doc } from "firebase/firestore";
import { updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsersPage() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
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
      title: "Overrides Processed",
      description: `New values applied for ${editingUser.email}.`,
    });
    setEditingUser(null);
  };

  const handleDeleteUser = () => {
    if (!firestore || !userToDelete) return;

    if (userToDelete.id === currentUser?.uid) {
      toast({
        variant: "destructive",
        title: "Security Violation",
        description: "You cannot terminate your own administrative session.",
      });
      setUserToDelete(null);
      return;
    }

    const docRef = doc(firestore, "investorProfiles", userToDelete.id);
    deleteDocumentNonBlocking(docRef);

    toast({
      title: "User Terminated",
      description: `Node ${userToDelete.email} has been removed from the directory.`,
    });
    setUserToDelete(null);
  };

  return (
    <>
      <AppSidebar />
      <SidebarInset className="w-full">
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-card sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div className="h-4 w-px bg-border mx-2" />
            <h1 className="text-xl font-bold flex items-center gap-2 uppercase tracking-widest">
              <Users className="h-5 w-5 text-primary" />
              User Directory
            </h1>
          </div>
        </header>

        <main className="p-6 md:p-8 space-y-6 w-full max-w-none">
          <Card className="border-border bg-card shadow-none rounded-none border-glow">
            <CardHeader className="border-b bg-muted/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <CardTitle className="text-sm font-black uppercase tracking-[0.2em]">Investor Accounts</CardTitle>
                  <p className="text-[10px] uppercase tracking-tighter text-muted-foreground">Modify ledger balances and system overrides</p>
                </div>
                <div className="relative w-full max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search investors by identifier..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 pl-10 bg-background border-border text-xs focus-visible:ring-primary rounded-none"
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
                      <TableHead className="text-[10px] uppercase font-bold tracking-widest h-12 px-6">Investor Node</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-widest h-12">Security Role</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-bold tracking-widest h-12">Total Balance</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-bold tracking-widest h-12">Cash Balance</TableHead>
                      <TableHead className="w-[120px] px-6"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers?.map((u) => (
                      <TableRow key={u.id} className="border-border hover:bg-muted/30">
                        <TableCell className="px-6">
                          <div className="flex flex-col">
                            <span className="font-bold text-sm uppercase">{u.firstName} {u.lastName}</span>
                            <span className="text-[10px] font-mono text-muted-foreground lowercase">{u.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-[9px] font-black uppercase px-2 py-1 border ${u.role === 'admin' ? 'border-destructive/30 text-destructive bg-destructive/5' : 'border-primary/30 text-primary bg-primary/5'}`}>
                            {u.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {u.manualAumOverride ? `$${u.manualAumOverride.toLocaleString()}` : <span className="opacity-30">AUTO</span>}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs">
                          {u.manualLedgerOverride ? `$${u.manualLedgerOverride.toLocaleString()}` : <span className="opacity-30">AUTO</span>}
                        </TableCell>
                        <TableCell className="px-6">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-primary hover:bg-primary/10" onClick={() => handleEdit(u)}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-9 w-9 text-destructive hover:bg-destructive/10" 
                              onClick={() => setUserToDelete(u)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!filteredUsers?.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-24 text-muted-foreground text-[10px] font-black uppercase tracking-[0.5em] opacity-30">
                          No investor nodes matched criteria
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
          <DialogContent className="bg-card border-border sm:max-w-md rounded-none border-glow p-0">
            <DialogHeader className="p-8 border-b bg-muted/10">
              <DialogTitle className="text-sm font-black uppercase tracking-[0.2em]">Manual Override Console</DialogTitle>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
                Apply static values to override system calculations.
              </p>
            </DialogHeader>
            <div className="grid gap-6 p-8">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Portfolio Balance ($)</Label>
                <Input 
                  type="number" 
                  value={overrides.manualAumOverride}
                  onChange={(e) => setOverrides({...overrides, manualAumOverride: e.target.value})}
                  className="bg-background border-border font-mono text-sm h-12 rounded-none focus-visible:ring-primary"
                  placeholder="Leave blank for automatic"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Settled Cash Balance ($)</Label>
                <Input 
                  type="number" 
                  value={overrides.manualLedgerOverride}
                  onChange={(e) => setOverrides({...overrides, manualLedgerOverride: e.target.value})}
                  className="bg-background border-border font-mono text-sm h-12 rounded-none focus-visible:ring-primary"
                  placeholder="Leave blank for automatic"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Profit / Loss Adjustment ($)</Label>
                <Input 
                  type="number" 
                  value={overrides.manualPnlOverride}
                  onChange={(e) => setOverrides({...overrides, manualPnlOverride: e.target.value})}
                  className="bg-background border-border font-mono text-sm h-12 rounded-none focus-visible:ring-primary"
                  placeholder="e.g. +500.00"
                />
              </div>
            </div>
            <DialogFooter className="p-8 bg-muted/5 border-t gap-3">
              <Button variant="outline" className="flex-1 border-border font-bold uppercase tracking-widest text-[10px] h-12 rounded-none" onClick={() => setEditingUser(null)}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button onClick={handleSaveOverrides} className="flex-1 bg-primary text-primary-foreground font-bold uppercase tracking-widest text-[10px] h-12 rounded-none glow-primary">
                <Save className="mr-2 h-4 w-4" /> Apply Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent className="bg-card border-border rounded-none border-glow p-0 overflow-hidden">
            <div className="h-1 w-full bg-destructive" />
            <AlertDialogHeader className="p-8">
              <AlertDialogTitle className="flex items-center gap-2 text-destructive uppercase tracking-widest font-black text-sm">
                <AlertTriangle className="h-5 w-5" />
                Terminate Account Node?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-[10px] uppercase tracking-widest leading-relaxed mt-4">
                You are about to permanently remove <span className="text-foreground font-bold">{userToDelete?.email}</span> from the system. 
                This action is destructive and cannot be reversed through the interface.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="p-8 bg-muted/5 border-t gap-3">
              <AlertDialogCancel className="flex-1 border-border font-bold uppercase tracking-widest text-[10px] h-12 rounded-none">
                Abort
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteUser}
                className="flex-1 bg-destructive text-destructive-foreground font-bold uppercase tracking-widest text-[10px] h-12 rounded-none hover:bg-destructive/90"
              >
                Confirm Deletion
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SidebarInset>
    </>
  );
}
