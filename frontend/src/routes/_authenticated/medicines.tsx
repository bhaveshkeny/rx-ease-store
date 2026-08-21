import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
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
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MedicineInput>(emptyForm);

  const { data, isLoading, error } = useQuery({
    queryKey: ["medicines"],
    queryFn: apiClient.medicines.list,
  });

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8">
        <h1 className="font-display text-3xl font-semibold">Manage medicines</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pharmacist-only tools to add, update and remove catalogue items.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
        <Card className="h-fit">
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
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={form.image_url ?? ""}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Catalogue ({data?.length ?? 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading catalogue…
              </p>
            )}
            {error && <p className="text-sm text-destructive">{apiErrorMessage(error)}</p>}

            {data && data.length > 0 && (
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
                  {data.map((medicine) => (
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
