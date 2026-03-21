/**
 * Nivå Auth Store (Zustand + SecureStore)
 * Manages user state and persists auth token securely.
 */

import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { UserData, setAuthToken, getUser } from "./api";

const TOKEN_KEY = "niva-auth-token";
const USER_ID_KEY = "niva-user-id";

interface AuthState {
  user: UserData | null;
  token: string | null;
  isLoading: boolean;

  /**
   * Restore session from SecureStore on app start.
   */
  restore: () => Promise<void>;

  /**
   * Login: save user ID and token to SecureStore.
   */
  login: (userId: number, token?: string) => Promise<void>;

  /**
   * Logout: clear SecureStore and reset state.
   */
  logout: () => Promise<void>;

  /**
   * Update user data in store (after profile edit).
   */
  setUser: (user: UserData) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  restore: async () => {
    try {
      const storedUserId = await SecureStore.getItemAsync(USER_ID_KEY);
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);

      if (storedUserId && storedToken) {
        setAuthToken(storedToken);
        const user = await getUser(parseInt(storedUserId, 10));
        set({ user, token: storedToken, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.warn("Session restore failed:", error);
      // Clear potentially corrupted data
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_ID_KEY);
      set({ user: null, token: null, isLoading: false });
    }
  },

  login: async (userId: number, token?: string) => {
    const authToken = token ?? `session-${userId}-${Date.now()}`;
    await SecureStore.setItemAsync(TOKEN_KEY, authToken);
    await SecureStore.setItemAsync(USER_ID_KEY, String(userId));
    setAuthToken(authToken);

    try {
      const user = await getUser(userId);
      set({ user, token: authToken, isLoading: false });
    } catch (error) {
      console.warn("Login fetch failed:", error);
      set({ token: authToken, isLoading: false });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_ID_KEY);
    setAuthToken(null);
    set({ user: null, token: null });
  },

  setUser: (user: UserData) => {
    set({ user });
  },
}));
