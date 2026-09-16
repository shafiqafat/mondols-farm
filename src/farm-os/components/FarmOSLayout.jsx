import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./FarmOSLayout.css";

const NAV_ITEMS = [
  { to: "/farm-os", label: "Overview", end: true, ready: true },
  { to: "/farm-os/species", label: "Species", ready: true },
  { to: "/farm-os/daily-log", label: "Daily Log", ready: true },
  { to: "/farm-os/inventory", label: "Inventory", ready: true },
  { to: "/farm-os/finance", label: "Finance", ready: true },
  { to: "/farm-os/capacity", label: "Capacity", ready: true },
  { to: "/farm-os/scenario", label: "Scenario", ready: true },
  { to: "/farm-os/tasks", label: "Tasks", ready: false },
];

function FarmOSLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className="farmos">
      <header className="farmos__topbar">
        <span className="farmos__wordmark">Mondol's Farm OS</span>
        <div className="farmos__topbar-right">
          <span className="farmos__user">{user?.email}</span>
          <button className="farmos__signout" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <nav className="farmos__nav">
        {NAV_ITEMS.map((item) =>
          item.ready ? (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `farmos__nav-link${isActive ? " farmos__nav-link--active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ) : (
            <span
              key={item.to}
              className="farmos__nav-link farmos__nav-link--soon"
            >
              {item.label}
              <span className="farmos__soon-tag">soon</span>
            </span>
          ),
        )}
      </nav>

      <main className="farmos__content">
        <Outlet />
      </main>
    </div>
  );
}

export default FarmOSLayout;
