import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

export function useAuth() {
  useEffect(() => {
    void useAuthStore.getState().initialize();
  }, []);

  const { user, token, loading, signOut } = useAuthStore();
  return { user, session: token ? { access_token: token } : null, loading, signOut };
}
