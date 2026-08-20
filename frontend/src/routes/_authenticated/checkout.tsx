import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "sonner";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { currency, useCart } from "@/lib/cart";
import { apiClient, apiErrorMessage } from "@/lib/api";

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
  const { items, subtotal, needsPrescription, clear } = useCart();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);

  const delivery = subtotal > 0 && subtotal < 30 ? 3.99 : 0;
  const total = subtotal + delivery;

  const checkoutSchema = Yup.object({
    full_name: Yup.string().min(2, "Enter your full name").required("Full name is required"),
    phone: Yup.string().min(7, "Enter a valid phone number").required("Phone number is required"),
    address: Yup.string().min(10, "Enter your complete delivery address").required("Address is required"),
  });

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

      <Formik
        initialValues={{ full_name: "", phone: "", address: "" }}
        validationSchema={checkoutSchema}
        onSubmit={async (values, { setSubmitting }) => {
          if (needsPrescription && !file) {
            toast.error("Please attach your prescription for the Rx items in your basket.");
            setSubmitting(false);
            return;
          }
          try {
            const order = await apiClient.orders.create({
              ...values,
              items: items.map((item) => ({ medicine_id: item.id, quantity: item.quantity })),
            });
            if (file) await apiClient.orders.uploadPrescription(order.id, file);
            clear();
            toast.success("Order placed! Our pharmacy team will take it from here.");
            navigate({ to: "/orders" });
          } catch (error) {
            toast.error(apiErrorMessage(error));
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ isSubmitting }) => (
        <Form className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Field as={Input} id="name" name="full_name" />
            <ErrorMessage name="full_name" component="p" className="text-xs text-destructive" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Field as={Input} id="phone" name="phone" />
            <ErrorMessage name="phone" component="p" className="text-xs text-destructive" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Delivery address</Label>
            <Field as={Textarea} id="address" name="address" rows={3} />
            <ErrorMessage name="address" component="p" className="text-xs text-destructive" />
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
          <Button type="submit" size="lg" className="mt-5 w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
            Place order
          </Button>
        </aside>
        </Form>
        )}
      </Formik>
    </div>
  );
}
