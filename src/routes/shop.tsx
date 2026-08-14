import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { MedicineCard } from "@/components/MedicineCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { medicinesQuery } from "@/lib/medicines";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop Medicines — MediCare Pharmacy" },
      {
        name: "description",
        content:
          "Browse prescription and over-the-counter medicines by category: pain relief, allergy, antibiotics, diabetes care and more.",
      },
      { property: "og:title", content: "Shop Medicines — MediCare Pharmacy" },
      {
        property: "og:description",
        content: "Browse prescription and over-the-counter medicines by category.",
      },
    ],
  }),
  component: ShopPage,
});

type TypeFilter = "all" | "otc" | "rx";

function ShopPage() {
  const { data: medicines } = useSuspenseQuery(medicinesQuery);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState<TypeFilter>("all");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(medicines.map((m) => m.category))).sort()],
    [medicines],
  );

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    return medicines.filter((medicine) => {
      const matchesTerm =
        !term ||
        medicine.name.toLowerCase().includes(term) ||
        (medicine.brand ?? "").toLowerCase().includes(term) ||
        medicine.category.toLowerCase().includes(term);
      const matchesCategory = category === "All" || medicine.category === category;
      const matchesType =
        type === "all" ||
        (type === "rx" ? medicine.requires_prescription : !medicine.requires_prescription);
      return matchesTerm && matchesCategory && matchesType;
    });
  }, [medicines, search, category, type]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Shop medicines</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Prescription-only items are marked “Rx only” and require a valid prescription at checkout.
      </p>

      <div className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, brand or category"
            className="pl-9"
            aria-label="Search medicines"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "otc", "rx"] as const).map((option) => (
            <Button
              key={option}
              size="sm"
              variant={type === option ? "default" : "outline"}
              onClick={() => setType(option)}
            >
              {option === "all" ? "All items" : option === "otc" ? "Over the counter" : "Prescription"}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((option) => (
            <button
              key={option}
              onClick={() => setCategory(option)}
              className={
                category === option
                  ? "rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                  : "rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-muted"
              }
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">{results.length} products</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((medicine) => (
          <MedicineCard key={medicine.id} medicine={medicine} />
        ))}
      </div>
      {results.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          No medicines match your filters.
        </p>
      )}
    </div>
  );
}
