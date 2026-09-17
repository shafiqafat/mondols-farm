import { Outlet } from "react-router-dom";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "../hooks/useAuth";
import OfflineIndicator from "./OfflineIndicator";
import FarmOSSidebar from "./FarmOSSidebar";

function FarmOSLayout() {
  const { user, role, signOut } = useAuth();

  return (
    <SidebarProvider defaultOpen={true}>
      <FarmOSSidebar user={user} role={role} signOut={signOut} />

      <SidebarInset className="min-h-svh bg-background font-sans [&_h1]:!font-sans [&_h2]:!font-sans [&_h3]:!font-sans [&_h4]:!font-sans">
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />

          <Separator orientation="vertical" className="mr-2 h-4" />

          <div className="flex flex-1 items-center justify-end">
            <OfflineIndicator />
          </div>
        </header>

        <main className="min-w-0 flex-1 font-sans">
          <div className="mx-auto w-full max-w-[1360px] px-10 py-10 sm:px-12 lg:px-16">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default FarmOSLayout;
