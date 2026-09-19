import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { ChevronDown, LogOut, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "../hooks/useAuth";
import OfflineIndicator from "./OfflineIndicator";
import FarmOSSidebar from "./FarmOSSidebar";

function FarmOSLayout() {
  const { user, role, signOut } = useAuth();
  const location = useLocation();

  const pageLabels = {
    "/farm-os": "Overview",
    "/farm-os/species": "Species & Entities",
    "/farm-os/capacity": "Capacity",
    "/farm-os/scenario": "Scenario",
    "/farm-os/daily-log": "Daily Log",
    "/farm-os/inventory": "Inventory",
    "/farm-os/sales": "Sales",
    "/farm-os/finance": "Finance",
    "/farm-os/tasks": "Tasks",
    "/farm-os/content": "Content",
    "/farm-os/settings": "Settings",
  };

  const currentPage =
    pageLabels[location.pathname] ??
    (location.pathname.startsWith("/farm-os/entities/")
      ? "Entity Details"
      : "Farm OS");

  return (
    <SidebarProvider defaultOpen={true}>
      <FarmOSSidebar />

      <SidebarInset className="min-h-svh bg-background font-sans [&_h1]:!font-sans [&_h2]:!font-sans [&_h3]:!font-sans [&_h4]:!font-sans">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b bg-background/95 px-4 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />

            <Separator orientation="vertical" className="mx-2 h-4" />

            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden text-muted-foreground sm:inline">
                Farm OS
              </span>

              <span className="hidden text-muted-foreground sm:inline">/</span>

              <span className="truncate font-medium text-foreground">
                {currentPage}
              </span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <OfflineIndicator />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-2 rounded-lg px-2 hover:bg-muted"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <User className="size-4 text-primary" />
                  </span>

                  <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">
                    {user?.email ?? "Administrator"}
                  </span>

                  <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <span className="truncate text-sm font-medium">
                        {user?.email ?? "Administrator"}
                      </span>

                      <span className="text-xs font-normal capitalize text-muted-foreground">
                        {role ?? "Administrator"}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                <DropdownMenuItem asChild>
                  <NavLink
                    to="/farm-os/settings"
                    className="flex cursor-pointer items-center"
                  >
                    <User className="mr-2 size-4" />
                    Account settings
                  </NavLink>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={signOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="min-w-0 flex-1 font-sans">
          <div className="mx-auto w-full max-w-[1360px] px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 xl:px-12">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default FarmOSLayout;
