import { useEffect } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { getAdminMe } from "./api/authApi";
import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AthletesPage from "./components/pages/AthletesPage";
import AthleteDetailPage from "./components/pages/AthleteDetailPage";
import CountriesPage from "./components/pages/CountriesPage";
import ForgotPasswordPage from "./components/pages/ForgotPasswordPage";
import LocalesPage from "./components/pages/LocalesPage";
import LoginPage from "./components/pages/LoginPage";
import PositionsPage from "./components/pages/PositionsPage";
import TeamDetailPage from "./components/pages/TeamDetailPage";
import TeamsPage from "./components/pages/TeamsPage";
import TemplatesPage from "./components/pages/TemplatesPage";
import ChangePasswordPage from "./components/pages/ChangePasswordPage";
import { useAuth } from "./hooks/useAuth";
import { useAppDispatch } from "./redux/hooks";
import { logout, sessionValidated, setAuthReady } from "./redux/slices/authSlice";

function TeamDetailRoute() {
  const { id } = useParams();
  return <TeamDetailPage key={id} />;
}

function AthleteDetailRoute() {
  const { id } = useParams();
  return <AthleteDetailPage key={id} />;
}

export default function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, authReady } = useAuth();

  useEffect(() => {
    let cancelled = false;

    async function checkAdminSession() {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        dispatch(setAuthReady());
        return;
      }

      try {
        const { user } = await getAdminMe();
        if (cancelled) return;

        if (!user) {
          dispatch(logout());
          return;
        }

        dispatch(sessionValidated({ username: user.email }));
      } catch {
        if (cancelled) return;
        dispatch(logout());
      }
    }

    void checkAdminSession();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  if (!authReady) {
    return (
      <div className="login-wrap">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute isAuthenticated={isAuthenticated} authReady={authReady}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/locales" replace />} />
        <Route path="locales" element={<LocalesPage />} />
        <Route path="countries" element={<CountriesPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="teams/:id" element={<TeamDetailRoute />} />
        <Route path="athletes" element={<AthletesPage />} />
        <Route path="athletes/:id" element={<AthleteDetailRoute />} />
        <Route path="positions" element={<PositionsPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="change-password" element={<ChangePasswordPage />} />
      </Route>
      <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
    </Routes>
  );
}
