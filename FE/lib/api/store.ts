// lib/api/store.ts

export interface Product {
  id: number
  name: string
  brand: string
  category: string
  price: number
  originalPrice?: number
  isPopular: boolean
  discount: number
  stock: number
  validDays: number
  vendor: string
  description: string
  imageBase64: string
}

export interface PurchaseHistory {
  id: number
  userId: number
  productId: number
  productName: string
  productBrand: string
  productCategory: string
  quantity: number
  totalPrice: number
  hanaMoneyUsed: number
  walletAmount: number
  purchaseDate: string
  expiryDate: string
  isUsed: boolean
  giftCode: string
  status: 'PURCHASED' | 'EXPIRED' | 'USED' | 'REFUNDED'
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export const fetchAllProducts = async (): Promise<Product[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/store/products`)
    if (!response.ok) {
      throw new Error('Failed to fetch products')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

export const fetchProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/store/products/category?category=${encodeURIComponent(category)}`)
    if (!response.ok) {
      throw new Error('Failed to fetch products by category')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching products by category:', error)
    throw error
  }
}

export const searchProducts = async (query: string): Promise<Product[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/store/products/search?query=${encodeURIComponent(query)}`)
    if (!response.ok) {
      throw new Error('Failed to search products')
    }
    return await response.json()
  } catch (error) {
    console.error('Error searching products:', error)
    throw error
  }
}

export const fetchProductById = async (id: number): Promise<Product> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/store/products/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch product')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching product:', error)
    throw error
  }
}

export const purchaseProduct = async (purchaseData: {
  productId: number
  userId: number
  quantity: number
  paymentMethod: string
  useHanaMoney: boolean
  hanaMoneyAmount: number
  walletPassword: string
}): Promise<string> => {
  try {
    const token = localStorage.getItem('access_token')
    if (!token) {
      throw new Error('로그인이 필요합니다. 다시 로그인해주세요.')
    }

    console.log('=== API 요청 데이터 ===')
    console.log('URL:', `${API_BASE_URL}/api/store/purchase`)
    console.log('Data:', purchaseData)
    console.log('Token:', token ? '존재함' : '없음')
    console.log('========================')

    const response = await fetch(`${API_BASE_URL}/api/store/purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(purchaseData)
    })
    
    console.log('=== API 응답 ===')
    console.log('Status:', response.status)
    console.log('Status Text:', response.statusText)
    console.log('Headers:', Object.fromEntries(response.headers.entries()))
    console.log('==================')
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      console.error('API 에러 응답:', errorData)
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.text()
    console.log('API 성공 응답:', result)
    return result
  } catch (error) {
    console.error('Error purchasing product:', error)
    throw error
  }
}

export const fetchUserPurchaseHistory = async (userId: number): Promise<PurchaseHistory[]> => {
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${API_BASE_URL}/api/store/purchase-history/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch purchase history')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching purchase history:', error)
    throw error
  }
}

export const fetchUserValidGifticons = async (userId: number): Promise<PurchaseHistory[]> => {
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${API_BASE_URL}/api/store/gifticons/valid/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch valid gifticons')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching valid gifticons:', error)
    throw error
  }
}

export const fetchUserExpiredGifticons = async (userId: number): Promise<PurchaseHistory[]> => {
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${API_BASE_URL}/api/store/gifticons/expired/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch expired gifticons')
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching expired gifticons:', error)
    throw error
  }
}

export const useGifticon = async (purchaseHistoryId: number, userId: number): Promise<string> => {
  try {
    const token = localStorage.getItem('access_token')
    const response = await fetch(`${API_BASE_URL}/api/store/gifticons/${purchaseHistoryId}/use?userId=${userId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Failed to use gifticon')
    }
    
    return await response.text()
  } catch (error) {
    console.error('Error using gifticon:', error)
    throw error
  }
}
  