import { AuthProvider } from "@/contexts/AuthContext";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "./components/ui/toaster";
import { PROTECTED_ROUTES, PUBLIC_ROUTES } from "./constants/routes";
import AnalyticsPage from "./pages/AnalyticsPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import MatchesPage from "./pages/MatchesPage";
import MessagesPage from "./pages/MessagesPage";
import PetDetailsPage from "./pages/PetDetailsPage";
import PetsPage from "./pages/PetsPage";
import SettingsPage from "./pages/SettingsPage";
import DashboardLayout from "./layouts/DashboardLayout";
import { ToastProvider } from "@radix-ui/react-toast";

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path={PUBLIC_ROUTES.LOGIN} element={<LoginPage />} />

            {/* Protected Dashboard Routes */}
            <Route
              path={PROTECTED_ROUTES.DASHBOARD}
              element={<DashboardLayout />}
            >
              <Route index element={<DashboardPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="pets" element={<PetsPage />} />
              <Route path="pets/:id" element={<PetDetailsPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="matches" element={<MatchesPage />} />
              <Route path="appointments" element={<AppointmentsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Redirect Routes */}
            <Route
              path={PUBLIC_ROUTES.HOME}
              element={<Navigate to={PROTECTED_ROUTES.DASHBOARD} replace />}
            />
            <Route
              path="*"
              element={<Navigate to={PROTECTED_ROUTES.DASHBOARD} replace />}
            />
          </Routes>
          <Toaster />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
