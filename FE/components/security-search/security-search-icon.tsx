'use client';

import { useState } from 'react';
import { Shield } from 'lucide-react';
import { SecuritySearchSelectionModal } from './security-search-selection-modal';
import { SecuritySearchModal } from './security-search-modal';
import { SmishingDetectionModal } from './smishing-detection-modal';
import { useAuthStore } from '@/store/auth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useScrollPosition } from '@/hooks/use-scroll-position';

export function SecuritySearchIcon() {
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const [isSecuritySearchModalOpen, setIsSecuritySearchModalOpen] = useState(false);
  const [isSmishingModalOpen, setIsSmishingModalOpen] = useState(false);
  const { isLoggedIn } = useAuthStore();
  const { isFooterVisible, footerHeight } = useScrollPosition();

  const handleOpenSelectionModal = () => {
    setIsSelectionModalOpen(true);
  };

  const handleCloseSelectionModal = () => {
    setIsSelectionModalOpen(false);
  };

  const handleSelectSecuritySearch = () => {
    setIsSelectionModalOpen(false);
    setIsSecuritySearchModalOpen(true);
  };

  const handleSelectSmishingDetection = () => {
    setIsSelectionModalOpen(false);
    setIsSmishingModalOpen(true);
  };

  const handleCloseSecuritySearchModal = () => {
    setIsSecuritySearchModalOpen(false);
  };

  const handleCloseSmishingModal = () => {
    setIsSmishingModalOpen(false);
  };

  const handleGoBackFromSecuritySearch = () => {
    setIsSecuritySearchModalOpen(false);
    setIsSelectionModalOpen(true);
  };

  const handleGoBackFromSmishing = () => {
    setIsSmishingModalOpen(false);
    setIsSelectionModalOpen(true);
  };

  // 로그인하지 않은 경우 버튼을 표시하지 않음
  if (!isLoggedIn) {
    return null;
  }

  return (
    <>
      {/* 보안 검색 버튼 - 좌측 하단 고정 */}
      <div 
        className={cn(
          "fixed left-6 bottom-6 z-50 transition-all duration-500 ease-in-out",
          isFooterVisible 
            ? "opacity-0 scale-95 pointer-events-none" 
            : "opacity-100 scale-100 pointer-events-auto"
        )}
      >
        <Button
          onClick={handleOpenSelectionModal}
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-110",
            "bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900",
            "border-2 border-blue-400"
          )}
        >
          <Shield className="w-6 h-6 text-white" />
        </Button>
      </div>

      {/* 보안 검색 선택 모달 */}
      <SecuritySearchSelectionModal 
        isOpen={isSelectionModalOpen} 
        onClose={handleCloseSelectionModal}
        onSelectSecuritySearch={handleSelectSecuritySearch}
        onSelectSmishingDetection={handleSelectSmishingDetection}
      />

      {/* 인터넷 사기피해 신고여부 확인 모달 */}
      <SecuritySearchModal 
        isOpen={isSecuritySearchModalOpen} 
        onClose={handleCloseSecuritySearchModal}
        onGoBack={handleGoBackFromSecuritySearch}
      />

      {/* AI 스미싱 탐지 모달 */}
      <SmishingDetectionModal 
        isOpen={isSmishingModalOpen} 
        onClose={handleCloseSmishingModal}
        onGoBack={handleGoBackFromSmishing}
      />
    </>
  );
}
