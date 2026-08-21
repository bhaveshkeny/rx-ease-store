import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Pencil, Plus, ShieldAlert, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient, apiErrorMessage, type Medicine, type MedicineInput } from "@/lib/api";
import { currency } from "@/lib/cart";
import { useAuth } from "@/hooks/useAuth";
import { TableRowSkeleton } from "@/components/skeletons";

export const Route = createFileRoute("/_authenticated/medicines")({
  head: () => ({
    meta: [
      { title: "Manage Medicines — MediCare Pharmacy" },
      {
        name: "description",
        content: "Pharmacist tools to add, edit and remove medicines from the catalogue.",
      },
      { property: "og:title", content: "Manage Medicines — MediCare Pharmacy" },
      {
        property: "og:description",
        content: "Pharmacist tools to add, edit and remove medicines from the catalogue.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ManageMedicinesPage,
});

const emptyForm: MedicineInput = {
  name: "",
  brand: "",
  category: "",
  description: "",
  price: 0,
  pack_size: "",
  requires_prescription: false,
  stock: 0,
  image_url: "",
};

const PAGE_SIZE = 8;

function toForm(medicine: Medicine): MedicineInput {
  return {
    name: medicine.name,
    brand: medicine.brand ?? "",
    category: medicine.category,
    description: medicine.description ?? "",
    price: medicine.price,
    pack_size: medicine.pack_size ?? "",
    requires_prescription: medicine.requires_prescription,
    stock: medicine.stock,
    image_url: medicine.image_url ?? "",
  };
}

function normalise(form: MedicineInput): MedicineInput {
  return {
    ...form,
    name: form.name.trim(),
    category: form.category.trim(),
    brand: form.brand?.trim() ? form.brand.trim() : null,
    description: form.description?.trim() ? form.description.trim() : null,
    pack_size: form.pack_size?.trim() ? form.pack_size.trim() : null,
    image_url: form.image_url?.trim() ? form.image_url.trim() : null,
    price: Number(form.price) || 0,
    stock: Number(form.stock) || 0,
  };
}

function ManageMedicinesPage() {
  const { user } = useAuth();
  const isPharmacist = Boolean(user?.is_pharmacist);

  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MedicineInput>(emptyForm);

  const { data, isLoading, error } = useQuery({
    queryKey: ["medicines"],
    queryFn: apiClient.medicines.list,
    enabled: isPharmacist,
  });

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil((data?.length ?? 0) / PAGE_SIZE));

  // Keep the current page in range if the catalogue shrinks (e.g. after a delete)
  // or grows (e.g. after the query first loads).
  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pagedData = useMemo(() => {
    if (!data) return [];
    const start = (page - 1) * PAGE_SIZE;
    return data.slice(start, start + PAGE_SIZE);
  }, [data, page]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["medicines"] });

  const reset = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: MedicineInput) =>
      editingId
        ? apiClient.medicines.update(editingId, payload)
        : apiClient.medicines.create(payload),
    onSuccess: async (medicine) => {
      toast.success(`${medicine.name} ${editingId ? "updated" : "added"}`);
      reset();
      await invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.medicines.remove(id),
    onSuccess: async () => {
      toast.success("Medicine removed");
      reset();
      await invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = normalise(form);
    if (!payload.name || !payload.category) {
      toast.error("Name and category are required");
      return;
    }
    saveMutation.mutate(payload);
  };

  if (!isPharmacist) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldAlert className="size-7" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Access restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don't have access to this page. Inventory management is only available to
          pharmacist accounts.
        </p>
        <Button asChild className="mt-6">
          <Link to="/shop">Back to shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Inventory</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Manage medicines</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pharmacist-only tools to add, update and remove catalogue items.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">
              {editingId ? "Edit medicine" : "Add medicine"}
            </CardTitle>
            {editingId && (
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="mr-1 size-4" /> Cancel
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={form.brand ?? ""}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pack_size">Pack size</Label>
                <Input
                  id="pack_size"
                  value={form.pack_size ?? ""}
                  onChange={(e) => setForm({ ...form, pack_size: e.target.value })}
                  placeholder="e.g. 16 tablets"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={form.description ?? ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2">
                <Label htmlFor="rx" className="text-sm">
                  Prescription required
                </Label>
                <Switch
                  id="rx"
                  checked={form.requires_prescription}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, requires_prescription: checked })
                  }
                />
              </div>

              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 size-4" />
                )}
                {editingId ? "Save changes" : "Add medicine"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Catalogue ({data?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} />
                  ))}
                </TableBody>
              </Table>
            )}
            {error && <p className="text-sm text-destructive">{apiErrorMessage(error)}</p>}

            {data && data.length > 0 && (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedData.map((medicine) => (
                      <TableRow key={medicine.id}>
                        <TableCell>
                          <div className="font-medium">{medicine.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {medicine.brand ?? "—"}
                            {medicine.requires_prescription && (
                              <Badge variant="secondary" className="ml-2">
                                Rx
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{medicine.category}</TableCell>
                        <TableCell className="text-sm">{currency(medicine.price)}</TableCell>
                        <TableCell className="text-sm">{medicine.stock}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Edit ${medicine.name}`}
                              onClick={() => {
                                setEditingId(medicine.id);
                                setForm(toForm(medicine));
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Delete ${medicine.name}`}
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (window.confirm(`Delete ${medicine.name}?`)) {
                                  deleteMutation.mutate(medicine.id);
                                }
                              }}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                    <p className="text-xs text-muted-foreground">
                      Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, data.length)} of{" "}
                      {data.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Previous page"
                        disabled={page === 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                          <Button
                            key={pageNumber}
                            variant={pageNumber === page ? "default" : "ghost"}
                            size="icon"
                            className="text-sm"
                            onClick={() => setPage(pageNumber)}
                            aria-current={pageNumber === page ? "page" : undefined}
                          >
                            {pageNumber}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Next page"
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {data && data.length === 0 && (
              <p className="text-sm text-muted-foreground">No medicines yet — add the first one.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
