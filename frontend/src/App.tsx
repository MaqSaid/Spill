import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EmployeeLayout from "./layouts/EmployeeLayout";
import SubmitPage from "./pages/SubmitPage";
import StatusPage from "./pages/StatusPage";
import PrivacyPage from "./pages/PrivacyPage";
import HelpPage from "./pages/HelpPage";

// Lazy-load admin (employees never load this bundle)
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminPage = lazy(() => import("./pages/AdminPage"));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Employee Portal — no admin visibility */}
        <Route element={<EmployeeLayout />}>
          <Route index element={<SubmitPage />} />
          <Route path="status" element={<StatusPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="help" element={<HelpPage />} />
        </Route>

        {/* Admin Portal — completely separate, MFA-gated */}
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-gray-500">Loading admin portal...</div>}>
              <AdminLayout />
            </Suspense>
          }
        >
          <Route index element={
            <Suspense fallback={null}><AdminPage /></Suspense>
          } />
          <Route path="analytics" element={<div className="text-center py-12 text-gray-500">Analytics dashboard coming soon</div>} />
          <Route path="settings" element={<div className="text-center py-12 text-gray-500">Settings panel coming soon</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
