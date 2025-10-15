import axios from "axios";

// axios 인스턴스 생성 (공통 설정)
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

// 요청 인터셉터: JWT 토큰 자동 첨부
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 응답 인터셉터: 에러 로깅 및 처리
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("Wallet API Error:", error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// 디지털 지갑 생성
export async function createWallet(userId: number, data: {
    accountPassword: string;
    termsAgreed: boolean;
}) {
    const res = await api.post(`/api/wallet/${userId}/create`, data);
    return res.data;
}

// 디지털 지갑 조회
export async function getWallet(userId: number) {
    const res = await api.get(`/api/wallet/${userId}`);
    return res.data;
}

// 지갑 잔액 조회
export async function getWalletBalance(userId: number) {
    const res = await api.get(`/api/wallet/${userId}/balance`);
    return res.data;
}

// 지갑 소유 여부 확인
export async function hasWallet(userId: number): Promise<boolean> {
    const res = await api.get(`/api/wallet/${userId}/exists`);
    return res.data;
}

// 모의 투자 계좌 생성
export async function createInvestmentAccount(userId: number, data: {
    accountPassword: string;
    termsAgreed: boolean;
}) {
    const res = await api.post(`/api/investment-account/${userId}/create`, data);
    return res.data;
}

// 모의 투자 계좌 조회
export async function getInvestmentAccount(userId: number) {
    const res = await api.get(`/api/investment-account/${userId}`);
    return res.data;
}

// 투자 계좌 잔액 조회
export async function getInvestmentAccountBalance(userId: number) {
    const res = await api.get(`/api/investment-account/${userId}/balance`);
    return res.data;
}

// 투자 계좌 소유 여부 확인
export async function hasInvestmentAccount(userId: number): Promise<boolean> {
    const res = await api.get(`/api/investment-account/${userId}/exists`);
    return res.data;
}

// 모의 투자 계좌 재충전 (레벨/일 1회 정책 적용, BE 검증 포함)
export async function rechargeInvestmentAccount(userId: number) {
    const res = await api.post(`/api/investment-account/${userId}/recharge`);
    return res.data;
}

// 거래 내역 조회
export const getWalletTransactions = async (
  page: number = 0,
  size: number = 10,
  category?: string,
  type?: string,
  searchQuery?: string
) => {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('인증 토큰이 없습니다.');

  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });
  
  if (category) params.append('category', category);
  if (type) params.append('type', type);
  if (searchQuery) params.append('searchQuery', searchQuery);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/wallet/transactions?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('거래 내역 조회에 실패했습니다.');
  }

  return response.json();
};

// 거래 내역 요약 조회
export const getWalletTransactionSummary = async () => {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('인증 토큰이 없습니다.');

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/wallet/transactions/summary`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('거래 내역 요약 조회에 실패했습니다.');
  }

  return response.json();
};

// 거래 내역 생성
export const createWalletTransaction = async (transactionData: {
  title: string;
  category: string;
  amount: number;
  transactionDate?: string;
  description?: string;
}) => {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('인증 토큰이 없습니다.');

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/wallet/transactions`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    }
  );

  if (!response.ok) {
    throw new Error('거래 내역 생성에 실패했습니다.');
  }

  return response.json();
};

// 수신자 검색 (전화번호 또는 계좌번호로)
export const searchRecipient = async (searchType: 'phone' | 'account', searchValue: string) => {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('인증 토큰이 없습니다.');

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/search?type=${searchType}&value=${encodeURIComponent(searchValue)}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('수신자 검색에 실패했습니다.');
  }

  return response.json();
};

// 송금 실행
export const transferMoney = async (transferData: {
  recipientId: number;
  amount: number;
  password: string;
  description?: string;
}) => {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('인증 토큰이 없습니다.');

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/wallet/transfer`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transferData),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || '송금에 실패했습니다.');
  }

  return response.json();
};

// 비밀번호 검증
export const validateWalletPassword = async (password: string) => {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error('인증 토큰이 없습니다.');

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/wallet/validate-password`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    }
  );

  if (!response.ok) {
    throw new Error('비밀번호 검증에 실패했습니다.');
  }

  return response.json();
};