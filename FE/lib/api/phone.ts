// 휴대폰 인증 관련 API 함수들

export interface PhoneAuthResponse {
  success: boolean;
  message?: string;
  verified?: boolean;
}

// 휴대폰 인증번호 발송
export const sendPhoneAuthCode = async (phone: string): Promise<PhoneAuthResponse> => {
  // 발송 중 상태를 보여주기 위한 지연
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    success: true,
    message: "인증번호가 발송되었습니다."
  };
};

// 휴대폰 인증번호 검증
export const verifyPhoneAuthCode = async (phone: string, code: string): Promise<PhoneAuthResponse> => {
  const testCode = process.env.NEXT_PUBLIC_PHONE_AUTH_TEST_CODE;
  
  if (code === testCode) {
    return {
      success: true,
      verified: true,
      message: "인증이 완료되었습니다."
    };
  } else {
    return {
      success: false,
      verified: false,
      message: "인증번호가 올바르지 않습니다."
    };
  }
};

// 휴대폰 인증번호 재발송
export const resendPhoneAuthCode = async (phone: string): Promise<PhoneAuthResponse> => {
  // 재발송 중 상태를 보여주기 위한 지연
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    message: "인증번호가 재발송되었습니다."
  };
};
