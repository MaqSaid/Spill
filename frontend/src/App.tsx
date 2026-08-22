import { useState, useCallback, lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import SubmitPage from "./pages/SubmitPage";
import StatusPage from "./pages/StatusPage";
import PrivacyPage from "./pages/PrivacyPage";
import AdminLoginPage from "./pages/AdminLoginPage";

// Lazy-load AdminPage (code splitting — employees never need this bundle)
const AdminPage = lazy(() => import("./pages/AdminPage"));

type Tab = "submit" | "status" | "admin" | "privacy";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("submit");
  const [adminSession, setAdminSession] = useState<string | null>(
    () => sessionStorage.getItem("spill_admin_session")
  );

  const handleAdminLogin = useCallback((sessionToken: string) => {
    setAdminSession(sessionToken);
  }, []);

  const handleAdminLogout = useCallback(() => {
    sessionStorage.removeItem("spill_admin_session");
    setAdminSession(null);
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Skip to content link (accessibility) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-spill-600 focus:text-white focus:rounded"
        >
          Skip to content
        </a>

        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40" aria-label="Main navigation">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-spill-700">Spill</span>
                <span className="text-[10px] text-gray-400 -mt-1 hidden sm:block">Zero-knowledge anonymous feedback</span>
              </div>
              <div className="flex gap-1" role="tablist" aria-label="Application sections">
                {(["submit", "status", "privacy", "admin"] as Tab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    role="tab"
                    aria-selected={activeTab === tab}
                    aria-controls={`panel-${tab}`}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab
                        ? "bg-spill-100 text-spill-800"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {tab === "submit" && "Submit"}
                    {tab === "status" && "My Status"}
                    {tab === "privacy" && "Privacy"}
                    {tab === "admin" && "Admin"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main id="main-content" className="flex-1 max-w-4xl mx-auto w-full px-4 py-8" role="tabpanel">
          {activeTab === "submit" && <SubmitPage />}
          {activeTab === "status" && <StatusPage />}
          {activeTab === "admin" && (
            <Suspense
              fallback={
                <div className="text-center py-12 text-gray-500">
                  Loading admin portal...
                </div>
              }
            >
              {adminSession ? (
                <div>
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={handleAdminLogout}
                      className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                  <AdminPage />
                </div>
              ) : (
                <AdminLoginPage onLoginSuccess={handleAdminLogin} />
              )}
            </Suspense>
          )}
          {activeTab === "privacy" && <PrivacyPage />}
        </main>

        {/* Footer with Privacy Policy link (APP 1 compliance) */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-4xl mx-auto px-4 flex items-center justify-between text-xs text-gray-400">
            <span>Zero-knowledge anonymous feedback platform</span>
            <button
              onClick={() => setActiveTab("privacy")}
              className="text-spill-600 hover:text-spill-700 underline"
            >
              Privacy Policy
            </button>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;
