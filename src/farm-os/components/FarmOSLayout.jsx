import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import OfflineIndicator from "./OfflineIndicator";
import "./FarmOSLayout.css";

const NAV_ITEMS = [
  { to: "/farm-os", label: "Overview", end: true, ready: true },
  { to: "/farm-os/species", label: "Species", ready: true },
  { to: "/farm-os/daily-log", label: "Daily Log", ready: true },
  { to: "/farm-os/inventory", label: "Inventory", ready: true },
  { to: "/farm-os/finance", label: "Finance", ready: true },
  { to: "/farm-os/capacity", label: "Capacity", ready: true },
  { to: "/farm-os/scenario", label: "Scenario", ready: true },
  { to: "/farm-os/content", label: "Content", ready: true },
  { to: "/farm-os/tasks", label: "Tasks", ready: true },
];

function FarmOSLayout() {
  const { user, role, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="farmos">
      <div className="farmos__shell">
        <aside className={`farmos__sidebar${sidebarOpen ? " farmos__sidebar--open" : ""}`}>
          <div className="farmos__brand-row">
            <span className="farmos__wordmark">Mondol's<br />Farm OS</span>
            <button className="farmos__menu-close" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">×</button>
          </div>
          <nav className="farmos__nav" aria-label="Farm OS navigation">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `farmos__nav-link${isActive ? " farmos__nav-link--active" : ""}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="farmos__sidebar-footer">
            <span className="farmos__user">{user?.email}</span>
            <span className="farmos__role">{role ?? "Administrator"}</span>
            <button className="farmos__signout" onClick={signOut}>Sign out</button>
          </div>
        </aside>

        <div className="farmos__main-shell">
          <header className="farmos__topbar">
            <button className="farmos__menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">☰</button>
            <span className="farmos__mobile-wordmark">Mondol's Farm OS</span>
            <div className="farmos__topbar-right">
          <OfflineIndicator />
            </div>
          </header>
          <main className="farmos__content"><Outlet /></main>
        </div>
      </div>
    </div>
  );
}

export default FarmOSLayout;
