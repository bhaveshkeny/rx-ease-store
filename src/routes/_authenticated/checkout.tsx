import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { currency, useCart } from "@/lib/cart";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — MediCare Pharmacy" },
      {
        name: "description",
        content: "Confirm delivery details and upload your prescription to complete your order.",
      },
      { property: "og:title", content: "Checkout — MediCare Pharmacy" },
      {
        property: "og:description",
        content: "Confirm delivery details and upload your prescription to complete your order.",
      },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { user } = Route.useRouteContext();
  const { items, subtotal, needsPrescription, clear } = useCart();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const delivery = subtotal > 0 && subtotal < 30 ? 3.99 : 0;
  const total = subtotal + delivery;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (items.length === 0) {
      toast.error("Your basket is empty.");
      return;
    }
    if (needsPrescription && !file) {
      toast.error("Please attach your prescription for the Rx items in your basket.");
      return;
    }

    setSubmitting(true);
    try {
      let prescriptionPath: string | null = null;
      if (file) {
        const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
        const { error: uploadError } = await supabase.storage
          .from("prescriptions")
          .upload(path, file, { upsert: false });
        if (uploadError) throw uploadError;
        prescriptionPath = path;
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          full_name: fullName,
          phone,
          address,
          total,
          status: needsPrescription ? "awaiting_verification" : "placed",
          prescription_path: prescriptionPath,
        })
        .select("id")
        .single();
      if (orderError) throw orderError;

      const { error: itemsError } = await supabase.from("order_items").insert(
        items.map((item) => ({
          order_id: order.id,
          medicine_id: item.id,
          name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
        })),
      );
      if (itemsError) throw itemsError;

      clear();
      toast.success("Order placed! Our pharmacy team will take it from here.");
      navigate({ to: "/orders" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place the order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Nothing to check out</h1>
        <p className="mt-2 text-sm text-muted-foreground">Add some medicines to your basket first.</p>
        <Button asChild className="mt-5">
          <Link to="/shop">Browse medicines</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Checkout</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Payment is not collected in this demo store — you pay on delivery.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" required value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Delivery address</Label>
            <Textarea
              id="address"
              required
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prescription">
              Prescription {needsPrescription ? "(required)" : "(optional)"}
            </Label>
            <Input
              id="prescription"
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              JPG, PNG or PDF. Stored privately and reviewed by a pharmacist.
            </p>
          </div>

          {needsPrescription && (
            <p className="flex items-start gap-2 rounded-xl bg-rx/10 p-3 text-xs text-rx">
              <FileText className="mt-0.5 size-4 shrink-0" />
              Your basket contains prescription-only medicines. They will be dispensed only after
              verification.
            </p>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-border bg-card p-5 card-lift">
          <h2 className="text-base font-semibold">Order summary</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {item.name} × {item.quantity}
                </span>
                <span>{currency(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery</dt>
              <dd>{delivery === 0 ? "Free" : currency(delivery)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <dt>Total</dt>
              <dd>{currency(total)}</dd>
            </div>
          </dl>
          <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Place order
          </Button>
        </aside>
      </form>
    </div>
  );
}
