'use client';

import { useState } from 'react';
import { SearchFieldType } from '@/types/security-search';
import { SecuritySearchForm } from './security-search-form';
import { SecuritySearchResult } from './security-search-result';
import { searchSecurityInfo } from '@/lib/api/security-search';
import { Dialog, DialogHeader } from '@/components/ui/dialog';
import { DialogContentNoClose } from '@/components/ui/dialog-no-close';
import { Button } from '@/components/ui/button';
import { X, Shield, Info, RotateCw, AlertTriangle, ArrowLeft, ChevronLeft } from 'lucide-react';

interface SecuritySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoBack: () => void;
}

export function SecuritySearchModal({ isOpen, onClose, onGoBack }: SecuritySearchModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0); // 폼 초기화를 위한 key

  const handleSearch = async (fieldType: SearchFieldType, keyword: string, selectedBank?: any) => {
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      const result = await searchSecurityInfo({
        fieldType,
        keyword,
        accessType: '3',
      });
      
      // 은행 정보를 결과에 포함
      if (selectedBank) {
        (result as any).selectedBank = selectedBank;
      }
      
      setSearchResult(result);
    } catch (error) {
      console.error('검색 오류:', error);
      setSearchResult({
        message: '검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        isSafe: false,
        fieldType,
        keyword,
        selectedBank,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    console.log('모달 닫기');
    setSearchResult(null);
    setHasSearched(false);
    setFormResetKey(prev => prev + 1); // 폼도 초기화
    onClose();
  };

  const handleNewSearch = () => {
    console.log('새 검색 시작');
    setSearchResult(null);
    setHasSearched(false);
    // 폼 초기화를 위한 상태 추가
    setFormResetKey(prev => prev + 1);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContentNoClose className="max-w-lg max-h-[95vh] overflow-y-auto !rounded-[32px] border-0 shadow-2xl overflow-hidden">
        <DialogHeader className="relative pb-4 border-b border-gray-100 bg-white shrink-0 sticky top-0 z-10 !rounded-t-[32px]">
          <div className="absolute left-3 top-2 z-10">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              onClick={onGoBack}
            >
              <ChevronLeft className="h-5 w-5 mt-0.5" />
            </Button>
          </div>
          <div className="absolute right-3 top-0 z-10">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* 페이지 제목 */}
          <div className="text-center pt-2">
            <h2 className="text-xl font-bold text-gray-700 flex items-center justify-center gap-2">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
              인터넷 사기피해 신고여부 확인
            </h2>
          </div>
        </DialogHeader>

        <div className="space-y-4 p-6">

          {/* 검색 폼 */}
          {!hasSearched && (
            <div className="flex justify-center">
              <SecuritySearchForm 
                key={formResetKey} // key를 변경하여 컴포넌트 재마운트
                onSearch={handleSearch} 
                isLoading={isLoading} 
                resetForm={formResetKey > 0} // resetForm prop 전달
              />
            </div>
          )}

          {/* 검색 결과 */}
          {hasSearched && (
            <div className="space-y-3">
              <SecuritySearchResult result={searchResult} isLoading={isLoading} />
              
              {/* 새 검색 버튼 */}
              <div className="flex justify-end w-full">
                <button
                  onClick={handleNewSearch}
                  className="!bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 font-medium rounded-2xl border-0 border-none outline-none ring-0 focus:ring-0 focus:ring-offset-0 focus:outline-none shadow-none h-10 px-4 py-2 text-sm [&_svg]:size-4 [&_svg]:shrink-0 inline-flex items-center"
                >
                  <RotateCw className="w-6 h-6 mr-2" />
                  다시 확인하기
                </button>
              </div>
            </div>
          )}

          {/* 안내 메시지 */}
          <div className="bg-gray-50 p-4 rounded-2xl w-full">
            {/* 안내 문구 */}
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>인터넷 사기피해 신고여부 확인</strong></p>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>최근 3개월간 경찰청에 3회 이상 신고 접수된 
                    <br/>전화번호, 계좌번호, 이메일을 조회할 수 있습니다.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* 제공 정보 - 회색 박스 밖에 별도로 배치 */}
          <div className="flex justify-end w-full">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
              <span>제공:</span>
              <div className="flex items-center gap-1">
                <img src="/police.svg" alt="경찰청" className="w-5 h-5" />
                <span>경찰청</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContentNoClose>
    </Dialog>
  );
}
