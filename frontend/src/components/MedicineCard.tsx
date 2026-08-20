import { Check, FileText, Plus, Heart } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { currency, useCart } from "@/lib/cart";
import type { Medicine } from "@/lib/medicines";

export function MedicineCard({ medicine }: { medicine: Medicine }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(false);

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
    <article className="group h-full flex flex-col rounded-lg border border-border bg-card hover:border-primary hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Header with Badge */}
      <div className="flex items-start justify-between gap-2 p-5 pb-3">
        <Badge variant="secondary" className="rounded-full">
          {medicine.category}
        </Badge>
        <button
          onClick={() => setLiked(!liked)}
          className="p-1.5 rounded-full hover:bg-secondary transition-colors"
          aria-label="Add to wishlist"
        >
          <Heart
            className={`size-5 transition-all ${
              liked ? "fill-destructive text-destructive" : "text-muted-foreground"
            }`}
          />
        </button>
      </div>

      {/* Medicine Info */}
      <div className="px-5 pb-3 flex-1 flex flex-col">
        <h3 className="text-base font-semibold leading-snug text-foreground line-clamp-2">
          {medicine.name}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {medicine.brand ? (
            <>
              <span className="font-medium text-foreground">{medicine.brand}</span>
              {medicine.pack_size && <span> · {medicine.pack_size}</span>}
            </>
          ) : (
            <>
              <span className="text-muted-foreground">Generic</span>
              {medicine.pack_size && <span> · {medicine.pack_size}</span>}
            </>
          )}
        </p>

        {medicine.description && (
          <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{medicine.description}</p>
        )}

        {/* Rx/OTC Badge */}
        <div className="mt-3">
          {medicine.requires_prescription ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rx/10 px-3 py-1 text-xs font-semibold text-rx border border-rx/30">
              <FileText className="size-3.5" /> Rx Only
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success border border-success/30">
              ✓ OTC
            </span>
          )}
        </div>
      </div>

      {/* Footer with Price and Button */}
      <div className="border-t border-border px-5 py-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-bold text-primary">{currency(Number(medicine.price))}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {medicine.stock > 0 ? (
                <span>
                  <span className="font-semibold text-success">{medicine.stock}</span> in stock
                </span>
              ) : (
                <span className="text-destructive font-medium">Out of stock</span>
              )}
            </p>
          </div>
          <Button
            size="sm"
            variant={added ? "secondary" : "default"}
            onClick={handleAdd}
            disabled={medicine.stock <= 0}
          >
            {added ? (
              <>
                <Check className="size-4" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
}
