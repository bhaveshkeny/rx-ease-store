import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingBag, Pill, Filter as FilterIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { MedicineCard } from "@/components/MedicineCard";
import { Input } from "@/components/ui/input";
import { medicinesQuery } from "@/lib/medicines";

export const Route = createFileRoute("/shop")({
  loader: ({ context }) => context.queryClient.prefetchQuery(medicinesQuery),
  head: () => ({
    meta: [
      { title: "Shop Medicines — RxEase Pharmacy" },
      {
        name: "description",
        content:
          "Browse prescription and over-the-counter medicines. Fast delivery, quality products, professional service. Find pain relief, allergy, antibiotics, diabetes care and more.",
      },
      { property: "og:title", content: "Shop Medicines — RxEase Pharmacy" },
      {
        property: "og:description",
        content: "Buy prescription and over-the-counter medicines online with fast delivery.",
      },
    ],
  }),
  component: ShopPage,
});

type TypeFilter = "all" | "otc" | "rx";
type SortBy = "relevance" | "price-low" | "price-high" | "name";

function ShopPage() {
  const { data: medicines = [], isLoading, error } = useQuery(medicinesQuery);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] = useState<TypeFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("relevance");
  const [showFilters, setShowFilters] = useState(false);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(medicines.map((m) => m.category))).sort()],
    [medicines],
  );

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();
    let filtered = medicines.filter((medicine) => {
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

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-high":
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "name":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return filtered;
  }, [medicines, search, category, type, sortBy]);

  const statsData = [
    { label: "Available Medicines", value: medicines.length },
    { label: "OTC Products", value: medicines.filter(m => !m.requires_prescription).length },
    { label: "Prescription Items", value: medicines.filter(m => m.requires_prescription).length },
  ];

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-20 text-center text-muted-foreground">Loading medicines...</div>;
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-primary to-primary-deep text-primary-foreground py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-3 mb-4">
            <Pill className="size-8" />
            <h1 className="text-4xl font-bold">Online Pharmacy</h1>
          </div>
          <p className="text-primary-foreground/80 text-lg max-w-2xl">
            Quality medicines delivered to your doorstep. Browse our wide selection of prescription and over-the-counter products.
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="grid grid-cols-3 gap-6">
            {statsData.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-primary">{stat.value}</div>
                <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Search and Sort Bar */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by medicine name, brand, or condition..."
              className="pl-12 h-11 text-base"
              aria-label="Search medicines"
            />
          </div>

          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div className="flex gap-2 items-center">
              <span className="text-sm font-semibold text-foreground">Filter:</span>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-1 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors"
              >
                <FilterIcon className="size-4" />
                Filters
              </button>
            </div>
            
            <div className="flex gap-2 items-center">
              <span className="text-sm font-semibold text-foreground">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-3 py-2 rounded-lg border border-input text-sm font-medium bg-background cursor-pointer hover:bg-secondary transition-colors"
              >
                <option value="relevance">Relevance</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <div className={`${showFilters ? "block" : "hidden"} lg:block w-full lg:w-64 space-y-6 pb-8`}>
            {/* Type Filter */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="font-semibold text-foreground mb-4 text-sm">Product Type</h3>
              <div className="space-y-3">
                {(["all", "otc", "rx"] as const).map((option) => (
                  <label key={option} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="type"
                      value={option}
                      checked={type === option}
                      onChange={() => setType(option)}
                      className="w-4 h-4 cursor-pointer accent-primary"
                    />
                    <span className="text-sm text-foreground group-hover:text-primary font-medium">
                      {option === "all" ? "All Products" : option === "otc" ? "Over the Counter" : "Prescription Required"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="bg-card rounded-lg border border-border p-5">
              <h3 className="font-semibold text-foreground mb-4 text-sm">Category</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {categories.map((option) => (
                  <button
                    key={option}
                    onClick={() => setCategory(option)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      category === option
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-secondary"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{results.length}</span> product
                {results.length !== 1 ? "s" : ""} found
              </p>
            </div>

            {/* Product Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((medicine) => (
                <MedicineCard key={medicine.id} medicine={medicine} />
              ))}
            </div>

            {/* Empty State */}
            {results.length === 0 && (
              <div className="mt-16 text-center py-12 bg-secondary rounded-lg border border-border">
                <ShoppingBag className="size-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-semibold text-foreground">No medicines found</p>
                <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
