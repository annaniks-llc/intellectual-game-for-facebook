import { useAppSelector } from "../redux/hooks";

export function useAuth() {
  const token = useAppSelector((state) => state.auth.token);
  const username = useAppSelector((state) => state.auth.username);
  const role = useAppSelector((state) => state.auth.role);
  const firstName = useAppSelector((state) => state.auth.firstName);
  const lastName = useAppSelector((state) => state.auth.lastName);
  const photoUrl = useAppSelector((state) => state.auth.photoUrl);
  const authReady = useAppSelector((state) => state.auth.authReady);
  return { token, username, role, firstName, lastName, photoUrl, authReady, isAuthenticated: Boolean(token) };
}
