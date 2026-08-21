import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  // Carries the server's prefetched query cache into the HTML and rehydrates
  // it on the client, so the client's first render sees the same data (and
  // the same isLoading state) the server did — prevents hydration mismatches
  // on any route that prefetches via a loader (shop, home, etc.).
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
};