"use client";

import { 
  LayoutDashboard, 
  PieChart, 
  Briefcase, 
  TrendingUp, 
  Settings, 
  LogOut,
  User,
  ShieldCheck,
  ShieldAlert,
  History,
  Users,
  Activity,
  FileText,
  Lock,
  Globe,
  CreditCard
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc } from "firebase/firestore";

const investorNav = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Briefcase, label: "Investments", href: "/investments" },
  { icon: CreditCard, label: "Add Money", href: "/deposit" },
  { icon: History, label: "History", href: "/transactions" },
  { icon: TrendingUp, label: "Performance", href: "/performance" },
];

const adminNav = [
  { icon: ShieldAlert, label: "Overview", href: "/admin" },
  { icon: Users, label: "User Accounts", href: "/admin" },
  { icon: Activity, label: "System History", href: "#" },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "investorProfiles", user.uid);
  }, [db, user?.uid]);

  const { data: profile } = useDoc(profileRef);
  const isAdmin = profile?.role === "admin";

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-6">
        <div className="flex flex-col gap-0.5 group-data-[state=collapsed]:hidden overflow-hidden whitespace-nowrap">
          <span className="text-[10px] font-black tracking-[0.3em] text-primary/70 uppercase">
            {isAdmin ? "Admin Panel" : "User Panel"}
          </span>
          <span className="text-sm font-bold tracking-widest text-foreground uppercase">
            PROFITABLEFIRM
          </span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3">
        {isAdmin && (
          <div className="mb-6">
            <div className="px-2 mb-2 group-data-[state=collapsed]:hidden">
              <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-destructive">
                Control Center
              </span>
            </div>
            <SidebarMenu>
              {adminNav.map((item) => (
                <SidebarMenuItem key={item.label + item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    className={`transition-none h-10 ${
                      pathname === item.href 
                        ? "bg-destructive/10 text-destructive border-r-2 border-destructive rounded-none" 
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span className="font-bold text-[10px] uppercase tracking-wider group-data-[state=collapsed]:hidden">{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
            <SidebarSeparator className="my-6 opacity-20 border-destructive/20 group-data-[state=collapsed]:hidden" />
          </div>
        )}

        <div className="px-2 mb-2 group-data-[state=collapsed]:hidden">
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Main Menu
          </span>
        </div>
        <SidebarMenu>
          {investorNav.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.label}
                className={`transition-none h-10 ${
                  pathname === item.href 
                    ? "bg-primary/10 text-primary border-r-2 border-primary rounded-none" 
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                }`}
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  <span className="font-bold text-[10px] uppercase tracking-wider group-data-[state=collapsed]:hidden">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarSeparator className="my-6 opacity-10" />
        
        <div className="px-2 mb-2 group-data-[state=collapsed]:hidden">
          <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Account
          </span>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profile" className="text-muted-foreground hover:text-foreground h-9">
              <Link href="/profile">
                <User className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-tight group-data-[state=collapsed]:hidden">My Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings" className="text-muted-foreground hover:text-foreground h-9">
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-tight group-data-[state=collapsed]:hidden">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="bg-muted/30 rounded border border-border p-2 mb-4 group-data-[state=collapsed]:hidden">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[8px] font-bold uppercase text-muted-foreground">Status</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] font-mono text-foreground">{user?.email?.split('@')[0]}</span>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="w-full text-muted-foreground hover:text-destructive h-9"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-tight group-data-[state=collapsed]:hidden">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
