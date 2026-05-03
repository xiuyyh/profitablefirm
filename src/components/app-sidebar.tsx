
"use client";

import { 
  LayoutDashboard, 
  PieChart, 
  Briefcase, 
  TrendingUp, 
  Settings, 
  LogOut,
  User,
  ShieldCheck
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
import { usePathname } from "next/navigation";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Briefcase, label: "Investments", href: "/investments" },
  { icon: PieChart, label: "Allocation", href: "/allocation" },
  { icon: TrendingUp, label: "Performance", href: "/performance" },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary font-bold text-xl">
            PF
          </div>
          <span className="text-xl font-bold text-white group-data-[collapsible=icon]:hidden">
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
                className={`transition-all duration-200 ${
                  pathname === item.href 
                    ? "bg-secondary text-primary" 
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Link href={item.href}>
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        <SidebarSeparator className="my-4 opacity-20" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profile" className="text-white/80 hover:bg-white/10">
              <Link href="/profile">
                <User className="h-5 w-5" />
                <span>Profile</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings" className="text-white/80 hover:bg-white/10">
              <Link href="/settings">
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="w-full text-white/80 hover:bg-destructive/20 hover:text-destructive-foreground">
              <LogOut className="h-5 w-5" />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
