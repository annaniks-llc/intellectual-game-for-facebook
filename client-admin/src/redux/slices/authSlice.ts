import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type AuthState = {
  token: string | null;
  username: string | null;
  role: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  authReady: boolean;
};

const initialState: AuthState = {
  token: localStorage.getItem("admin_token"),
  username: localStorage.getItem("admin_username"),
  role: localStorage.getItem("admin_role"),
  firstName: localStorage.getItem("admin_first_name"),
  lastName: localStorage.getItem("admin_last_name"),
  photoUrl: localStorage.getItem("admin_photo_url"),
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
    sessionValidated: (
      state,
      action: PayloadAction<{
        username: string;
        role?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        photoUrl?: string | null;
      }>,
    ) => {
      state.username = action.payload.username;
      state.role = action.payload.role ?? null;
      state.firstName = action.payload.firstName ?? null;
      state.lastName = action.payload.lastName ?? null;
      state.photoUrl = action.payload.photoUrl ?? null;
      state.authReady = true;
      localStorage.setItem("admin_username", action.payload.username);
      if (action.payload.role) {
        localStorage.setItem("admin_role", action.payload.role);
      } else {
        localStorage.removeItem("admin_role");
      }
      if (action.payload.firstName) {
        localStorage.setItem("admin_first_name", action.payload.firstName);
      } else {
        localStorage.removeItem("admin_first_name");
      }
      if (action.payload.lastName) {
        localStorage.setItem("admin_last_name", action.payload.lastName);
      } else {
        localStorage.removeItem("admin_last_name");
      }
      if (action.payload.photoUrl) {
        localStorage.setItem("admin_photo_url", action.payload.photoUrl);
      } else {
        localStorage.removeItem("admin_photo_url");
      }
    },
    setAuthReady: (state) => {
      state.authReady = true;
    },
    logout: (state) => {
      state.token = null;
      state.username = null;
      state.role = null;
      state.firstName = null;
      state.lastName = null;
      state.photoUrl = null;
      state.authReady = true;
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_username");
      localStorage.removeItem("admin_role");
      localStorage.removeItem("admin_first_name");
      localStorage.removeItem("admin_last_name");
      localStorage.removeItem("admin_photo_url");
    },
  },
});

export const { loginSuccess, sessionValidated, setAuthReady, logout } = authSlice.actions;
export default authSlice.reducer;
