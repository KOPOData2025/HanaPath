import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, 
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem("access_token") : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const upsertClientSnapshot = async (userId: number, profitRate: number) => {
  await api.post(`/api/investment/performance/snapshot/${userId}/client`, { profitRate })
}

export const getLatestProfitRate = async (userId: number) => {
  const response = await api.get(`/api/investment/performance/${userId}/latest`, { params: { limit: 1 } })
  if (response.data && response.data.length > 0) {
    return response.data[0].profitRate || 0
  }
  return 0
}


