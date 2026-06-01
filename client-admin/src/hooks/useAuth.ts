import { useAppSelector } from "../redux/hooks";

export function useAuth() {
  const token = useAppSelector((state) => state.auth.token);
  const username = useAppSelector((state) => state.auth.username);
  const role = useAppSelector((state) => state.auth.role);
  const authReady = useAppSelector((state) => state.auth.authReady);
  return { token, username, role, authReady, isAuthenticated: Boolean(token) };
}
