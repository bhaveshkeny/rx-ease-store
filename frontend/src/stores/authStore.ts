import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { apiClient, type User } from "@/lib/api";
import { useCartStore } from "@/stores/cartStore";

type SignUpPayload = {
  email: string;
  password: string;
  full_name: string;
  phone: string;
};

type AuthState = {
  token: string | null;
  user: User | null;
  loading: boolean;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
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
          useCartStore.getState().setActiveUser(null);
          set({ loading: false });
          return;
        }

        try {
          const user = await apiClient.auth.me();

          useCartStore.getState().setActiveUser(user.id);

          set({
            user,
            loading: false,
          });
        } catch {
          window.localStorage.removeItem(
            "rxease.access_token",
          );

          useCartStore.getState().setActiveUser(null);

          set({
            token: null,
            user: null,
            loading: false,
          });
        }
      },

      signIn: async (email, password) => {
        const { access_token } =
          await apiClient.auth.login(email, password);

        window.localStorage.setItem(
          "rxease.access_token",
          access_token,
        );

        const user = await apiClient.auth.me();

        useCartStore.getState().setActiveUser(user.id);

        const restoredItems =
          useCartStore.getState().cartsByUser[user.id] ?? [];

        const itemCount = restoredItems.reduce(
          (total, item) => total + item.quantity,
          0,
        );

        if (itemCount > 0) {
          toast.info(
            `You have ${itemCount} ${
              itemCount === 1 ? "item" : "items"
            } in your cart pending checkout.`,
          );
        }

        set({
          token: access_token,
          user,
          loading: false,
        });
      },

       signUp: async (payload) => {
        await apiClient.auth.register(payload);
      },

      signOut: () => {
        window.localStorage.removeItem(
          "rxease.access_token",
        );

        useCartStore.getState().setActiveUser(null);

        set({
          token: null,
          user: null,
          loading: false,
        });
      },
    }),
    {
      name: "rxease.auth",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    },
  ),
);