import {
  BarChart3,
  CalendarCheck,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Package,
  Settings,
  Sprout,
  Boxes,
  Wallet,
  LogOut,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const NAV_GROUPS = [
  {
    label: "Farm",
    items: [
      {
        to: "/farm-os",
        label: "Overview",
        icon: LayoutDashboard,
        end: true,
      },
      {
        to: "/farm-os/species",
        label: "Species",
        icon: Sprout,
      },
      {
        to: "/farm-os/capacity",
        label: "Capacity",
        icon: Boxes,
      },
      {
        to: "/farm-os/scenario",
        label: "Scenario",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        to: "/farm-os/daily-log",
        label: "Daily Log",
        icon: ClipboardList,
      },
      {
        to: "/farm-os/inventory",
        label: "Inventory",
        icon: Package,
      },
      {
        to: "/farm-os/finance",
        label: "Finance",
        icon: Wallet,
      },
      {
        to: "/farm-os/tasks",
        label: "Tasks",
        icon: CalendarCheck,
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        to: "/farm-os/content",
        label: "Content",
        icon: FileText,
      },
    ],
  },
];

function FarmOSSidebar({ user, role, signOut }) {
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Brand */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            <Sprout className="size-4" />
          </div>

          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-semibold tracking-tight">
              Mondol's Farm
            </div>

            <div className="mt-0.5 truncate text-xs text-sidebar-foreground/60">
              Farm OS
            </div>
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="px-2 py-3">
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label} className="py-2">
            <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/45">
              {group.label}
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.label}
                        className="h-9 w-full rounded-lg p-0 text-sm transition-colors duration-150"
                      >
                        <NavLink
                          to={item.to}
                          end={item.end}
                          className={({ isActive }) =>
                            `flex h-full w-full flex-row items-center gap-2 rounded-lg px-2.5 ${
                              isActive
                                ? "!bg-white font-medium !text-primary"
                                : "text-sidebar-foreground/80 hover:text-white"
                            }`
                          }
                        >
                          <Icon className="size-4 shrink-0" />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-sidebar-border px-2 py-3">
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Settings"
              className="h-9 rounded-lg px-2.5 text-sm text-sidebar-foreground/80 transition-colors duration-150 hover:bg-white/10 hover:text-white"
            >
              <NavLink
                to="/farm-os/settings"
                className="flex w-full flex-row items-center gap-2"
              >
                <Settings className="size-4 shrink-0" />
                <span>Settings</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              tooltip="Sign out"
              className="h-9 flex-row items-center rounded-lg px-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="size-4 shrink-0" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="mt-2 border-t border-sidebar-border/70 px-2 pt-3 group-data-[collapsible=icon]:hidden">
          <div className="truncate text-xs text-sidebar-foreground/60">
            {user?.email}
          </div>

          <div className="mt-1 text-xs font-medium capitalize text-sidebar-foreground/80">
            {role ?? "Administrator"}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default FarmOSSidebar;
