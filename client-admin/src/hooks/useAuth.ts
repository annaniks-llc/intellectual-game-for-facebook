import { useAppSelector } from "../redux/hooks";

export function useAuth() {
  const token = useAppSelector((state) => state.auth.token);
  const username = useAppSelector((state) => state.auth.username);
  const authReady = useAppSelector((state) => state.auth.authReady);
  return { token, username, authReady, isAuthenticated: Boolean(token) };
}
