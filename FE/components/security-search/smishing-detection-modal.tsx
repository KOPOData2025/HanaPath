'use client';

import { useState } from 'react';

// 커스텀 애니메이션 스타일
const pulseScaleAnimation = `
  @keyframes pulse-scale {
    0%, 100% {
      transform: scale(1);
      opacity: 0.7;
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
  }
  @keyframes spin-smooth {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  @keyframes pulse-size {
    0%, 100% {
      width: 24px;
      height: 24px;
    }
    50% {
      width: 32px;
      height: 32px;
    }
  }
`;

// 스타일 태그 추가
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = pulseScaleAnimation;
  if (!document.head.querySelector('style[data-pulse-scale]')) {
    style.setAttribute('data-pulse-scale', 'true');
    document.head.appendChild(style);
  }
}
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { DialogContentNoClose } from '@/components/ui/dialog-no-close';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Bot, AlertTriangle, CheckCircle, RotateCw, Info, Shield, ArrowLeft, ChevronLeft } from 'lucide-react';
import { detectSmishing, SmishingDetectionResponse } from '@/lib/api/smishing-detection';

interface SmishingDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoBack: () => void;
}

// DetectionResult 인터페이스는 SmishingDetectionResponse로 대체

export function SmishingDetectionModal({ isOpen, onClose, onGoBack }: SmishingDetectionModalProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SmishingDetectionResponse | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const handleAnalyze = async () => {
    if (!message.trim()) return;

    console.log('분석 시작 - isLoading:', isLoading);
    setIsLoading(true);
    setHasAnalyzed(true);
    console.log('분석 시작 후 - isLoading:', true);
    
    try {
      // 로딩 시간
      const [result] = await Promise.all([
        detectSmishing(message),
        new Promise(resolve => setTimeout(resolve, 5000))
      ]);
      console.log('🔍 분석 결과 수신:', result);
      console.log('🎯 isSmishing 값:', result.isSmishing);
      console.log('📊 confidence 값:', result.confidence);
      setResult(result);
    } catch (error) {
      console.error('분석 오류:', error);
      setResult({
        isSmishing: false,
        confidence: 0,
        reasons: ['분석 중 오류가 발생했습니다'],
        suggestions: ['잠시 후 다시 시도해주세요'],
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
      });
    } finally {
      console.log('분석 완료 - isLoading:', false);
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setResult(null);
    setHasAnalyzed(false);
    onClose();
  };

  const handleNewAnalysis = () => {
    setMessage('');
    setResult(null);
    setHasAnalyzed(false);
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
              <Bot className="w-6 h-6 text-green-600" />
              AI 스미싱 탐지
            </h2>
          </div>
        </DialogHeader>

        <div className="space-y-4 p-6">
          {/* 메시지 입력 폼 */}
          {!hasAnalyzed && !isLoading && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  의심스러운 문자 메시지를 입력해주세요
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  메시지 붙여넣기 시, 민감한 개인정보가 포함되지 않도록 유의하세요.
                </p>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="스미싱 여부를 확인하고 싶은 문자 메시지를 붙여 넣어주세요."
                  className="min-h-[120px] resize-none rounded-2xl"
                />
              </div>
              
              <Button
                onClick={handleAnalyze}
                disabled={!message.trim() || isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-2xl"
              >
                {isLoading ? (
                  <>
                    <RotateCw className="w-4 h-4 mr-2 animate-spin" />
                    <span className="flex items-center">
                      분석 중
                      <span className="ml-1 flex space-x-1">
                        <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 mr-0.5" />
                    스미싱 여부 분석하기
                  </>
                )}
              </Button>
            </div>
          )}

          {/* 로딩 화면 */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              {/* 스미싱 이미지와 스피너 */}
              <div className="relative mb-4 flex items-center justify-center">
                {/* 중앙 이미지 */}
                <img 
                  src="/smishing.png" 
                  alt="스미싱 분석 중" 
                  className="w-56 h-56 object-contain z-10"
                />
                
                {/* 외부 스피너 - 이미지 가장자리에서 돌아감 */}
                <div 
                  className="absolute w-56 h-56"
                  style={{
                    animation: 'spin-smooth 4s linear infinite'
                  }}
                >
                    {Array.from({ length: 12 }, (_, i) => {
                      const angle = i * 30;
                      const x = Math.cos((angle - 90) * Math.PI / 180) * 150;
                      const y = Math.sin((angle - 90) * Math.PI / 180) * 150;
                      
                      // 각 점마다 다른 색상
                      const colors = [
                        '#ef4444', '#f97316', '#f59e0b', '#eab308',
                        '#84cc16', '#22c55e', '#10b981', '#14b8a6',
                        '#06b6d4', '#0ea5e9', '#3b82f6', '#8b5cf6'
                      ];
                      const color = colors[i];
                      
                      return (
                          <div
                            key={i}
                            className="absolute"
                            style={{
                              left: `calc(50% + ${x}px)`,
                              top: `calc(50% + ${y}px)`,
                              transform: 'translate(-50%, -50%)',
                            }}
                          >
                          <div
                            className="rounded-full"
                            style={{
                              width: '24px',
                              height: '24px',
                              background: color,
                              opacity: 0.9,
                              animation: 'pulse-size 1.5s ease-in-out infinite, spin-smooth 3s linear infinite',
                              animationDelay: `${i * 0.15}s`,
                              boxShadow: `0 0 8px ${color}30`,
                            }}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
              
              {/* 텍스트와 점들 */}
              <div className="flex items-center gap-2 mt-16">
                <span className="text-lg font-medium text-gray-700">AI가 분석 중입니다</span>
                <div className="flex space-x-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}

          {/* 분석 결과 */}
          {hasAnalyzed && result && !isLoading && (() => {
            console.log('결과 렌더링 - isSmishing:', result.isSmishing, '타입:', typeof result.isSmishing);
            return (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
              {/* 결과 요약 */}
              <div className={`p-6 rounded-2xl border-2 ${
                result.isSmishing 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-green-50 border-green-200'
              }`}>
                <div className="flex flex-col items-center justify-center text-center space-y-2">
                  {result.isSmishing ? (
                    <AlertTriangle className="w-10 h-10 text-red-600" />
                  ) : (
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  )}
                  <h3 className={`text-lg font-bold ${
                    result.isSmishing ? 'text-red-800' : 'text-green-800'
                  }`}>
                    {result.isSmishing ? '스미싱 위험이 높아요' : '스미싱이 아닐 가능성이 높아요'}
                  </h3>
                </div>
                
                {/* AI 모델 정확도 한계 경고 */}
                <div className="mt-2">
                  <p className={`text-xs text-center leading-relaxed ${
                    result.isSmishing ? 'text-red-600' : 'text-green-600'
                  }`}>
                    이 결과는 AI 모델의 예측으로, <span className="font-semibold">100% 정확하지 않을 수 있습니다</span>. 
                  </p>
                </div>
              </div>

              {/* 분석 이유 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  분석 이유
                </h4>
                <ul className="space-y-2 pl-8">
                  {result.reasons.map((reason, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 권장사항 */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  권장사항
                </h4>
                <ul className="space-y-2 pl-8">
                  {result.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 새 분석 버튼 */}
              <div className="flex justify-end w-full">
                <Button
                  onClick={handleNewAnalysis}
                  className="bg-green-50 text-green-700 hover:bg-green-100 transition-all duration-200 font-medium rounded-2xl border-0 shadow-none"
                >
                  <RotateCw className="w-4 h-4 mr-2" />
                  다시 분석하기
                </Button>
              </div>
            </div>
            );
          })()}

          {/* 안내 메시지 */}
          <div className="bg-gray-50 p-4 rounded-2xl">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>AI 스미싱 탐지</strong></p>
                <p>AI가 문자 메시지를 분석하여 스미싱 여부를 판단합니다.</p>
                <p>개인정보는 저장되지 않으며, 분석 목적으로만 사용됩니다.</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContentNoClose>
    </Dialog>
  );
}
