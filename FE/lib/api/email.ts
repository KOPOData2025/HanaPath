// 이메일 인증 관련 API 함수들

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export interface EmailAuthResponse {
  success: boolean;
  message: string;
  result?: string;
  isTestEmail?: boolean;
  verified?: boolean;
}

/**
 * 이메일 인증번호 발송
 */
export const sendEmailAuthCode = async (email: string): Promise<EmailAuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/email/send-auth-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '이메일 발송에 실패했습니다.');
    }

    return data;
  } catch (error) {
    console.error('이메일 발송 오류:', error);
    throw error;
  }
};

/**
 * 인증번호 확인
 */
export const verifyEmailAuthCode = async (email: string, authCode: string): Promise<EmailAuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/email/verify-auth-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, authCode }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '인증번호 확인에 실패했습니다.');
    }

    return data;
  } catch (error) {
    console.error('인증번호 확인 오류:', error);
    throw error;
  }
};

/**
 * 인증번호 재발송
 */
export const resendEmailAuthCode = async (email: string): Promise<EmailAuthResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/email/resend-auth-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || '인증번호 재발송에 실패했습니다.');
    }

    return data;
  } catch (error) {
    console.error('인증번호 재발송 오류:', error);
    throw error;
  }
};
