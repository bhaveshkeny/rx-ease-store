import { createFileRoute, Link } from "@tanstack/react-router";
import { FileUp, ShieldCheck, Stethoscope, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/prescriptions")({
  head: () => ({
    meta: [
      { title: "Upload a Prescription — MediCare Pharmacy" },
      {
        name: "description",
        content:
          "How prescription dispensing works at MediCare Pharmacy: upload your prescription, a pharmacist verifies it, and we deliver your medicine.",
      },
      { property: "og:title", content: "Upload a Prescription — MediCare Pharmacy" },
      {
        property: "og:description",
        content: "Upload your prescription, get pharmacist verification and home delivery.",
      },
    ],
  }),
  component: PrescriptionsPage,
});

const steps = [
  {
    icon: FileUp,
    title: "1. Add your medicines",
    text: "Search the catalogue and add prescription-only items to your basket.",
  },
  {
    icon: Stethoscope,
    title: "2. Upload the prescription",
    text: "At checkout, attach a clear photo or PDF of the prescription signed by your prescriber.",
  },
  {
    icon: ShieldCheck,
    title: "3. Pharmacist review",
    text: "A registered pharmacist checks the prescription, dose and interactions before dispensing.",
  },
  {
    icon: Truck,
    title: "4. Dispensed & delivered",
    text: "Once approved, your order is dispensed and shipped in discreet, tracked packaging.",
  },
];

function PrescriptionsPage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-semibold">Prescription dispensing</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Prescription-only medicines are dispensed after a registered pharmacist verifies your
        prescription. Uploads are stored privately and are only visible to you and our dispensing
        team.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {steps.map((step) => (
          <div key={step.title} className="rounded-2xl border border-border bg-card p-5 card-lift">
            <step.icon className="size-6 text-primary" />
            <h2 className="mt-3 text-sm font-semibold">{step.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{step.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Ready to order?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {user
            ? "Add your medicines, then attach the prescription during checkout."
            : "Create an account or sign in to upload prescriptions and track your orders."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/shop">Browse medicines</Link>
          </Button>
          {!user && (
            <Button asChild variant="outline">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        We cannot dispense prescription medicines without a valid prescription. Never share
        prescription medicines with others, and always read the patient information leaflet.
      </p>
    </div>
  );
}
