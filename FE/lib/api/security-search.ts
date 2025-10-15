import { SecuritySearchParams, SecuritySearchResult } from '@/types/security-search';

const CYBERCOP_API_URL = 'https://cybercop.cyber.go.kr/countFraud.do';

export const searchSecurityInfo = async (params: SecuritySearchParams): Promise<SecuritySearchResult> => {
  try {
    // 백엔드 프록시를 통한 호출 (CORS 문제 해결)
    const response = await fetch('/api/security-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('프록시 API 호출 실패');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('보안 검색 프록시 API 오류:', error);
    
    return {
      message: '검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      isSafe: false,
      fieldType: params.fieldType,
      keyword: params.keyword,
      isError: true,  // 오류 상태 표시
    };
  }
};

// 대안: 프록시 서버를 통한 API 호출 (CORS 문제 해결)
export const searchSecurityInfoProxy = async (params: SecuritySearchParams): Promise<SecuritySearchResult> => {
  try {
    // 백엔드 프록시를 통한 호출
    const response = await fetch('/api/security-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error('프록시 API 호출 실패');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('보안 검색 프록시 API 오류:', error);
    
    return {
      message: '검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      isSafe: false,
      fieldType: params.fieldType,
      keyword: params.keyword,
      isError: true,  // 오류 상태 표시
    };
  }
};
