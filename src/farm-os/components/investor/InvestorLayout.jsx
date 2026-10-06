import { Outlet, useLocation } from "react-router-dom";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, LogOut, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuth } from "../../hooks/useAuth";
import InvestorSidebar from "./InvestorSidebar";

const PAGE_LABELS = {
  "/investor": "Dashboard",
  "/investor/opportunities": "Opportunities",
  "/investor/investments": "My Investments",
  "/investor/transactions": "Transactions",
  "/investor/projects": "Projects",
  "/investor/profile": "Profile",
};

function InvestorLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const currentPage = PAGE_LABELS[location.pathname] ?? "Investor Portal";

  return (
    <SidebarProvider defaultOpen={true}>
      <InvestorSidebar />

      <SidebarInset className="min-h-svh bg-background font-sans">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b bg-background/95 px-4 backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="-ml-1" />

            <Separator
              orientation="vertical"
              className="mx-2 h-4 self-center"
            />

            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="hidden text-muted-foreground sm:inline">
                Investor Portal
              </span>

              <span className="hidden text-muted-foreground sm:inline">/</span>

              <span className="truncate font-medium text-foreground">
                {currentPage}
              </span>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-9 items-center gap-2 rounded-lg px-2 hover:bg-muted">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <User className="size-4 text-primary" />
                </span>

                <span className="hidden max-w-40 truncate text-sm font-medium sm:inline">
                  {user?.email ?? "Investor"}
                </span>

                <ChevronDown className="hidden size-3.5 text-muted-foreground sm:block" />
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <span className="truncate text-sm font-medium">
                      {user?.email ?? "Investor"}
                    </span>

                    <span className="text-xs font-normal text-muted-foreground">
                      Investor account
                    </span>
                  </div>
                </DropdownMenuLabel>

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
            <div key={location.pathname}>
              <Outlet />
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default InvestorLayout;
