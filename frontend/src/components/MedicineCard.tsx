import { Check, FileText, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currency, useCart } from "@/lib/cart";
import type { Medicine } from "@/lib/medicines";

export function MedicineCard({ medicine }: { medicine: Medicine }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    add({
      id: medicine.id,
      name: medicine.name,
      price: Number(medicine.price),
      packSize: medicine.pack_size,
      requiresPrescription: medicine.requires_prescription,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <article className="card-lift hover:card-lift-hover flex flex-col rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <Badge variant="secondary" className="rounded-full">
          {medicine.category}
        </Badge>
        {medicine.requires_prescription ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-rx/12 px-2.5 py-1 text-xs font-semibold text-rx">
            <FileText className="size-3.5" /> Rx only
          </span>
        ) : (
          <span className="rounded-full bg-success/12 px-2.5 py-1 text-xs font-semibold text-success">
            OTC
          </span>
        )}
      </div>

      <h3 className="mt-3 text-base font-semibold leading-snug">{medicine.name}</h3>
      <p className="text-xs text-muted-foreground">
        {medicine.brand ?? "Generic"}
        {medicine.pack_size ? ` · ${medicine.pack_size}` : ""}
      </p>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{medicine.description}</p>

      <div className="mt-4 flex items-end justify-between gap-3 pt-1">
        <div>
          <p className="font-display text-xl font-semibold">{currency(Number(medicine.price))}</p>
          <p className="text-xs text-muted-foreground">
            {medicine.stock > 0 ? `${medicine.stock} in stock` : "Out of stock"}
          </p>
        </div>
        <Button size="sm" onClick={handleAdd} disabled={medicine.stock <= 0}>
          {added ? <Check className="size-4" /> : <Plus className="size-4" />}
          {added ? "Added" : "Add"}
        </Button>
      </div>
    </article>
  );
}
