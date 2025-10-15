import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json(
        { error: '메시지가 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    // Spring Boot 백엔드로 요청 전달
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/smishing/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`Spring Boot API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Spring Boot에서 받은 응답:', JSON.stringify(data, null, 2));
    console.log('isSmishing 값:', data.isSmishing, '타입:', typeof data.isSmishing);
    return NextResponse.json(data);

  } catch (error) {
    console.error('스미싱 탐지 API 오류:', error);
    return NextResponse.json(
      {
        isSmishing: false,
        confidence: 0,
        reasons: ['API 호출 중 오류가 발생했습니다'],
        suggestions: ['잠시 후 다시 시도해주세요'],
        error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
      },
      { status: 500 }
    );
  }
}
