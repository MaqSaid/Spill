import { useState, useCallback } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { appConfig } from "../config/app-config";
import AdminLoginPage from "../pages/AdminLoginPage";
import ErrorBoundary from "../components/ErrorBoundary";

export default function AdminLayout() {
  const { branding, admin } = appConfig;
  const [adminSession, setAdminSession] = useState<string | null>(
    () => sessionStorage.getItem("spill_admin_session")
  );

  const handleLogin = useCallback((token: string) => {
    setAdminSession(token);
  }, []);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("spill_admin_session");
    setAdminSession(null);
  }, []);

  if (!adminSession) {
    return <AdminLoginPage onLoginSuccess={handleLogin} />;
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
        <a href="#admin-main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-spill-600 focus:text-white focus:rounded">
          Skip to content
        </a>

        <nav className="bg-gray-800 text-white sticky top-0 z-40" aria-label="Admin navigation">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold">{branding.appName}</span>
                <span className="text-xs text-gray-400">Admin Portal</span>
              </div>
              <div className="flex items-center gap-2">
                {admin.navItems.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    end={item.path === "/admin"}
                    className={({ isActive }) =>
                      `px-3 py-2 text-sm rounded-lg transition-colors ${
                        isActive ? "bg-gray-700 text-white" : "text-gray-300 hover:text-white hover:bg-gray-700"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                <button
                  onClick={handleLogout}
                  className="ml-4 px-3 py-1.5 text-xs text-gray-300 border border-gray-600 rounded hover:bg-gray-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main id="admin-main-content" className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
          <Outlet />
        </main>

        <footer className="bg-gray-800 text-gray-400 py-3 text-center text-xs">
          {admin.footer.text}
        </footer>
      </div>
    </ErrorBoundary>
  );
}
