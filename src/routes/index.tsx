import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock, FileCheck2, ShieldCheck, Truck } from "lucide-react";
import heroImage from "@/assets/pharmacy-hero.jpg";
import { MedicineCard } from "@/components/MedicineCard";
import { Button } from "@/components/ui/button";
import { medicinesQuery } from "@/lib/medicines";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.prefetchQuery(medicinesQuery),
  head: () => ({
    meta: [
      { title: "MediCare Pharmacy — Prescription & OTC Medicines Online" },
      {
        name: "description",
        content:
          "Order prescription and over-the-counter medicines online. Upload your prescription, get pharmacist review and fast home delivery.",
      },
      { property: "og:title", content: "MediCare Pharmacy — Prescription & OTC Medicines Online" },
      {
        property: "og:description",
        content:
          "Order prescription and over-the-counter medicines online with pharmacist review and fast delivery.",
      },
    ],
  }),
  component: HomePage,
});

const perks = [
  { icon: ShieldCheck, title: "Pharmacist verified", text: "Every Rx order is checked before dispensing." },
  { icon: FileCheck2, title: "Easy prescriptions", text: "Upload a photo or PDF at checkout." },
  { icon: Truck, title: "Next-day delivery", text: "Discreet, tracked packaging nationwide." },
  { icon: Clock, title: "Refill reminders", text: "Reorder past medicines in one tap." },
];

function HomePage() {
  const { data: medicines = [], isLoading, error } = useQuery(medicinesQuery);

  if (isLoading) {
    return <div className="mx-auto max-w-6xl px-4 py-20 text-center text-muted-foreground">Loading medicines...</div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">Medicine catalogue unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Start the backend service and refresh this page to load the catalogue.
        </p>
      </div>
    );
  }

  const featured = medicines.slice(0, 6);

  return (
    <div>
      <section className="surface-hero relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:py-24">
          <div className="text-primary-foreground">
            <span className="inline-flex rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
              Licensed online pharmacy
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
              Your medicines, dispensed with care
            </h1>
            <p className="mt-4 max-w-lg text-base text-primary-foreground/85">
              Browse over-the-counter essentials or upload a prescription — our pharmacists verify
              every order before it ships to your door.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="secondary">
                <Link to="/shop">Shop medicines</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/prescriptions">Upload prescription</Link>
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-primary-foreground/20 shadow-lift">
            <img
              src={heroImage}
              alt="Pharmacist at the counter of a bright modern pharmacy"
              width={1600}
              height={1104}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((perk) => (
            <div key={perk.title} className="rounded-2xl border border-border bg-card p-5 card-lift">
              <perk.icon className="size-6 text-primary" />
              <h3 className="mt-3 text-sm font-semibold">{perk.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{perk.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Popular right now</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Everyday essentials our customers reorder most.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link to="/shop">View all</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((medicine) => (
            <MedicineCard key={medicine.id} medicine={medicine} />
          ))}
        </div>
      </section>
    </div>
  );
}
