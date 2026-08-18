import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Medicine = {
  id: string;
  name: string;
  brand: string | null;
  category: string;
  description: string | null;
  price: number;
  pack_size: string | null;
  requires_prescription: boolean;
  stock: number;
};

export const medicinesQuery = queryOptions({
  queryKey: ["medicines"],
  queryFn: async (): Promise<Medicine[]> => {
    const { data, error } = await supabase
      .from("medicines")
      .select("id, name, brand, category, description, price, pack_size, requires_prescription, stock")
      .order("requires_prescription", { ascending: true })
      .order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Medicine[];
  },
});
