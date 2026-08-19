import axios from "axios";

export type User = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_pharmacist: boolean;
};

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
  image_url: string | null;
};

export type OrderItem = {
  id: string;
  medicine_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
};

export type Order = {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  total: number;
  status: string;
  prescription_path: string | null;
  created_at: string;
  items: OrderItem[];
};

const api = axios.create({
  baseURL: import.meta.env["VITE_API_URL"] ?? "http://127.0.0.1:8000",
});

api.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("rxease.access_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const apiClient = {
  auth: {
    async login(email: string, password: string) {
      const body = new URLSearchParams({ username: email, password });
      const { data } = await api.post<{ access_token: string }>("/api/auth/login", body, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      return data;
    },
    async register(payload: { email: string; password: string; full_name: string }) {
      const { data } = await api.post<{ access_token: string }>("/api/auth/register", payload);
      return data;
    },
    async me() {
      const { data } = await api.get<User>("/api/auth/me");
      return data;
    },
  },
  medicines: {
    async list() {
      const { data } = await api.get<Medicine[]>("/api/medicines");
      return data;
    },
  },
  orders: {
    async list() {
      const { data } = await api.get<Order[]>("/api/orders");
      return data;
    },
    async create(payload: {
      full_name: string;
      phone: string;
      address: string;
      items: { medicine_id: string; quantity: number }[];
    }) {
      const { data } = await api.post<Order>("/api/orders", payload);
      return data;
    },
    async uploadPrescription(orderId: string, file: File) {
      const body = new FormData();
      body.append("file", file);
      const { data } = await api.post<Order>(`/api/orders/${orderId}/prescription`, body);
      return data;
    },
  },
};

export function apiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}
