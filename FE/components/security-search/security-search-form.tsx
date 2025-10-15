'use client';

import { useState, useEffect } from 'react';
import { SearchFieldType, SearchFieldOption } from '@/types/security-search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Phone, CreditCard, Mail, Check } from 'lucide-react';

const searchFieldOptions: SearchFieldOption[] = [
  {
    value: 'H',
    label: '전화번호',
    placeholder: '010-1234-5678',
    icon: 'phone',
    description: '',
  },
  {
    value: 'A',
    label: '계좌번호',
    placeholder: '123-456789-01-234',
    icon: 'credit-card',
    description: '',
  },
  {
    value: 'E',
    label: '이메일',
    placeholder: 'example@email.com',
    icon: 'mail',
    description: '',
  },
];

// 은행별 계좌번호 포맷 정보
const bankOptions = [
  { id: 'nh', name: 'NH농협은행', logo: '/bank-logos/nh.png', format: [3, 4, 4, 2], length: 13 },
  { id: 'kakao', name: '카카오뱅크', logo: '/bank-logos/kakao.png', format: [4, 2, 7], length: 13 },
  { id: 'kb', name: 'KB국민은행', logo: '/bank-logos/kb.png', format: [6, 2, 6], length: 14 },
  { id: 'toss', name: '토스뱅크', logo: '/bank-logos/toss.png', format: [3, 6, 5], length: 14 },
  { id: 'sh', name: '신한은행', logo: '/bank-logos/sh.png', format: [3, 2, 6], length: 11 },
  { id: 'woori', name: '우리은행', logo: '/bank-logos/woori.png', format: [4, 3, 6], length: 13 },
  { id: 'hana', name: '하나은행', logo: '/bank-logos/hana.png', format: [3, 6, 5], length: 14 },
  { id: 'post', name: '우체국', logo: '/bank-logos/post.png', format: [6, 2, 6], length: 14 },
  { id: 'kbank', name: '케이뱅크', logo: '/bank-logos/kbank.png', format: [3, 3, 6], length: 12 },
];

interface SecuritySearchFormProps {
  onSearch: (fieldType: SearchFieldType, keyword: string, selectedBank?: any) => void;
  isLoading: boolean;
  resetForm?: boolean; // 폼 초기화를 위한 prop
}

