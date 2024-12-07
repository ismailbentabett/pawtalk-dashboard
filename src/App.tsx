import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import AnalyticsPage from "./pages/AnalyticsPage";
import AppointmentsPage from "./pages/AppointmentsPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import MatchesPage from "./pages/MatchesPage";
import MessagesPage from "./pages/MessagesPage";
import PetDetailsPage from "./pages/PetDetailsPage";
import PetsPage from "./pages/PetsPage";
import SettingsPage from "./pages/SettingsPage";
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from "./constants/routes";
import { Toaster } from "./components/ui/toaster";

// Import your pages here...

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path={PUBLIC_ROUTES.LOGIN} element={<LoginPage />} />
          
          <Route
            path={PROTECTED_ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route
              path="analytics"
              element={<AnalyticsPage />}
            />
            <Route path="pets" element={<PetsPage />} />
            <Route path="pets/:id" element={<PetDetailsPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="matches" element={<MatchesPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          
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
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;