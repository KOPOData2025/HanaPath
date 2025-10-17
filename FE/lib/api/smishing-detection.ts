export interface SmishingDetectionRequest {
  message: string;
}

export interface SmishingDetectionResponse {
  isSmishing: boolean;
  confidence: number;
  reasons: string[];
  suggestions: string[];
  error?: string;
}

export async function detectSmishing(message: string): Promise<SmishingDetectionResponse> {
  try {
    console.log('🔍 스미싱 탐지 API 호출 시작');
    console.log('📝 입력 메시지:', message.substring(0, 50) + '...');
    
    const response = await fetch('/api/smishing/detect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    console.log('📡 API 응답 상태:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: SmishingDetectionResponse = await response.json();
    console.log('✅ 스미싱 탐지 결과 수신:', data);
    console.log('🔍 원시 응답 데이터:', JSON.stringify(data, null, 2));
    console.log('🎯 isSmishing 값:', data.isSmishing, '타입:', typeof data.isSmishing);
    console.log('🎯 결과:', data.isSmishing ? '스미싱 의심' : '정상 메시지');
    console.log('📊 신뢰도:', data.confidence + '%');
    
    return data;
  } catch (error) {
    console.error('❌ 스미싱 탐지 API 호출 오류:', error);
    return {
      isSmishing: false,
      confidence: 0,
      reasons: ['API 호출 중 오류가 발생했습니다'],
      suggestions: ['잠시 후 다시 시도해주세요'],
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    };
  }
}