export function SecuritySearchForm({ onSearch, isLoading, resetForm }: SecuritySearchFormProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [fieldType, setFieldType] = useState<SearchFieldType>('H');
  const [keyword, setKeyword] = useState('');
  const [selectedBank, setSelectedBank] = useState<string>('hana'); // 기본값: 하나은행

  // resetForm prop이 true일 때 폼 초기화
  useEffect(() => {
    if (resetForm) {
      console.log('폼 초기화 실행');
      setCurrentStep(1);
      setFieldType('H');
      setSelectedBank('hana');
      setKeyword('');
    }
  }, [resetForm]);

  // fieldType이 변경될 때마다 keyword 초기화
  useEffect(() => {
    console.log('fieldType 변경됨:', fieldType);
    setKeyword('');
  }, [fieldType]);

  // selectedBank가 변경될 때마다 keyword 초기화
  useEffect(() => {
    console.log('selectedBank 변경됨:', selectedBank);
    setKeyword('');
  }, [selectedBank]);

  // 단계 이동 함수들
  const goToNextStep = () => {
    if (currentStep === 1) {
      if (fieldType === 'A') {
        setCurrentStep(2); // 계좌번호 선택 시 은행 선택 단계로
      } else {
        setCurrentStep(3); // 전화번호/이메일 선택 시 바로 검색어 입력 단계로
      }
    } else if (currentStep === 2) {
      setCurrentStep(3); // 은행 선택 후 검색어 입력 단계로
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1); // 은행 선택에서 검색 유형 선택으로
    } else if (currentStep === 3) {
      if (fieldType === 'A') {
        setCurrentStep(2); // 계좌번호: 검색어 입력에서 은행 선택으로
      } else {
        setCurrentStep(1); // 전화번호/이메일: 검색어 입력에서 검색 유형 선택으로
      }
    }
  };

  const resetToFirstStep = () => {
    setCurrentStep(1);
    setFieldType('H');
    setSelectedBank('kb');
    setKeyword('');
  };

  // 전화번호 자동 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 계좌번호 자동 포맷팅 (은행별) - 실시간으로 은행 포맷에 맞게 하이픈 자동 추가
  const formatAccountNumber = (value: string) => {
    // 하이픈 제거하고 숫자만 추출
    const numbers = value.replace(/[^\d]/g, '');
    const bank = bankOptions.find(b => b.id === selectedBank);
    
    if (!bank) {
      console.log('은행을 찾을 수 없음:', selectedBank);
      return numbers; // 숫자만 반환
    }
    
    console.log('은행 정보:', bank);
    console.log('숫자:', numbers);
    console.log('포맷:', bank.format);
    console.log('최대 길이:', bank.length);
    
    // 은행별 최대 길이 제한 (입력 필드에서 이미 제한되므로 여기서는 로그만)
    if (numbers.length > bank.length) {
      console.log('최대 길이 초과됨:', numbers.length, '>', bank.length);
      // 입력 필드에서 이미 제한되므로 여기서는 자르지 않음
    }
    
    // 실시간으로 은행 포맷에 맞게 하이픈 자동 추가
    let formatted = '';
    let startIndex = 0;
    
    for (let i = 0; i < bank.format.length; i++) {
      const segmentLength = bank.format[i];
      if (startIndex < numbers.length) {
        // 현재 세그먼트에 들어갈 수 있는 만큼만 추가
        const currentSegment = numbers.slice(startIndex, startIndex + segmentLength);
        formatted += currentSegment;
        startIndex += segmentLength;
        
        // 다음 숫자가 있고, 다음 세그먼트가 있으면 하이픈 추가
        if (startIndex < numbers.length && i < bank.format.length - 1) {
          formatted += '-';
        }
      }
    }
    
    console.log('포맷팅 결과:', formatted || numbers);
    return formatted || numbers;
  };

  // 입력값 변경 시 자동 포맷팅
  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('=== 입력값 변경 ===');
    console.log('원본 입력값:', value);
    console.log('현재 fieldType:', fieldType);
    console.log('선택된 은행:', selectedBank);
    console.log('현재 keyword 상태:', keyword);

    let formattedValue = value;

    try {
      if (fieldType === 'H') {
        formattedValue = formatPhoneNumber(value);
        console.log('전화번호 포맷팅 결과:', formattedValue);
      } else if (fieldType === 'A') {
        formattedValue = formatAccountNumber(value);
        console.log('계좌번호 포맷팅 결과:', formattedValue);
      }
      // 이메일은 포맷팅하지 않음

      console.log('최종 포맷팅된 값:', formattedValue);
      setKeyword(formattedValue);
    } catch (error) {
      console.error('포맷팅 오류:', error);
      setKeyword(value); // 오류 시 원본 값 사용
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      // 하이픈 제거 후 검색 (경찰청 API 요구사항)
      const cleanKeyword = keyword.trim().replace(/-/g, '');
      
      // 선택된 은행 정보 포함하여 전달
      if (fieldType === 'A' && selectedBank) {
        const selectedBankInfo = bankOptions.find(b => b.id === selectedBank);
        onSearch(fieldType, cleanKeyword, selectedBankInfo);
      } else {
        onSearch(fieldType, cleanKeyword);
      }
    }
  };

  const getFieldIcon = (type: SearchFieldType) => {
    const option = searchFieldOptions.find(opt => opt.value === type);
    if (!option) return <Shield className="w-4 h-4" />;
    
    switch (option.icon) {
      case 'phone': return <Phone className="w-4 h-4" />;
      case 'credit-card': return <CreditCard className="w-4 h-4" />;
      case 'mail': return <Mail className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getCurrentPlaceholder = () => {
    if (fieldType === 'A') {
      const bank = bankOptions.find(b => b.id === selectedBank);
      if (bank) {
        // 은행별 계좌번호 형식으로 placeholder 생성
        const format = bank.format.join('-');
        return format.replace(/\d/g, '0'); // 숫자를 0으로 대체
      }
    }
    return searchFieldOptions.find(option => option.value === fieldType)?.placeholder || '';
  };

  // 은행별 계좌번호 placeholder 생성
  const getBankAccountPlaceholder = () => {
    const bank = bankOptions.find(b => b.id === selectedBank);
    if (!bank) return '000-000000-00-000';
    
    // 은행별 실제 계좌번호 형식으로 placeholder 생성
    const segments = bank.format.map(length => '0'.repeat(length));
    return segments.join('-');
  };

  return (
    <Card className="w-full max-w-md rounded-2xl border-0 shadow-lg">
      <CardContent className="pt-6">
        {/* Step 1: 검색 유형 선택 */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in slide-in-from-left-2 duration-300">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">검색 유형</label>
              <div className="grid grid-cols-3 gap-3">
                {searchFieldOptions.map((option) => (
                  <Card
                    key={option.value}
                    className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-2xl ${
                      fieldType === option.value
                        ? 'bg-white text-blue-600 border-2 border-blue-400 shadow-md'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                    onClick={() => setFieldType(option.value)}
                  >
                    <CardContent className="p-2 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`p-1.5 rounded-lg ${
                          fieldType === option.value
                            ? 'bg-blue-100'
                            : 'bg-gray-100'
                        }`}>
                          {getFieldIcon(option.value)}
                        </div>
                        <div className="text-sm font-medium">{option.label}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* 다음 단계 버튼 */}
            <Button 
              type="button"
              onClick={goToNextStep}
              className="w-full bg-blue-600 hover:bg-blue-700 rounded-2xl"
            >
              다음 단계
            </Button>
          </div>
        )}

        {/* Step 2: 은행 선택 (계좌번호일 때만) */}
        {currentStep === 2 && fieldType === 'A' && (
          <div className="space-y-4 animate-in slide-in-from-right-2 duration-300">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">은행 선택</label>
              <div className="grid grid-cols-3 gap-3">
                {bankOptions.map((bank) => (
                  <Card
                    key={bank.id}
                    className={`cursor-pointer transition-all duration-200 hover:scale-105 rounded-2xl ${
                      selectedBank === bank.id
                        ? 'bg-white text-blue-600 border-2 border-blue-400 shadow-md'
                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedBank(bank.id)}
                  >
                    <CardContent className="p-3 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="p-1">
                          <img 
                            src={bank.logo} 
                            alt={bank.name} 
                            className="w-8 h-8 object-contain"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-medium">{bank.name}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                type="button"
                onClick={goToPreviousStep}
                variant="outline"
                className="flex-1 rounded-2xl"
              >
                이전
              </Button>
              <Button 
                type="button"
                onClick={goToNextStep}
                className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-2xl"
              >
                다음 단계
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: 검색어 입력 */}
        {currentStep === 3 && (
          <form onSubmit={handleSubmit} className="space-y-4 animate-in slide-in-from-right-2 duration-300">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                {fieldType === 'H' ? '전화번호' : fieldType === 'A' ? '계좌번호' : '이메일'}
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={keyword}
                  onChange={handleKeywordChange}
                  placeholder={fieldType === 'A' ? getBankAccountPlaceholder() : getCurrentPlaceholder()}
                  className="pl-10"
                  disabled={isLoading}
                  maxLength={fieldType === 'A' ? (() => {
                    const bank = bankOptions.find(b => b.id === selectedBank);
                    return bank ? bank.length + 3 : 20; // 하이픈 3개 추가
                  })() : fieldType === 'H' ? 13 : 50}
                  onKeyDown={(e) => {
                    console.log('키 입력:', e.key, '현재 값:', keyword);
                  }}
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {getFieldIcon(fieldType)}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                type="button"
                onClick={goToPreviousStep}
                variant="outline"
                className="flex-1 rounded-2xl"
              >
                이전
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-2xl"
                disabled={!keyword.trim() || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    확인 중...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    신고여부 확인
                  </div>
                )}
              </Button>
            </div>
          </form>
        )}

        <div className="mt-4 p-4 bg-blue-50 rounded-2xl">
          <p className="text-xs text-blue-700 text-center">
            의심스러운 경우 즉시 신고하시기 바랍니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
