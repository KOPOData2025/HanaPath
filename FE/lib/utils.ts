import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 생년월일을 YYYY-MM-DD 형식으로 변환하는 함수
export function convertNationalIdToBirthDate(nationalIdFront: string, nationalIdBackFirst?: string): string {
  if (!nationalIdFront || nationalIdFront.length !== 6) {
    return ""
  }
  
  const year = nationalIdFront.substring(0, 2)
  const month = nationalIdFront.substring(2, 4)
  const day = nationalIdFront.substring(4, 6)
  
  // 성별 코드로 출생연대 결정 (별자리 계산에는 연도가 필요 없지만, 정확성을 위해)
  let fullYear: string
  if (nationalIdBackFirst) {
    const genderCode = parseInt(nationalIdBackFirst)
    if (genderCode === 1 || genderCode === 2) {
      // 1900년대 출생
      fullYear = `19${year}`
    } else if (genderCode === 3 || genderCode === 4) {
      // 2000년대 출생
      fullYear = `20${year}`
    } else {
      // 기본값으로 2000년대 출생
      fullYear = `20${year}`
    }
  } else {
    // 성별 정보가 없으면 2000년대 출생으로 가정
    fullYear = `20${year}`
  }
  
  return `${fullYear}-${month}-${day}`
}

// 계좌번호 포맷팅 함수
export function formatAccountNumber(accountNumber: string, type: 'wallet' | 'investment'): string {
  if (!accountNumber) return ''
  
  if (type === 'wallet') {
    // 디지털 지갑: 62012345678901 -> 620-123456-78901
    if (accountNumber.length === 14 && accountNumber.startsWith('620')) {
      return `${accountNumber.slice(0, 3)}-${accountNumber.slice(3, 9)}-${accountNumber.slice(9)}`
    }
  } else if (type === 'investment') {
    // 모의 투자: 12345678010 -> 12345678-010
    if (accountNumber.length === 11 && accountNumber.endsWith('010')) {
      return `${accountNumber.slice(0, 8)}-${accountNumber.slice(8)}`
    }
  }
  
  // 형식이 맞지 않으면 원본 반환
  return accountNumber
}

// 전화번호 포맷팅 함수
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return ''
  
  // 숫자만 추출
  const numbers = phoneNumber.replace(/[^0-9]/g, '')
  
  // 길이에 따라 포맷팅
  if (numbers.length <= 3) {
    return numbers
  } else if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
  } else if (numbers.length <= 11) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
  }
}

// 계좌번호 포맷팅 함수 (입력용)
export function formatAccountNumberInput(accountNumber: string, type: 'wallet' | 'investment'): string {
  if (!accountNumber) return ''
  
  // 숫자만 추출
  const numbers = accountNumber.replace(/[^0-9]/g, '')
  
  if (type === 'wallet') {
    // 디지털 지갑: 62012345678901 -> 620-123456-78901
    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    } else if (numbers.length <= 14) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 9)}-${numbers.slice(9)}`
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 9)}-${numbers.slice(9, 14)}`
    }
  } else if (type === 'investment') {
    // 모의 투자: 12345678010 -> 12345678-010
    if (numbers.length <= 8) {
      return numbers
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 8)}-${numbers.slice(8)}`
    } else {
      return `${numbers.slice(0, 8)}-${numbers.slice(8, 11)}`
    }
  }
  
  return numbers
}
