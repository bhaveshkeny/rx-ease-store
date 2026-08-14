import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currency, useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Basket — MediCare Pharmacy" },
      { name: "description", content: "Review the medicines in your basket before checkout." },
      { property: "og:title", content: "Your Basket — MediCare Pharmacy" },
      { property: "og:description", content: "Review the medicines in your basket before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, setQuantity, remove, needsPrescription } = useCart();
  const delivery = subtotal > 0 && subtotal < 30 ? 3.99 : 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Your basket</h1>

      {items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">Your basket is empty.</p>
          <Button asChild className="mt-4">
            <Link to="/shop">Browse medicines</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4"
              >
                <div className="min-w-40 flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.packSize ?? "—"} · {currency(item.price)} each
                  </p>
                  {item.requiresPrescription && (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-rx">
                      <FileText className="size-3.5" /> Prescription required
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 rounded-full border border-border p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full"
                    onClick={() => setQuantity(item.id, item.quantity - 1)}
                    aria-label={`Decrease ${item.name}`}
                  >
                    <Minus className="size-4" />
                  </Button>
                  <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 rounded-full"
                    onClick={() => setQuantity(item.id, item.quantity + 1)}
                    aria-label={`Increase ${item.name}`}
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                <p className="w-20 text-right font-semibold">{currency(item.price * item.quantity)}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(item.id)}
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>

          <aside className="h-fit rounded-2xl border border-border bg-card p-5 card-lift">
            <h2 className="text-base font-semibold">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{currency(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd>{delivery === 0 ? "Free" : currency(delivery)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{currency(subtotal + delivery)}</dd>
              </div>
            </dl>
            {needsPrescription && (
              <p className="mt-4 rounded-xl bg-rx/10 p-3 text-xs text-rx">
                Your basket contains prescription-only medicines. You'll upload your prescription at
                checkout for pharmacist review.
              </p>
            )}
            <Button asChild className="mt-5 w-full" size="lg">
              <Link to="/checkout">Proceed to checkout</Link>
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
