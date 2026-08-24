import type { ReactNode } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  packSize: string | null;
  requiresPrescription: boolean;
  quantity: number;
};

type CartState = {
  cartsByUser: Record<string, CartItem[]>;
  guestItems: CartItem[];
  activeUserId: string | null;
  setActiveUser: (userId: string | null) => void;
  add: (
    item: Omit<CartItem, "quantity">,
    quantity?: number,
  ) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const EMPTY_CART: CartItem[] = [];

function mergeItems(
  savedItems: CartItem[],
  guestItems: CartItem[],
) {
  let mergedItems = [...savedItems];

  for (const guestItem of guestItems) {
    const existing = mergedItems.some(
      (item) => item.id === guestItem.id,
    );

    if (existing) {
      mergedItems = mergedItems.map((item) =>
        item.id === guestItem.id
          ? {
              ...item,
              quantity: item.quantity + guestItem.quantity,
            }
          : item,
      );
    } else {
      mergedItems = [...mergedItems, guestItem];
    }
  }

  return mergedItems;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cartsByUser: {},
      guestItems: [],
      activeUserId: null,

      setActiveUser: (userId) => {
        set((state) => {
          if (!userId) {
            return {
              activeUserId: null,
              guestItems: [],
            };
          }

          const savedItems =
            state.cartsByUser[userId] ?? EMPTY_CART;

          const mergedItems = mergeItems(
            savedItems,
            state.guestItems,
          );

          return {
            activeUserId: userId,
            guestItems: [],
            cartsByUser: {
              ...state.cartsByUser,
              [userId]: mergedItems,
            },
          };
        });
      },

      add: (item, quantity = 1) => {
        set((state) => {
          const currentItems = state.activeUserId
            ? state.cartsByUser[state.activeUserId] ??
              EMPTY_CART
            : state.guestItems;

          const existing = currentItems.find(
            (entry) => entry.id === item.id,
          );

          const updatedItems = existing
            ? currentItems.map((entry) =>
                entry.id === item.id
                  ? {
                      ...entry,
                      quantity: entry.quantity + quantity,
                    }
                  : entry,
              )
            : [...currentItems, { ...item, quantity }];

          if (!state.activeUserId) {
            return {
              guestItems: updatedItems,
            };
          }

          return {
            cartsByUser: {
              ...state.cartsByUser,
              [state.activeUserId]: updatedItems,
            },
          };
        });
      },

      setQuantity: (id, quantity) => {
        set((state) => {
          const currentItems = state.activeUserId
            ? state.cartsByUser[state.activeUserId] ??
              EMPTY_CART
            : state.guestItems;

          const updatedItems =
            quantity <= 0
              ? currentItems.filter(
                  (entry) => entry.id !== id,
                )
              : currentItems.map((entry) =>
                  entry.id === id
                    ? { ...entry, quantity }
                    : entry,
                );

          if (!state.activeUserId) {
            return {
              guestItems: updatedItems,
            };
          }

          return {
            cartsByUser: {
              ...state.cartsByUser,
              [state.activeUserId]: updatedItems,
            },
          };
        });
      },

      remove: (id) => {
        set((state) => {
          const currentItems = state.activeUserId
            ? state.cartsByUser[state.activeUserId] ??
              EMPTY_CART
            : state.guestItems;

          const updatedItems = currentItems.filter(
            (entry) => entry.id !== id,
          );

          if (!state.activeUserId) {
            return {
              guestItems: updatedItems,
            };
          }

          return {
            cartsByUser: {
              ...state.cartsByUser,
              [state.activeUserId]: updatedItems,
            },
          };
        });
      },

      clear: () => {
        set((state) => {
          if (!state.activeUserId) {
            return {
              guestItems: [],
            };
          }

          return {
            cartsByUser: {
              ...state.cartsByUser,
              [state.activeUserId]: [],
            },
          };
        });
      },
    }),
    {
      name: "medicare.carts.v2",

      partialize: (state) => ({
        cartsByUser: state.cartsByUser,
      }),
    },
  ),
);

export function useCart() {
  const items = useCartStore((state) =>
    state.activeUserId
      ? state.cartsByUser[state.activeUserId] ??
        EMPTY_CART
      : state.guestItems,
  );

  const add = useCartStore((state) => state.add);
  const setQuantity = useCartStore(
    (state) => state.setQuantity,
  );
  const remove = useCartStore((state) => state.remove);
  const clear = useCartStore((state) => state.clear);

  return {
    items,
    count: items.reduce(
      (sum, entry) => sum + entry.quantity,
      0,
    ),
    subtotal: items.reduce(
      (sum, entry) =>
        sum + entry.quantity * entry.price,
      0,
    ),
    needsPrescription: items.some(
      (entry) => entry.requiresPrescription,
    ),
    add,
    setQuantity,
    remove,
    clear,
  };
}

export const CartProvider = ({
  children,
}: {
  children: ReactNode;
}) => children;

export const currency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);