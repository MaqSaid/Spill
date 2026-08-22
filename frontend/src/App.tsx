import { Routes, Route, NavLink } from "react-router-dom";
import SubmitPage from "./pages/SubmitPage";
import StatusPage from "./pages/StatusPage";
import AdminPage from "./pages/AdminPage";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
    <div className="min-h-screen flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-spill-600 focus:text-white focus:rounded-lg focus:outline-none"
      >
        Skip to main content
      </a>
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-spill-700 tracking-tight">
            Spill
          </h1>
          <nav className="flex gap-1" aria-label="Main navigation">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-spill-100 text-spill-800"
                    : "text-gray-600 hover:text-spill-700 hover:bg-gray-100"
                }`
              }
            >
              Submit
            </NavLink>
            <NavLink
              to="/status"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-spill-100 text-spill-800"
                    : "text-gray-600 hover:text-spill-700 hover:bg-gray-100"
                }`
              }
            >
              My Status
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-spill-100 text-spill-800"
                    : "text-gray-600 hover:text-spill-700 hover:bg-gray-100"
                }`
              }
            >
              Admin
            </NavLink>
          </nav>
        </div>
      </header>

      <main id="main-content" className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <Routes>
          <Route path="/" element={<SubmitPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
      </main>

      <footer className="border-t border-gray-200 py-4 text-center text-sm text-gray-500">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
            <p>
              Spill — Zero-knowledge anonymous feedback.
            </p>
            <span className="hidden sm:inline text-gray-300" aria-hidden="true">|</span>
            <p className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" aria-hidden="true"></span>
              End-to-end encrypted. No identity tracking.
            </p>
          </div>
        </div>
      </footer>
    </div>
    </ErrorBoundary>
  );
}

export default App;
