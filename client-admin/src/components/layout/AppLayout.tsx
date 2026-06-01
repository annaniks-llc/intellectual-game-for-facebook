import { NavLink, Outlet } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import ProfileMenu from "./ProfileMenu";

const nav = [
  { to: "/locales", label: "Locales" },
  { to: "/countries", label: "Countries" },
  { to: "/teams", label: "Teams" },
  { to: "/athletes", label: "Athletes" },
  { to: "/positions", label: "Positions" },
  { to: "/templates", label: "Templates" },
];

export default function AppLayout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-head">
          <h1>Soccer Quiz Admin</h1>
        </div>
        <nav className="sidebar-nav">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
          <ProfileMenu />
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
