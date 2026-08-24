import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  FileCheck2,
  Filter as FilterIcon,
  PackageOpen,
  Pill,
  Search,
  ShoppingBag,
} from "lucide-react";
import { useMemo, useState } from "react";

import { MedicineCard } from "@/components/MedicineCard";
import {
  CategoryFilterSkeleton,
  MedicineGridSkeleton,
  StatCardSkeleton,
} from "@/components/Skeletons";
import { Input } from "@/components/ui/input";
import { medicinesQuery } from "@/lib/medicines";

export const Route = createFileRoute("/shop")({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(
      medicinesQuery(1, 6),
    );
  },

  head: () => ({
    meta: [
      {
        title: "Shop Medicines — RxEase Pharmacy",
      },
      {
        name: "description",
        content:
          "Browse prescription and over-the-counter medicines. Fast delivery, quality products, professional service. Find pain relief, allergy, antibiotics, diabetes care and more.",
      },
      {
        property: "og:title",
        content: "Shop Medicines — RxEase Pharmacy",
      },
      {
        property: "og:description",
        content:
          "Buy prescription and over-the-counter medicines online with fast delivery.",
      },
    ],
  }),

  component: ShopPage,
});

type TypeFilter = "all" | "otc" | "rx";

type SortBy =
  | "relevance"
  | "price-low"
  | "price-high"
  | "name";

