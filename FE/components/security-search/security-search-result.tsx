'use client';

import type { SecuritySearchResult } from '@/types/security-search';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, XCircle, Info, Phone, CreditCard, Mail } from 'lucide-react';

interface SecuritySearchResultProps {
  result: SecuritySearchResult | null;
  isLoading: boolean;
}

export function SecuritySearchResult({ result, isLoading }: SecuritySearchResultProps) {
  // 디버깅을 위한 로그
  console.log('SecuritySearchResult - 받은 result:', result);
  console.log('isSafe 값:', result?.isSafe);
  console.log('isError 값:', result?.isError);
  console.log('message 값:', result?.message);
  
  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-600">검색 중...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return null;
  }

  const getFieldTypeLabel = (type: string) => {
    switch (type) {
      case 'H': return '전화번호';
      case 'A': return '계좌번호';
      case 'E': return '이메일';
      default: return '정보';
    }
  };

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'H': return <Phone className="w-4 h-4" />;
      case 'A': return <CreditCard className="w-4 h-4" />;
      case 'E': return <Mail className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  // 은행별 계좌번호 포맷 정보
  const bankFormats = {
   
    'NH농협은행': { length: 13, format: [3, 4, 4, 2] },
    '카카오뱅크': { length: 13, format: [4, 2, 7] },
    'KB국민은행': { length: 14, format: [6, 2, 6] },
    '토스뱅크': { length: 12, format: [4, 4, 4] },
    '신한은행': { length: 12, format: [3, 3, 6] },
    '우리은행': { length: 13, format: [4, 3, 6] },
    '하나은행': { length: 14, format: [3, 6, 5] },
  };

  // 번호 포맷팅 함수들
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatAccountNumber = (value: string, selectedBank?: any) => {
    const numbers = value.replace(/[^\d]/g, '');
    
    // 선택된 은행이 있으면 해당 은행의 포맷 적용
    if (selectedBank && selectedBank.format) {
      let formatted = '';
      let startIndex = 0;
      
      for (const segmentLength of selectedBank.format) {
        if (startIndex + segmentLength <= numbers.length) {
          formatted += numbers.slice(startIndex, startIndex + segmentLength);
          startIndex += segmentLength;
          
          if (startIndex < numbers.length) {
            formatted += '-';
          }
        }
      }
      
      return formatted;
    }
    
    // 선택된 은행이 없으면 기존 방식으로 포맷팅
    for (const [bankName, bankInfo] of Object.entries(bankFormats)) {
      if (numbers.length === bankInfo.length) {
        let formatted = '';
        let startIndex = 0;
        
        for (const segmentLength of bankInfo.format) {
          if (startIndex + segmentLength <= numbers.length) {
            formatted += numbers.slice(startIndex, startIndex + segmentLength);
            startIndex += segmentLength;
            
            if (startIndex < numbers.length) {
              formatted += '-';
            }
          }
        }
        
        return formatted;
      }
    }
    
    // 기본 포맷팅 (은행을 특정할 수 없는 경우)
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 8)}-${numbers.slice(8)}`;
  };

  const formatKeyword = (fieldType: string, keyword: string, selectedBank?: any) => {
    if (fieldType === 'H') {
      return formatPhoneNumber(keyword);
    } else if (fieldType === 'A') {
      return formatAccountNumber(keyword, selectedBank);
    }
    return keyword; // 이메일은 포맷팅하지 않음
  };

  // 메시지 띄어쓰기 자동 수정 및 HTML 태그 제거
  const formatMessage = (message: string) => {
    // HTML 태그 제거
    let cleanMessage = message.replace(/<[^>]*>/g, '');
    
    // Invalid number! 오류 메시지 처리
    if (cleanMessage.includes('Invalid number!')) {
      return '입력하신 정보가 올바르지 않습니다. 다시 입력해 주세요.';
    }
    
    // 띄어쓰기 수정
    cleanMessage = cleanMessage
      .replace(/사기민원/g, '사기 민원이')
      .replace(/3건이상/g, '3건 이상')
      .replace(/이상있습니다/g, '이상 있습니다')
      .replace(/이 있습니다\./g, '이 있습니다.')
      .replace(/이 없습니다\./g, '이 없습니다.')
      .replace(/3건 이상 이 있습니다/g, '3건 이상 있습니다');
    
    return cleanMessage;
  };

  // Invalid number! 오류인지 확인하는 함수
  const isInvalidNumberError = (message: string) => {
    return message.includes('Invalid number!');
  };

  const getStatusIcon = () => {
    if (result.isError || isInvalidNumberError(result.message)) {
      return <Info className="w-8 h-8 text-orange-600" />;
    } else if (result.isSafe) {
      return <CheckCircle className="w-8 h-8 text-green-600" />;
    } else {
      return <AlertTriangle className="w-8 h-8 text-red-600" />;
    }
  };

  const getStatusColor = () => {
    if (result.isError || isInvalidNumberError(result.message)) {
      return 'bg-orange-50';
    }
    return result.isSafe ? 'bg-green-50' : 'bg-red-50';
  };

  const getStatusText = () => {
    if (result.isError || isInvalidNumberError(result.message)) {
      return <span className="text-orange-600">입력 오류</span>;
    }
    return result.isSafe ? '안전합니다' : '주의가 필요합니다';
  };

  const getStatusBadgeColor = () => {
    if (result.isError || isInvalidNumberError(result.message)) {
      return 'bg-orange-100 text-orange-800';
    }
    return result.isSafe 
      ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800' 
      : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800';
  };

  return (
    <div className="space-y-4">


      {/* 결과 상태 섹션 */}
      <Card className={`w-full ${getStatusColor()} border-0 shadow-none rounded-2xl`}>
        <CardHeader className="pb-3 shadow-none">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className={result.isSafe ? 'text-green-700' : 'text-red-700'}>
                {getStatusText()}
              </span>
            </div>
            
            {/* 상태 배지 */}
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              getStatusBadgeColor()
            }`}>
              {result.isError || isInvalidNumberError(result.message) ? '오류' : (result.isSafe ? '안전' : '위험')}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">



        {/* 결과 메시지 - API 응답 메시지와 신고 건수 포함 */}
        <div className={`rounded-2xl p-3 ${
          result.isError || isInvalidNumberError(result.message)
            ? 'bg-orange-50'
            : result.isSafe
              ? 'bg-gradient-to-r from-emerald-50 to-green-50'
              : 'bg-gradient-to-r from-red-50 to-pink-50'
        }`}>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <div className={`p-1.5 rounded-2xl ${
                result.isError || isInvalidNumberError(result.message)
                  ? 'bg-orange-100' 
                  : result.isSafe
                    ? 'bg-emerald-100'
                    : 'bg-red-100'
              }`}>
                <Info className={`w-4 h-4 ${
                  result.isError 
                    ? 'text-orange-600' 
                    : result.isSafe
                      ? 'text-emerald-600'
                      : 'text-red-600'
                }`} />
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">
                {formatMessage(result.message)}
              </div>
            </div>
            
            {/* 신고 건수 - 결과 메시지 안에 작게 표시 */}
            {result.reportCount !== undefined && result.reportCount > 0 && (
              <div className="text-center">
                <span className="text-xs text-red-600 font-medium">
                  최근 3개월 내 신고 건수: {result.reportCount}건
                </span>
              </div>
            )}
          </div>
        </div>
        </CardContent>
      </Card>
    </div>
  );
}
