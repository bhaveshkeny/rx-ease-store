import { queryOptions } from "@tanstack/react-query";

import { apiClient } from "@/lib/api";

export type {
  Medicine,
  PaginatedMedicineResponse,
} from "@/lib/api";

export const medicinesQuery = (
  page = 1,
  pageSize = 6,
) =>
  queryOptions({
    queryKey: ["medicines", page, pageSize],
    queryFn: () =>
      apiClient.medicines.list(page, pageSize),
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });