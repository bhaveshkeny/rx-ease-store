import { queryOptions } from "@tanstack/react-query";
import { apiClient, type Medicine } from "@/lib/api";

export type { Medicine } from "@/lib/api";

export const medicinesQuery = queryOptions({
  queryKey: ["medicines"],
  queryFn: apiClient.medicines.list,
  // Medicines don't change second-to-second. Without this, staleTime
  // defaults to 0, so the "/" and "/shop" route loaders re-fetch and
  // block navigation on EVERY visit, even seconds apart — that's what
  // was making page-to-page navigation feel slow.
  staleTime: 60 * 1000, // 1 minute: reuse cached data without refetching
  gcTime: 5 * 60 * 1000, // keep it in cache for 5 minutes after last use
});
