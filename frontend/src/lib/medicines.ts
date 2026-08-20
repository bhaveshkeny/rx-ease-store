import { queryOptions } from "@tanstack/react-query";
import { apiClient, type Medicine } from "@/lib/api";

export type { Medicine } from "@/lib/api";

export const medicinesQuery = queryOptions({
  queryKey: ["medicines"],
  queryFn: apiClient.medicines.list,
});
