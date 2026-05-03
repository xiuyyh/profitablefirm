
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
  ShieldAlert
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

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Briefcase, label: "Investments", href: "/investments" },
  { icon: PieChart, label: "Allocation", href: "/allocation" },
  { icon: TrendingUp, label: "Performance", href: "/performance" },
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
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold tracking-widest text-foreground group-data-[collapsible=icon]:hidden uppercase">
            PROFITABLEFIRM
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-3">
        <SidebarMenu>
          {navItems.map((item) => (
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
                  <span className="font-semibold text-xs uppercase tracking-wider">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {isAdmin && (
          <>
            <SidebarSeparator className="my-6 opacity-10" />
            <div className="px-2 mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary/50 group-data-[collapsible=icon]:hidden">
                Administration
              </span>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/admin"}
                  tooltip="Control Panel"
                  className={`transition-none h-10 ${
                    pathname === "/admin" 
                      ? "bg-destructive/10 text-destructive border-r-2 border-destructive rounded-none" 
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <Link href="/admin">
                    <ShieldAlert className="h-4 w-4" />
                    <span className="font-semibold text-xs uppercase tracking-wider">Control Panel</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </>
        )}

        <SidebarSeparator className="my-6 opacity-10" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profile" className="text-muted-foreground hover:text-foreground h-9">
              <Link href="/profile">
                <User className="h-4 w-4" />
                <span className="text-xs uppercase tracking-tight">Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings" className="text-muted-foreground hover:text-foreground h-9">
              <Link href="/settings">
                <Settings className="h-4 w-4" />
                <span className="text-xs uppercase tracking-tight">Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={handleLogout}
              className="w-full text-muted-foreground hover:text-destructive h-9"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-xs uppercase tracking-tight">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
