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
    // 0 meant every preload (hover/tap-intent) was treated as instantly
    // stale, so it re-fetched anyway — defeating the point of preloading
    // and making navigation feel slow. 30s lets a recent preload/visit
    // be reused instead of re-fetching on every navigation.
    defaultPreloadStaleTime: 30 * 1000,
  });

  // Carries the server's prefetched query cache into the HTML and rehydrates
  // it on the client, so the client's first render sees the same data (and
  // the same isLoading state) the server did — prevents hydration mismatches
  // on any route that prefetches via a loader (shop, home, etc.).
  setupRouterSsrQueryIntegration({ router, queryClient });

  return router;
};
