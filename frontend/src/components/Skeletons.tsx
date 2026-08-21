import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

/** Mirrors MedicineCard's layout: badge row, title/meta, tag, price footer. */
export function MedicineCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-start justify-between gap-2 p-5 pb-3">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="size-7 rounded-full" />
      </div>
      <div className="flex flex-1 flex-col px-5 pb-3">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="mt-2 h-3 w-2/3" />
        <Skeleton className="mt-3 h-5 w-24 rounded-full" />
      </div>
      <div className="border-t border-border px-5 py-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <Skeleton className="h-6 w-16" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function MedicineGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <MedicineCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Mirrors the shop page's stat cards (icon chip + value + labels). */
export function StatCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
      <Skeleton className="size-10 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <Skeleton className="h-6 w-10" />
        <Skeleton className="mt-1.5 h-3 w-24" />
        <Skeleton className="mt-1 h-3 w-28" />
      </div>
    </div>
  );
}

/** Mirrors the shop page's category filter pills. */
export function CategoryFilterSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full rounded-lg" />
      ))}
    </div>
  );
}

/** Mirrors an order card in "My Orders". */
export function OrderCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-2 h-3 w-36" />
        </div>
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="mt-8 space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <OrderCardSkeleton />
        </li>
      ))}
    </ul>
  );
}

/** Mirrors one row of the Manage Medicines table (Name/Category/Price/Stock/Actions). */
export function TableRowSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-1.5 h-3 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-3 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-3 w-14" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-3 w-10" />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  );
}
