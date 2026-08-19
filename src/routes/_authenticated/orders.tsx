import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/cart";
import { apiClient } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — MediCare Pharmacy" },
      { name: "description", content: "Track your medicine orders and prescription verification status." },
      { property: "og:title", content: "My Orders — MediCare Pharmacy" },
      {
        property: "og:description",
        content: "Track your medicine orders and prescription verification status.",
      },
    ],
  }),
  component: OrdersPage,
});

const statusLabels: Record<string, string> = {
  placed: "Placed",
  awaiting_verification: "Awaiting pharmacist verification",
  dispensed: "Dispensed",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function OrdersPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: apiClient.orders.list,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold">My orders</h1>

      {isLoading && (
        <div className="mt-10 flex justify-center">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <p className="mt-8 text-sm text-destructive">We couldn't load your orders. Please refresh.</p>
      )}

      {data && data.length === 0 && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">You haven't placed any orders yet.</p>
          <Button asChild className="mt-4">
            <Link to="/shop">Start shopping</Link>
          </Button>
        </div>
      )}

      <ul className="mt-8 space-y-4">
        {data?.map((order) => (
          <li key={order.id} className="rounded-2xl border border-border bg-card p-5 card-lift">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Order #{order.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <Badge variant="secondary" className="rounded-full">
                {statusLabels[order.status] ?? order.status}
              </Badge>
            </div>

            <ul className="mt-4 space-y-1.5 text-sm">
              {order.items?.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    {item.name} × {item.quantity}
                  </span>
                  <span>{currency(Number(item.unit_price) * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
              <span className="text-muted-foreground">{order.address}</span>
              <span className="font-semibold">{currency(Number(order.total))}</span>
            </div>

            {order.prescription_path && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-rx">
                <FileText className="size-3.5" /> Prescription attached
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
