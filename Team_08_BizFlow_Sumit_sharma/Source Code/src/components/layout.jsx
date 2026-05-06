import { Link, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { section: "Overview" },
  { path: "/dashboard",   label: "Dashboard",   icon: "▦" },

  { section: "Operations" },
  { path: "/inventory",   label: "Inventory",   icon: "📦" },
  { path: "/purchase",    label: "Purchase",    icon: "🛒" },
  { path: "/sales",       label: "Sales",       icon: "💰" },
  { path: "/production",  label: "Production",  icon: "🏭" },
  { path: "/reports", label: "Reports", icon: "📊" },

  { section: "People & Assets" },
  { path: "/hr",          label: "HR",          icon: "👤" },
  { path: "/maintenance", label: "Maintenance", icon: "🔧" },
];

export default function Layout({ children, title }) {
  const location = useLocation();
  const navigate = useNavigate();

  const user = (() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      return JSON.parse(atob(token.split(".")[1]));
    } catch { return null; }
  })();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          BizFlow
          <span>ERP SYSTEM</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item, i) =>
            item.section ? (
              <div key={i} className="nav-section-label">{item.section}</div>
            ) : (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </Link>
            )
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            ⎋ Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        <div className="topbar">
          <span className="topbar-title">{title}</span>
          {user && (
            <span className="topbar-user">
              {user.user_name} · {user.role_name}
            </span>
          )}
        </div>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}