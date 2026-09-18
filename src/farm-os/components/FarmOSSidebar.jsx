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
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  useSidebar,
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

function FarmOSSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Brand */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-4">
          <div className="flex items-center justify-center gap-3 px-2 py-4 group-data-[collapsible=icon]:px-0">
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
                  const isActive = item.end
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.label}
                        className="h-9 w-full rounded-lg p-0 text-sm transition-colors duration-150"
                      >
                        <NavLink
                          to={item.to}
                          end={item.end}
                          onClick={() => {
                            if (isMobile) {
                              setOpenMobile(false);
                            }
                          }}
                          className={`flex h-full w-full flex-row items-center rounded-lg ${
                            state === "collapsed"
                              ? "justify-center px-0"
                              : "gap-2 px-2.5"
                          }`}
                        >
                          <Icon className="size-4 shrink-0" />

                          {state !== "collapsed" && <span>{item.label}</span>}
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
              className="h-9 rounded-lg px-2.5 text-sm text-sidebar-foreground/80 transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
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
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default FarmOSSidebar;
