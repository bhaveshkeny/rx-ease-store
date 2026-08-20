import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ReactNode } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  packSize: string | null;
  requiresPrescription: boolean;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((entry) => entry.id === item.id);
          if (existing) {
            return {
              items: state.items.map((entry) =>
                entry.id === item.id ? { ...entry, quantity: entry.quantity + quantity } : entry,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        }),
      setQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((entry) => entry.id !== id)
              : state.items.map((entry) => (entry.id === id ? { ...entry, quantity } : entry)),
        })),
      remove: (id) => set((state) => ({ items: state.items.filter((entry) => entry.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    { name: "medicare.cart.v1" },
  ),
);

export function useCart() {
  const items = useCartStore((state) => state.items);
  const add = useCartStore((state) => state.add);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const remove = useCartStore((state) => state.remove);
  const clear = useCartStore((state) => state.clear);
  return {
    items,
    count: items.reduce((sum, entry) => sum + entry.quantity, 0),
    subtotal: items.reduce((sum, entry) => sum + entry.quantity * entry.price, 0),
    needsPrescription: items.some((entry) => entry.requiresPrescription),
    add,
    setQuantity,
    remove,
    clear,
  };
}

export const CartProvider = ({ children }: { children: ReactNode }) => children;

export const currency = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
