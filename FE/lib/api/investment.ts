import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("access_token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface OrderRequest {
  ticker: string
  name: string
  quantity: number
  price: number
  accountPassword?: string
}

export interface OrderResponse {
  transactionId: number
  ticker: string
  name: string
  type: 'BUY' | 'SELL'
  quantity: number
  pricePerShare: number
  amount: number
  newBalance: number
  createdAt: string
}

export interface HoldingResponse {
  ticker: string
  name: string
  quantity: number
  averagePrice: number
}

export interface TransactionResponse {
  id: number
  ticker: string
  name: string
  type: 'BUY' | 'SELL'
  quantity: number
  pricePerShare: number
  amount: number
  createdAt: string
}

export interface PagedTransactionsResponse {
  transactions: TransactionResponse[]
  total: number
}

export const buyStock = async (userId: number, payload: OrderRequest): Promise<OrderResponse> => {
  const { data } = await api.post(`/api/investment/${userId}/buy`, payload)
  return data
}

export const sellStock = async (userId: number, payload: OrderRequest): Promise<OrderResponse> => {
  const { data } = await api.post(`/api/investment/${userId}/sell`, payload)
  return data
}

export const getHoldings = async (userId: number): Promise<HoldingResponse[]> => {
  const { data } = await api.get(`/api/investment/${userId}/holdings`)
  return data
}

export const getTransactions = async (userId: number, page = 0, size = 20): Promise<PagedTransactionsResponse> => {
  const { data } = await api.get(`/api/investment/${userId}/transactions`, { params: { page, size } })
  return data
}

export const addFavorite = async (userId: number, ticker: string, name: string): Promise<void> => {
  await api.post(`/api/investment/${userId}/favorites`, null, { params: { ticker, name } })
}

export const removeFavorite = async (userId: number, ticker: string): Promise<void> => {
  await api.delete(`/api/investment/${userId}/favorites`, { params: { ticker } })
}

export interface FavoriteResponse {
  id: number
  ticker: string
  name: string
  createdAt: string
}

export const getFavorites = async (userId: number): Promise<FavoriteResponse[]> => {
  const { data } = await api.get(`/api/investment/${userId}/favorites`)
  return data
}