function ShopPage() {
  const [page, setPage] = useState(1);
  const pageSize = 6;

  const {
    data,
    isLoading,
    error,
    isFetching,
  } = useQuery(medicinesQuery(page, pageSize));

  const medicines = data?.items ?? [];
  const totalPages = data?.total_pages ?? 0;

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [type, setType] =
    useState<TypeFilter>("all");
  const [sortBy, setSortBy] =
    useState<SortBy>("relevance");
  const [showFilters, setShowFilters] =
    useState(false);

  const hasActiveFilters =
    search.trim() !== "" ||
    category !== "All" ||
    type !== "all" ||
    sortBy !== "relevance";

  const resetFilters = () => {
    setSearch("");
    setCategory("All");
    setType("all");
    setSortBy("relevance");
    setPage(1);
  };

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          medicines.map(
            (medicine) => medicine.category,
          ),
        ),
      ).sort(),
    ],
    [medicines],
  );

  const results = useMemo(() => {
    const term = search.trim().toLowerCase();

    const filtered = medicines.filter(
      (medicine) => {
        const matchesTerm =
          !term ||
          medicine.name
            .toLowerCase()
            .includes(term) ||
          (medicine.brand ?? "")
            .toLowerCase()
            .includes(term) ||
          medicine.category
            .toLowerCase()
            .includes(term);

        const matchesCategory =
          category === "All" ||
          medicine.category === category;

        const matchesType =
          type === "all" ||
          (type === "rx"
            ? medicine.requires_prescription
            : !medicine.requires_prescription);

        return (
          matchesTerm &&
          matchesCategory &&
          matchesType
        );
      },
    );

    switch (sortBy) {
      case "price-low":
        filtered.sort(
          (first, second) =>
            Number(first.price) -
            Number(second.price),
        );
        break;

      case "price-high":
        filtered.sort(
          (first, second) =>
            Number(second.price) -
            Number(first.price),
        );
        break;

      case "name":
        filtered.sort((first, second) =>
          first.name.localeCompare(second.name),
        );
        break;

      default:
        break;
    }

    return filtered;
  }, [
    medicines,
    search,
    category,
    type,
    sortBy,
  ]);

  const statsData = [
    {
      label: "Available medicines",
      value: data?.total ?? 0,
      detail: "Across all pages",
      icon: PackageOpen,
      iconClass: "bg-primary/10 text-primary",
    },
    {
      label: "OTC products on page",
      value: medicines.filter(
        (medicine) =>
          !medicine.requires_prescription,
      ).length,
      detail: "No prescription needed",
      icon: ShoppingBag,
      iconClass: "bg-success/10 text-success",
    },
    {
      label: "Prescription items on page",
      value: medicines.filter(
        (medicine) =>
          medicine.requires_prescription,
      ).length,
      detail: "Pharmacist review",
      icon: FileCheck2,
      iconClass: "bg-rx/10 text-rx",
    },
  ];

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold">
          Medicine catalogue unavailable
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Start the backend service and refresh this
          page to load the catalogue.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
          Medicines
        </p>

        <div className="mt-2 flex items-center gap-3">
          <Pill className="size-7 text-primary" />

          <h1 className="text-3xl font-semibold tracking-tight">
            Online pharmacy
          </h1>
        </div>

        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Browse prescription and over-the-counter
          medicines with pharmacist guidance and home
          delivery.
        </p>
      </header>

      <div className="mb-8 grid gap-3 sm:grid-cols-3 sm:gap-5">
        {isLoading
          ? Array.from({ length: 3 }).map(
              (_, index) => (
                <StatCardSkeleton key={index} />
              ),
            )
          : statsData.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-card"
              >
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${stat.iconClass}`}
                >
                  <stat.icon className="size-5" />
                </div>

                <div className="min-w-0">
                  <div className="text-2xl font-bold leading-none text-foreground">
                    {stat.value}
                  </div>

                  <div className="mt-1 truncate text-xs font-semibold text-foreground">
                    {stat.label}
                  </div>

                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {stat.detail}
                  </div>
                </div>
              </div>
            ))}
      </div>

      <div>
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by medicine name, brand, or condition..."
              className="h-11 pl-12 pr-10 text-base"
              aria-label="Search medicines"
            />

            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setShowFilters(
                    (current) => !current,
                  )
                }
                className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary lg:hidden"
              >
                <FilterIcon className="size-4" />
                Filters
              </button>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="medicine-sort"
                className="text-sm font-semibold text-foreground"
              >
                Sort:
              </label>

              <select
                id="medicine-sort"
                value={sortBy}
                onChange={(event) =>
                  setSortBy(
                    event.target.value as SortBy,
                  )
                }
                className="cursor-pointer rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary"
              >
                <option value="relevance">
                  Relevance
                </option>
                <option value="price-low">
                  Price: Low to High
                </option>
                <option value="price-high">
                  Price: High to Low
                </option>
                <option value="name">
                  Name: A to Z
                </option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4">
          {isLoading ? (
            <div className="h-5 w-32 animate-pulse rounded bg-primary/10" />
          ) : (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">
                {results.length}
              </span>{" "}
              product
              {results.length !== 1 ? "s" : ""} shown
              on this page
            </p>
          )}
        </div>

        <div className="flex items-start gap-8">
          <aside
            className={`w-full shrink-0 space-y-4 pb-8 lg:sticky lg:top-6 lg:block lg:max-h-[calc(100vh-3rem)] lg:w-64 lg:self-start lg:overflow-y-auto ${
              showFilters ? "block" : "hidden"
            }`}
          >
            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                Product Type
              </h3>

              <div className="space-y-3">
                {(
                  [
                    "all",
                    "otc",
                    "rx",
                  ] as const
                ).map((option) => (
                  <label
                    key={option}
                    className="group flex cursor-pointer items-center gap-3"
                  >
                    <input
                      type="radio"
                      name="type"
                      value={option}
                      checked={type === option}
                      onChange={() => {
                        setType(option);
                        setPage(1);
                      }}
                      className="size-4 cursor-pointer accent-primary"
                    />

                    <span className="text-sm font-medium text-foreground group-hover:text-primary">
                      {option === "all"
                        ? "All Products"
                        : option === "otc"
                          ? "Over the Counter"
                          : "Prescription Required"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-card">
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                Category
              </h3>

              {isLoading ? (
                <CategoryFilterSkeleton count={6} />
              ) : (
                <div className="relative">
                  <div className="max-h-64 space-y-1 overflow-y-auto pb-1 pr-1 scroll-py-1">
                    {categories.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setCategory(option);
                          setPage(1);
                        }}
                        className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all ${
                          category === option
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 rounded-b-lg bg-gradient-to-t from-card to-transparent" />
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-semibold text-muted-foreground shadow-card transition-colors hover:border-primary/40 hover:text-primary"
              >
                Clear all filters
              </button>
            )}
          </aside>

          <main className="min-w-0 flex-1">
            {isLoading ? (
              <MedicineGridSkeleton count={6} />
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((medicine) => (
                    <MedicineCard
                      key={medicine.id}
                      medicine={medicine}
                    />
                  ))}
                </div>

                {results.length === 0 && (
                  <div className="mt-16 rounded-xl border border-border bg-secondary py-12 text-center">
                    <ShoppingBag className="mx-auto mb-4 size-12 text-muted-foreground" />

                    <p className="text-lg font-semibold text-foreground">
                      No medicines found
                    </p>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Try adjusting your search or
                      filters.
                    </p>
                  </div>
                )}
              </>
            )}

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setPage((currentPage) =>
                      Math.max(
                        1,
                        currentPage - 1,
                      ),
                    )
                  }
                  disabled={
                    page === 1 || isFetching
                  }
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPage((currentPage) =>
                      Math.min(
                        totalPages,
                        currentPage + 1,
                      ),
                    )
                  }
                  disabled={
                    page === totalPages ||
                    isFetching
                  }
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}