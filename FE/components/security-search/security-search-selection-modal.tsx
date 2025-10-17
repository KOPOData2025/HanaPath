'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, Bot, AlertTriangle, Info, BotMessageSquare, X } from 'lucide-react';

interface SecuritySearchSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSecuritySearch: () => void;
  onSelectSmishingDetection: () => void;
}

export function SecuritySearchSelectionModal({ 
  isOpen, 
  onClose, 
  onSelectSecuritySearch, 
  onSelectSmishingDetection 
}: SecuritySearchSelectionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md !rounded-[32px] border-0 shadow-2xl overflow-hidden [&>button]:hidden">
        <DialogHeader className="relative pb-4 border-b border-gray-100 bg-white shrink-0 sticky top-0 z-10 !rounded-t-[32px]">
          <div className="absolute right-1 top-0 z-10">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogTitle className="text-center text-xl font-bold text-gray-700 flex items-center justify-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            보안 검색 서비스
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 p-6">
          {/* 인터넷 사기피해 신고여부 확인 옵션 */}
          <Button
            onClick={onSelectSecuritySearch}
            className="w-full h-22 p-5 flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-2 border-blue-200 hover:border-blue-300 transition-all duration-200 rounded-2xl"
          >
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
              <AlertTriangle className="text-blue-600" style={{ width: '32px', height: '32px' }} />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-800">인터넷 사기피해 신고여부 확인</div>
              <div className="text-sm text-gray-600">전화번호, 계좌번호, 이메일 조회</div>
            </div>
          </Button>

          {/* AI 스미싱 탐지 옵션 */}
          <Button
            onClick={onSelectSmishingDetection}
            className="w-full h-22 p-5 flex items-center gap-4 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 border-2 border-green-200 hover:border-green-300 transition-all duration-200 rounded-2xl"
          >
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
              <BotMessageSquare className="text-green-600" style={{ width: '32px', height: '32px' }} />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-800">AI 스미싱 탐지</div>
              <div className="text-sm text-gray-600">문자 메시지 스미싱 여부 확인</div>
            </div>
          </Button>
        </div>

        {/* 안내 메시지 */}
        <div className="bg-gray-50 p-4 rounded-2xl">
          <div className="flex items-center justify-center gap-2">
            <Info className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <p className="text-xs text-gray-600">
              원하는 보안 서비스를 선택해 주세요.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

