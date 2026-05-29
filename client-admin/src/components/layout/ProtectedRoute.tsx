import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";

type Props = PropsWithChildren<{ isAuthenticated: boolean; authReady: boolean }>;

export default function ProtectedRoute({ isAuthenticated, authReady, children }: Props) {
  if (!authReady) {
    return (
      <div className="login-wrap">
        <p>Loading...</p>
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
