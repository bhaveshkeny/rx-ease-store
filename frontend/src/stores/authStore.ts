import { create } from "zustand";
import { persist } from "zustand/middleware";
import { apiClient, type User } from "@/lib/api";

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: { email: string; password: string; full_name: string }) => Promise<void>;
  signOut: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      loading: true,
      initialize: async () => {
        if (!get().token) {
          set({ loading: false });
          return;
        }
        try {
          const user = await apiClient.auth.me();
          set({ user, loading: false });
        } catch {
          set({ token: null, user: null, loading: false });
        }
      },
      signIn: async (email, password) => {
        const { access_token } = await apiClient.auth.login(email, password);
        window.localStorage.setItem("rxease.access_token", access_token);
        const user = await apiClient.auth.me();
        set({ token: access_token, user, loading: false });
      },
      signUp: async (payload) => {
        const { access_token } = await apiClient.auth.register(payload);
        window.localStorage.setItem("rxease.access_token", access_token);
        const user = await apiClient.auth.me();
        set({ token: access_token, user, loading: false });
      },
      signOut: () => {
        window.localStorage.removeItem("rxease.access_token");
        set({ token: null, user: null, loading: false });
      },
    }),
    { name: "rxease.auth", partialize: (state) => ({ token: state.token, user: state.user }) },
  ),
);
