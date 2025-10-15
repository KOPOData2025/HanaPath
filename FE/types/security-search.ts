export interface SecuritySearchParams {
  fieldType: 'H' | 'A' | 'E';  // H: 전화번호, A: 계좌번호, E: 이메일
  keyword: string;
  accessType: '3';
}

export interface SecuritySearchResult {
  message: string;
  isSafe: boolean;
  reportCount?: number;
  fieldType: 'H' | 'A' | 'E';
  keyword: string;
  isError?: boolean;  // 오류 상태 구분
  selectedBank?: any;  // 선택된 은행 정보
}

export type SearchFieldType = 'H' | 'A' | 'E';

export interface SearchFieldOption {
  value: SearchFieldType;
  label: string;
  placeholder: string;
  icon: string;
  description: string;  // 추가 설명
}
