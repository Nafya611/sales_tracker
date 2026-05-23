import { NavLink, useNavigate } from "react-router-dom";
import api from "../api";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: "📊" },
  { to: "/products", label: "Products", icon: "📦" },
  { to: "/customers", label: "Customers", icon: "👥" },
  { to: "/sales", label: "Sales", icon: "🧾" },
  { to: "/payments", label: "Payments", icon: "💰" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "Admin";

  async function handleLogout() {
    try {
      await api.post("/logout/");
    } catch {}
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/login");
  }

  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col">
      <div className="px-5 py-6 border-b border-gray-700">
        <h1 className="text-lg font-bold">Sales Tracker</h1>
        <p className="text-xs text-gray-400 mt-1">{username}</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`
            }
          >
            <span>{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full text-left text-sm text-gray-400 hover:text-white transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
