import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileCheck2, Search, ShoppingBag, Pill, Filter as FilterIcon, PackageOpen } from "lucide-react";
import { useMemo, useState } from "react";
import { MedicineCard } from "@/components/MedicineCard";
import { CategoryFilterSkeleton, MedicineGridSkeleton, StatCardSkeleton } from "@/components/skeletons";
import { Input } from "@/components/ui/input";
import { medicinesQuery } from "@/lib/medicines";

export const Route = createFileRoute("/shop")({
  // Start the fetch but don't make the router wait for it — this is what
  // was blocking navigation. The component's own isLoading state (already
  // wired to the shimmer below) takes over the instant it mounts.
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(medicinesQuery);
  },
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

  const hasActiveFilters = search.trim() !== "" || category !== "All" || type !== "all" || sortBy !== "relevance";

  const resetFilters = () => {
    setSearch("");
    setCategory("All");
    setType("all");
    setSortBy("relevance");
  };

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
    {
      label: "Available medicines",
      value: medicines.length,
      detail: "Ready to browse",
      icon: PackageOpen,
      iconClass: "bg-primary/10 text-primary",
    },
    {
      label: "OTC products",
      value: medicines.filter((medicine) => !medicine.requires_prescription).length,
      detail: "No prescription needed",
      icon: ShoppingBag,
      iconClass: "bg-success/10 text-success",
    },
    {
      label: "Prescription items",
      value: medicines.filter((medicine) => medicine.requires_prescription).length,
      detail: "Pharmacist review",
      icon: FileCheck2,
      iconClass: "bg-rx/10 text-rx",
    },
  ];

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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Medicines</p>
        <div className="mt-2 flex items-center gap-3">
          <Pill className="size-7 text-primary" />
          <h1 className="text-3xl font-semibold tracking-tight">Online pharmacy</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Browse prescription and over-the-counter medicines with pharmacist guidance and home delivery.
        </p>
      </header>

      <div className="mb-8 grid gap-3 sm:grid-cols-3 sm:gap-5">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
          : statsData.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card">
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${stat.iconClass}`}>
                  <stat.icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-2xl font-bold leading-none text-foreground">{stat.value}</div>
                  <div className="mt-1 truncate text-xs font-semibold text-foreground">{stat.label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{stat.detail}</div>
                </div>
              </div>
            ))}
      </div>

      <div>
        {/* Search and Sort Bar */}
        <div className="space-y-4 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by medicine name, brand, or condition..."
              className="h-11 pl-12 pr-10 text-base"
              aria-label="Search medicines"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3 justify-between items-center">
            <div className="flex gap-2 items-center">
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

        {/* Results Count */}
        <div className="mb-4">
          {isLoading ? (
            <div className="h-5 w-32 animate-pulse rounded bg-primary/10" />
          ) : (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{results.length}</span> product
              {results.length !== 1 ? "s" : ""} found
            </p>
          )}
        </div>

        <div className="flex items-start gap-8">
          {/* Sidebar Filters */}
          <div
            className={`${showFilters ? "block" : "hidden"} lg:block w-full lg:w-64 shrink-0 space-y-4 pb-8 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto`}
          >
            {/* Type Filter */}
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
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
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="font-semibold text-foreground mb-4 text-sm">Category</h3>
              {isLoading ? (
                <CategoryFilterSkeleton count={6} />
              ) : (
                <div className="relative">
                  <div className="space-y-1 max-h-64 overflow-y-auto pr-1 pb-1 scroll-py-1">
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
                  {/* Fade to signal more categories below instead of an abrupt cut */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-card to-transparent rounded-b-lg" />
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-semibold text-muted-foreground shadow-card transition-colors hover:border-primary/40 hover:text-primary"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Product Grid */}
            {isLoading ? (
              <MedicineGridSkeleton count={9} />
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((medicine) => (
                    <MedicineCard key={medicine.id} medicine={medicine} />
                  ))}
                </div>

                {/* Empty State */}
                {results.length === 0 && (
                  <div className="mt-16 rounded-xl border border-border bg-secondary py-12 text-center">
                    <ShoppingBag className="size-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-semibold text-foreground">No medicines found</p>
                    <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search or filters</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}