import React from 'react';
import { cn } from '@/lib/utils';

interface VolumeBarProps {
  volume: number;
  maxVolume: number;
  type: 'ask' | 'bid';
  className?: string;
}

export function VolumeBar({ volume, maxVolume, type, className }: VolumeBarProps) {
  // 최댓값 기준으로 비율 계산 (0으로 나누기 방지)
  const volumeRatio = maxVolume > 0 ? volume / maxVolume : 0;
  
  const getBarColor = () => {
    if (type === 'ask') {
      return 'from-blue-200/50 via-blue-300/40 to-blue-400/30';
    } else {
      return 'from-red-200/50 via-red-300/40 to-red-400/30';
    }
  };

  const getBarWidth = () => {
    // 최소 너비 보장 (잔량이 있어도 너무 얇지 않게)
    const minWidth = 0.1; // 10%
    // 최대 너비 제한 (컬럼을 벗어나지 않게)
    const maxWidth = 0.9; // 90% (컬럼 경계 보존)
    
    const calculatedWidth = Math.max(volumeRatio, minWidth);
    return Math.min(calculatedWidth, maxWidth) * 100;
  };

  const getBarStyle = () => {
    const width = getBarWidth();
    
    if (type === 'ask') {
      // 매도호가: 왼쪽에서 시작해서 오른쪽으로 확장
      return {
        width: `${width}%`,
        marginRight: 'auto', // 왼쪽 정렬
        animation: 'volumeBar 0.8s ease-out'
      };
    } else {
      // 매수호가: 오른쪽에서 시작해서 왼쪽으로 확장
      return {
        width: `${width}%`,
        marginLeft: 'auto', // 오른쪽 정렬
        animation: 'volumeBar 0.8s ease-out'
      };
    }
  };

  return (
    <div className={cn("relative h-full", className)}>
      {/* 배경 바 - 잔량에 따른 동적 너비 (컬럼 내에서만) */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-r transition-all duration-700 ease-out rounded-sm",
          getBarColor()
        )}
        style={getBarStyle()}
      />
    </div>
  );
}

export default VolumeBar;
