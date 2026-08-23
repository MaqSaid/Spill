import { NavLink, Outlet } from "react-router-dom";
import { appConfig } from "../config/app-config";
import ErrorBoundary from "../components/ErrorBoundary";

export default function EmployeeLayout() {
  const { branding, employee } = appConfig;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-spill-600 focus:text-white focus:rounded">
          Skip to content
        </a>

        <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40" aria-label="Main navigation">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <span className="text-xl font-extrabold text-spill-700 dark:text-spill-300">{branding.appName}</span>
                <span className="hidden md:inline text-xs font-bold text-spill-600 dark:text-spill-400 bg-spill-50 dark:bg-spill-900/30 px-2.5 py-1 rounded-full">
                  {branding.tagline}
                </span>
              </div>
              <div className="flex gap-1 overflow-x-auto" role="navigation" aria-label="Employee navigation">
                {employee.navItems.map((item) => (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      `px-3 py-2.5 text-sm font-medium rounded-lg min-h-[44px] flex items-center whitespace-nowrap transition-colors ${
                        isActive
                          ? "bg-spill-100 text-spill-800 dark:bg-spill-900/40 dark:text-spill-200"
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <main id="main-content" className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
          <Outlet />
        </main>

        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4">
          <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
            <span>{employee.footer.text}</span>
            <div className="flex gap-3">
              {employee.footer.links.map((link) => (
                <NavLink key={link.path} to={link.path} className="text-spill-600 hover:text-spill-700 underline">
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
