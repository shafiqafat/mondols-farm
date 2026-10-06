import {
  ArrowLeftRight,
  BriefcaseBusiness,
  Compass,
  LayoutDashboard,
  LogOut,
  UserCircle,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

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
  useSidebar,
} from "@/components/ui/sidebar";

import { useAuth } from "../../hooks/useAuth";

const NAV_GROUPS = [
  {
    label: "Portfolio",
    items: [
      {
        to: "/investor",
        label: "Dashboard",
        icon: LayoutDashboard,
        end: true,
      },
      {
        to: "/investor/investments",
        label: "My Investments",
        icon: BriefcaseBusiness,
      },
      {
        to: "/investor/transactions",
        label: "Transactions",
        icon: ArrowLeftRight,
      },
    ],
  },
  {
    label: "Explore",
    items: [
      {
        to: "/investor/opportunities",
        label: "Opportunities",
        icon: Compass,
      },
      {
        to: "/investor/projects",
        label: "Projects",
        icon: BriefcaseBusiness,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        to: "/investor/profile",
        label: "Profile",
        icon: UserCircle,
      },
    ],
  },
];

function InvestorSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-4">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <BriefcaseBusiness className="size-4 text-primary" />
          </div>

          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <div className="truncate text-sm font-semibold tracking-tight">
              Mondol's Farm
            </div>

            <div className="mt-0.5 truncate text-xs text-sidebar-foreground/60">
              Investor Portal
            </div>
          </div>
        </div>
      </SidebarHeader>

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

      <SidebarFooter className="border-t border-sidebar-border px-2 py-3">
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              tooltip="Sign out"
              className="h-9 rounded-lg px-2.5 text-sm text-sidebar-foreground/80 transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="size-4 shrink-0" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="mt-3 border-t border-sidebar-border pt-3 group-data-[collapsible=icon]:hidden">
          <p className="truncate px-2 text-xs text-sidebar-foreground/50">
            {user?.email ?? "Investor"}
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default InvestorSidebar;
