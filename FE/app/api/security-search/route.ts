import { NextRequest, NextResponse } from 'next/server';

const CYBERCOP_API_URL = 'https://cybercop.cyber.go.kr/countFraud.do';

export async function POST(request: NextRequest) {
  let body: any = {};
  
  try {
    body = await request.json();
    const { fieldType, keyword, accessType } = body;

    // 입력 검증
    if (!fieldType || !keyword || !accessType) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 경찰청 API 호출
    const response = await fetch(CYBERCOP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: new URLSearchParams({
        fieldType,
        keyword,
        accessType,
      }),
    });

    if (!response.ok) {
      throw new Error(`경찰청 API 오류: ${response.status}`);
    }

    const data = await response.text();
    
    // JSONP 응답 파싱
    let jsonData;
    try {
      // data(...) 형태의 응답에서 JSON 부분만 추출
      const jsonMatch = data.match(/data\((.*)\)/);
      if (jsonMatch) {
        jsonData = JSON.parse(jsonMatch[1]);
      } else {
        jsonData = JSON.parse(data);
      }
    } catch (parseError) {
      console.error('응답 파싱 오류:', parseError);
      jsonData = { message: data };
    }

    // 응답 메시지에서 안전/위험 여부 판단
    const message = jsonData.message || '';
    console.log('경찰청 API 응답 메시지:', message);
    
    // HTML 태그 제거하여 순수 텍스트 추출
    const cleanMessage = message.replace(/<[^>]*>/g, '');
    console.log('HTML 태그 제거된 메시지:', cleanMessage);
    
    // 더 간단하고 정확한 안전/위험 여부 판단
    // "있습니다" = 위험, "없습니다" = 안전
    const hasExists = cleanMessage.includes('있습니다');
    const hasNone = cleanMessage.includes('없습니다');
    const isSafe = hasNone; // "없습니다"가 있으면 안전
    
    console.log('안전 여부 판단 결과:', isSafe);
    
    // 디버깅을 위한 상세 로그
    console.log('순수 텍스트에 "있습니다" 포함 여부:', hasExists);
    console.log('순수 텍스트에 "없습니다" 포함 여부:', hasNone);
    console.log('최종 isSafe 계산:', hasNone);
    
    // 신고 건수 추출
    let reportCount = 0;
    if (hasExists && !hasNone) { // "있습니다"가 있고 "없습니다"가 없으면
      const reportCountMatch = cleanMessage.match(/(\d+)건/);
      reportCount = reportCountMatch ? parseInt(reportCountMatch[1]) : 0;
      console.log('추출된 신고 건수:', reportCount);
    }

    const result = {
      message,
      isSafe,
      reportCount,
      fieldType,
      keyword,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('보안 검색 API 오류:', error);
    
    return NextResponse.json(
      { 
        error: '검색 중 오류가 발생했습니다.',
        message: '검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        isSafe: false,
        fieldType: body?.fieldType || 'H',
        keyword: body?.keyword || '',
      },
      { status: 500 }
    );
  }
}
