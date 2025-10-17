export interface HanaMoneyDto {
  id: number
  userId: number
  balance: string
  totalEarned: string
  totalUsed: string
  totalTransferred: string
  createdAt: string
  updatedAt: string
}

export interface HanaMoneyTransactionDto {
  id: number
  userId: number
  transactionType: string
  category: string
  amount: string
  balanceAfter: string
  description: string
  referenceId?: string
  createdAt: string
}

export interface HanaMoneyRequestDto {
  userId: number
  transactionType: string
  category: string
  amount: string
  description: string
  referenceId?: string
}

export interface HanaMoneyTransferRequestDto {
  userId: number
  amount: string
  accountNumber: string
  bankCode: string
  accountHolder: string
}

export interface HanaMoneyMonthlyStatsDto {
  userId: number
  year: number
  month: number
  monthlyEarned: string
  monthlyUsed: string
  monthlyTransferred: string
}

export interface HanaMoneyConfigDto {
  id: number
  configType: string
  amount: string
  description: string
  isActive: boolean
  conditions: string
  createdAt: string
  updatedAt: string
}

// 거래 타입 열거형
export enum TransactionType {
  EARN = 'EARN',
  USE = 'USE',
  TRANSFER = 'TRANSFER'
}

// 거래 카테고리 열거형
export enum TransactionCategory {
  ATTENDANCE = 'ATTENDANCE',
  QUIZ = 'QUIZ',
  NEWS = 'NEWS',
  STORE = 'STORE',
  TRANSFER = 'TRANSFER',
  EVENT = 'EVENT',
  INVITE = 'INVITE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY'
}

// 설정 타입 열거형
export enum ConfigType {
  DAILY_ATTENDANCE = 'DAILY_ATTENDANCE',
  WEEKLY_ATTENDANCE = 'WEEKLY_ATTENDANCE',
  MONTHLY_ATTENDANCE = 'MONTHLY_ATTENDANCE',
  QUIZ_CORRECT = 'QUIZ_CORRECT',
  NEWS_READ = 'NEWS_READ',
  FRIEND_INVITE = 'FRIEND_INVITE',
  DAILY_QUIZ = 'DAILY_QUIZ',
  WEEKLY_QUIZ = 'WEEKLY_QUIZ',
  MONTHLY_QUIZ = 'MONTHLY_QUIZ',
  EVENT_PARTICIPATION = 'EVENT_PARTICIPATION',
  STORE_PURCHASE = 'STORE_PURCHASE',
  ACCOUNT_TRANSFER = 'ACCOUNT_TRANSFER'
} 