import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type AuthState = {
  token: string | null;
  username: string | null;
  role: string | null;
  authReady: boolean;
};

const initialState: AuthState = {
  token: localStorage.getItem("admin_token"),
  username: localStorage.getItem("admin_username"),
  role: localStorage.getItem("admin_role"),
  authReady: !localStorage.getItem("admin_token"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action: PayloadAction<{ token: string; username: string }>) => {
      state.token = action.payload.token;
      state.username = action.payload.username;
      state.authReady = true;
      localStorage.setItem("admin_token", action.payload.token);
      localStorage.setItem("admin_username", action.payload.username);
    },
    sessionValidated: (state, action: PayloadAction<{ username: string; role?: string | null }>) => {
      state.username = action.payload.username;
      state.role = action.payload.role ?? null;
      state.authReady = true;
      localStorage.setItem("admin_username", action.payload.username);
      if (action.payload.role) {
        localStorage.setItem("admin_role", action.payload.role);
      } else {
        localStorage.removeItem("admin_role");
      }
    },
    setAuthReady: (state) => {
      state.authReady = true;
    },
    logout: (state) => {
      state.token = null;
      state.username = null;
      state.role = null;
      state.authReady = true;
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_username");
      localStorage.removeItem("admin_role");
    },
  },
});

export const { loginSuccess, sessionValidated, setAuthReady, logout } = authSlice.actions;
export default authSlice.reducer;
