"use client"

import {useEffect, useRef, useState} from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Check, User, Mail, Phone, Shield, Eye, EyeOff, Sparkles, Star, Gift, Clover } from "lucide-react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import Link from "next/link"
import { cn, formatPhoneNumber } from "@/lib/utils"
import { HanaLogo } from "@/components/hana-logo"

import { signup, checkEmailDuplicate, checkPhoneDuplicate } from "@/lib/api/user"
import { sendEmailAuthCode, verifyEmailAuthCode, resendEmailAuthCode } from "@/lib/api/email"
import { sendPhoneAuthCode, verifyPhoneAuthCode, resendPhoneAuthCode } from "@/lib/api/phone"
import { TermsOfService } from "@/components/signup/terms-of-service"
import { PrivacyPolicy } from "@/components/signup/privacy-policy"

const totalSteps = 5

const stepVariants = {
  initial: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.8,
  }),
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.8,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    },
  }),
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
}

const floatingAnimation = {
  animate: {
    y: [-10, 10, -10],
    rotate: [0, 5, 0, -5, 0],
    transition: {
      duration: 6,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut" as const,
    },
  },
}

const sparkleAnimation = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
      duration: 2,
      repeat: Number.POSITIVE_INFINITY,
      ease: "easeInOut" as const,
    },
  },
}

export default function SignUpPage() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    userType: "",
    name: "",
    nationalIdFront: "",       // 앞 6자리 (YYMMDD)
    nationalIdBackFirst: "",   // 뒷 1자리 (성별 코드)
    email: "",
    password: "",
    passwordConfirm: "",       // 비밀번호 재입력
    phone: "",
    authCode: "",
    terms: false,
    terms1: false,       
    terms2: false,       
    termsAll: false   
  })

  const handleNext = () => {
    // 각 단계별 검증
    if (step === 1) {
      // 기본 정보 검증
      if (!formData.userType || !formData.name || formData.nationalIdFront.length !== 6 || formData.nationalIdBackFirst.length !== 1) {
        return;
      }
    } else if (step === 2) {
      // 이메일 인증 검증
      console.log("2단계 검증 - isEmailValid:", isEmailValid, "isEmailAuthValid:", isEmailAuthValid);
      if (!isEmailValid || !isEmailAuthValid) {
        console.log("2단계 검증 실패 - 다음 버튼 비활성화");
        return;
      }
      console.log("2단계 검증 성공 - 다음 단계로 진행");
    } else if (step === 3) {
      // 비밀번호 검증
      if (!formData.password || !passwordFormatValid || !isPasswordValid) {
        return;
      }
    } else if (step === 4) {
      // 본인 인증 검증 (휴대폰 번호 + 인증 완료 체크)
      if (!formData.phone || formData.phone.length !== 11 || !isPhoneAuthValid) {
        return;
      }
    }

    setDirection(1)
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handlePrev = () => {
    setDirection(-1)
    if (step > 1) {
      setStep(step - 1)
    }
  }

  // const handleComplete = async () => {
  //   setIsLoading(true)
  //   await new Promise((resolve) => setTimeout(resolve, 2000))
  //   // 회원가입 완료 후 로직
  //   setIsLoading(false)
  // }

  // handleComplete (signup 호출 + 모달)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [typedText, setTypedText] = useState("");
  const successDialogRef = useRef<HTMLDivElement | null>(null);

  const handleComplete = async () => {
    console.log("handleComplete 함수 시작");
    setIsLoading(true);
    try {
      console.log("폼 데이터 검증 시작");
      const userTypeUpper = formData.userType ? (formData.userType.toUpperCase() as "TEEN" | "PARENT") : null;
      const phoneDigits = (formData.phone || "").replace(/[^0-9]/g, "").slice(0, 11);
      const nidFrontDigits = (formData.nationalIdFront || "").replace(/[^0-9]/g, "").slice(0, 6);
      const nidBackFirstDigits = (formData.nationalIdBackFirst || "").replace(/[^0-9]/g, "").slice(0, 1);

      console.log("검증할 데이터:", {
        userTypeUpper,
        name: formData.name,
        nidFrontDigits,
        nidBackFirstDigits,
        phoneDigits,
        email: formData.email,
        terms: formData.terms
      });

      if (!userTypeUpper || (userTypeUpper !== "TEEN" && userTypeUpper !== "PARENT")) {
        throw new Error("사용자 유형을 선택해주세요.");
      }
      if (!formData.name?.trim()) {
        throw new Error("이름을 입력해주세요.");
      }
      if (nidFrontDigits.length !== 6) {
        throw new Error("주민등록번호 앞자리를 6자리로 입력해주세요.");
      }
      if (nidBackFirstDigits.length !== 1) {
        throw new Error("주민등록번호 뒷자리 첫 자리를 입력해주세요.");
      }
      if (!/^[0-9]{11}$/.test(phoneDigits)) {
        throw new Error("휴대폰 번호를 11자리 숫자로 입력해주세요.");
      }
      if (!isValidEmailFormat(formData.email)) {
        throw new Error("올바른 이메일 형식이 아닙니다.");
      }

      console.log("폼 데이터 검증 완료, 회원가입 API 호출 시작");
      await signup({
        userType: userTypeUpper,
        name: formData.name.trim(),
        nationalIdFront: nidFrontDigits,
        nationalIdBackFirst: nidBackFirstDigits,
        email: formData.email,
        password: formData.password,
        phone: phoneDigits,
        termsAgreed: formData.terms,
      });
      
      console.log("회원가입 API 호출 성공, 성공 모달 열기");
      setIsSuccessModalOpen(true);
      console.log("isSuccessModalOpen 상태를 true로 설정 완료");
      
    } catch (err: any) {
      console.error("회원가입 중 에러 발생:", err);
      const message = err?.response?.data?.message || err?.message || "에러가 발생했습니다.";
      setErrorMessage(`${message}`);
      setIsErrorModalOpen(true);
    } finally {
      console.log("handleComplete 함수 완료, 로딩 상태 해제");
      setIsLoading(false);
    }
  };

  const isValidEmailFormat = (email: string) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // 비밀번호 형식 검증 함수
  const validatePasswordFormat = (password: string) => {
    if (!password) return { isValid: false, message: "" };
    
    if (password.length < 8) {
      return { isValid: false, message: "영문, 숫자, 특수문자 포함 8자리 이상이어야 합니다." };
    }
    
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasLetter || !hasNumber || !hasSpecial) {
      return { isValid: false, message: "영문, 숫자, 특수문자 포함 8자리 이상이어야 합니다." };
    }
    
    return { isValid: true, message: "" };
  };

  // 비밀번호 강도 체크 함수
  const checkPasswordStrength = (password: string): "weak" | "medium" | "strong" => {
    if (!password) return "weak";
    
    let score = 0;
    
    // 길이 체크
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // 문자 종류 체크
    if (/[a-z]/.test(password)) score += 1; // 소문자
    if (/[A-Z]/.test(password)) score += 1; // 대문자
    if (/[0-9]/.test(password)) score += 1; // 숫자
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1; // 특수문자
    
    // 연속된 문자나 반복 문자 체크 (점수 감소)
    if (/(.)\1{2,}/.test(password)) score -= 1; // 3개 이상 연속 반복
    if (/123|abc|qwe|asd|zxc/i.test(password)) score -= 1; // 연속된 패턴
    
    if (score <= 2) return "weak";
    if (score <= 3) return "medium";
    return "strong";
  };

  // 이메일 인증번호 발송
  const handleSendEmailAuth = async () => {
    if (!formData.email || !isValidEmailFormat(formData.email)) {
      setEmailAuthMessage("올바른 이메일을 입력해주세요.");
      setIsEmailAuthValid(false);
      return;
    }

    if (!isEmailValid) {
      setEmailAuthMessage("사용 가능한 이메일인지 확인해주세요.");
      setIsEmailAuthValid(false);
      return;
    }

    setIsEmailSending(true);
    
    try {
      console.log("이메일 인증번호 발송 요청:", formData.email);
      
      const response = await sendEmailAuthCode(formData.email);
      
      if (response.success) {
        console.log("이메일 발송 성공:", response);
        
        // 테스트 이메일인 경우 콘솔에 인증번호 표시
        if (response.isTestEmail) {
          console.log("테스트 이메일 감지 - 콘솔에서 인증번호를 확인하세요");
        }
        
        // 발송 완료 처리
        setTimeout(() => {
          setIsEmailAuthSent(true);
          setEmailAuthTimer(300); 
          setIsEmailSending(false);
          setIsEmailSent(true);
        }, 2000);
      } else {
        throw new Error(response.message || "이메일 발송에 실패했습니다.");
      }
      
    } catch (error: any) {
      console.error("이메일 발송 실패:", error);
      setEmailAuthMessage(error.message || "인증번호 발송에 실패했습니다.");
      setIsEmailAuthValid(false);
      setIsEmailSending(false);
    }
  };

  // 이메일 인증번호 확인 (직접 호출용)
  const verifyEmailAuthCodeDirectly = async (code: string) => {
    console.log("직접 인증번호 확인 시작 - 코드:", code, "길이:", code.length);
    
    if (code.length !== 6) {
      console.log("인증번호 길이 부족:", code.length);
      setEmailAuthMessage("인증번호 6자리를 모두 입력해주세요.");
      setIsEmailAuthValid(false);
      return;
    }

    // 제한 시간 체크
    if (emailAuthTimer <= 0) {
      console.log("인증 시간 만료");
      setEmailAuthMessage("인증 시간이 만료되었습니다. 인증번호를 재발송해주세요.");
      setIsEmailAuthValid(false);
      setEmailAuthCode(["", "", "", "", "", ""]);
      return;
    }

    try {
      console.log("인증번호 확인 요청:", formData.email, code);
      
      const response = await verifyEmailAuthCode(formData.email, code);
      console.log("인증번호 확인 API 응답:", response);
      
      if (response.success && response.verified) {
        console.log("이메일 인증 성공:", response);
        setEmailAuthMessage("이메일 인증이 완료되었습니다.");
        setIsEmailAuthValid(true);
        setEmailAuthTimer(0);
        console.log("isEmailAuthValid가 true로 설정됨");
      } else {
        console.log("인증 실패 - success:", response.success, "verified:", response.verified);
        setEmailAuthMessage("인증번호가 올바르지 않습니다. 다시 입력해주세요.");
        setIsEmailAuthValid(false);
        // 인증 실패 시 입력 필드 초기화
        setEmailAuthCode(["", "", "", "", "", ""]);
        // 첫 번째 입력 필드에 포커스
        setTimeout(() => {
          const firstInput = document.getElementById("auth-code-0");
          firstInput?.focus();
        }, 100);
        console.log("인증 실패로 인해 다음 버튼 비활성화 및 입력 필드 초기화");
        return;
      }
    } catch (error: any) {
      console.error("인증번호 확인 실패:", error);
      setEmailAuthMessage(error.message || "인증번호가 올바르지 않습니다.");
      setIsEmailAuthValid(false);
      // 인증 실패 시 입력 필드 초기화
      setEmailAuthCode(["", "", "", "", "", ""]);
      // 첫 번째 입력 필드에 포커스
      setTimeout(() => {
        const firstInput = document.getElementById("auth-code-0");
        firstInput?.focus();
      }, 100);
      console.log("인증 실패로 인해 다음 버튼 비활성화 및 입력 필드 초기화");
    }
  };

  // 이메일 인증번호 확인 (기존 함수 유지)
  const handleVerifyEmailAuth = async () => {
    const code = emailAuthCode.join("");
    console.log("인증번호 확인 시작 - 입력된 코드:", code, "길이:", code.length);
    
    if (code.length !== 6) {
      console.log("인증번호 길이 부족:", code.length);
      setEmailAuthMessage("인증번호 6자리를 모두 입력해주세요.");
      setIsEmailAuthValid(false);
      return;
    }

    try {
      console.log("인증번호 확인 요청:", formData.email, code);
      
      const response = await verifyEmailAuthCode(formData.email, code);
      console.log("인증번호 확인 API 응답:", response);
      
      if (response.success && response.verified) {
        console.log("이메일 인증 성공:", response);
        setEmailAuthMessage("이메일 인증이 완료되었습니다.");
        setIsEmailAuthValid(true);
        setEmailAuthTimer(0);
        console.log("isEmailAuthValid가 true로 설정됨");
      } else {
        console.log("인증 실패 - success:", response.success, "verified:", response.verified);
        throw new Error(response.message || "인증번호가 올바르지 않습니다.");
      }
    } catch (error: any) {
      console.error("인증번호 확인 실패:", error);
      setEmailAuthMessage(error.message || "인증번호가 올바르지 않습니다.");
      setIsEmailAuthValid(false);
    }
  };

  // 인증번호 입력 처리
  const handleAuthCodeChange = (index: number, value: string) => {
    if (value.length > 1) return; // 한 글자만 입력 가능
    
    // 이미 인증이 완료된 경우 입력 무시
    if (isEmailAuthValid === true) {
      return;
    }
    
    const newCode = [...emailAuthCode];
    newCode[index] = value;
    setEmailAuthCode(newCode);
    
    // 메시지 초기화
    if (emailAuthMessage) {
      setEmailAuthMessage("");
    }
    
    // 다음 박스로 자동 이동
    if (value && index < 5) {
      const nextInput = document.getElementById(`auth-code-${index + 1}`);
      nextInput?.focus();
    }
    
    // 6자리 모두 입력되면 자동으로 인증번호 검증
    if (newCode.every(digit => digit !== "")) {
      console.log("6자리 입력 완료 - 자동 인증번호 검증 시작, 코드:", newCode.join(""));
      setTimeout(() => {
        // newCode를 직접 사용하여 검증
        const code = newCode.join("");
        console.log("자동 검증 - 코드:", code, "길이:", code.length);
        
        if (code.length === 6) {
          // 직접 검증 로직 실행
          verifyEmailAuthCodeDirectly(code);
        }
      }, 100);
    }
  };

  // 백스페이스 처리
  const handleAuthCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !emailAuthCode[index] && index > 0) {
      const prevInput = document.getElementById(`auth-code-${index - 1}`);
      prevInput?.focus();
    }
  };

  // 인증번호 재발송
  const handleResendAuthCode = async () => {
    if (emailAuthTimer > 0) return;
    
    try {
      console.log("인증번호 재발송 요청:", formData.email);
      
      const response = await resendEmailAuthCode(formData.email);
      
      if (response.success) {
        console.log("인증번호 재발송 성공:", response);
        
        // 테스트 이메일인 경우 콘솔에 인증번호 표시
        if (response.isTestEmail) {
          console.log("테스트 이메일 재발송 - 콘솔에서 인증번호를 확인하세요");
        }
        
        setEmailAuthCode(["", "", "", "", "", ""]);
        setEmailAuthTimer(300); 
        setEmailAuthMessage("인증번호가 재발송되었습니다.");
        setIsEmailAuthValid(null);
      } else {
        throw new Error(response.message || "인증번호 재발송에 실패했습니다.");
      }
    } catch (error: any) {
      console.error("인증번호 재발송 실패:", error);
      setEmailAuthMessage(error.message || "인증번호 재발송에 실패했습니다.");
      setIsEmailAuthValid(false);
    }
  };

  // 휴대폰 인증번호 발송
  const handleSendPhoneAuth = async () => {
    if (!isPhoneValid || isPhoneSending || isPhoneSent) return;
    
    setIsPhoneSending(true);
    try {
      const response = await sendPhoneAuthCode(formData.phone);
      
      if (response.success) {
        setIsPhoneSending(false);
        setIsPhoneSent(true);
        setIsPhoneAuthSent(true);
        setPhoneAuthTimer(300); 
        setPhoneAuthMessage("인증번호가 발송되었습니다.");
      } else {
        throw new Error(response.message || "인증번호 발송에 실패했습니다.");
      }
    } catch (error) {
      console.error("휴대폰 인증번호 발송 오류:", error);
      setPhoneAuthMessage("인증번호 발송 중 오류가 발생했습니다.");
      setIsPhoneSending(false);
    }
  };

  // 휴대폰 인증번호 재발송
  const handleResendPhoneAuthCode = async () => {
    if (phoneAuthTimer > 0) return;
    
    try {
      const response = await resendPhoneAuthCode(formData.phone);
      
      if (response.success) {
        setPhoneAuthTimer(300); // 5분
        setPhoneAuthMessage("인증번호가 재발송되었습니다.");
        setPhoneAuthCode(["", "", "", "", "", ""]);
        setIsPhoneAuthValid(null);
      } else {
        throw new Error(response.message || "인증번호 재발송에 실패했습니다.");
      }
    } catch (error) {
      console.error("휴대폰 인증번호 재발송 오류:", error);
      setPhoneAuthMessage("인증번호 재발송 중 오류가 발생했습니다.");
    }
  };

  // 휴대폰 인증번호 입력 처리
  const handlePhoneAuthCodeChange = (index: number, value: string) => {
    // 숫자만 허용
    if (!/^\d*$/.test(value)) return;
    
    // 이미 인증이 완료된 경우 입력 무시
    if (isPhoneAuthValid === true) {
      return;
    }
    
    const newCode = [...phoneAuthCode];
    newCode[index] = value;
    setPhoneAuthCode(newCode);
    
    // 다음 입력 필드로 포커스 이동
    if (value && index < 5) {
      const nextInput = document.getElementById(`phone-auth-code-${index + 1}`);
      nextInput?.focus();
    }
    
    // 6자리 모두 입력되면 자동 인증
    if (newCode.every(digit => digit !== "") && newCode.join("").length === 6) {
      handlePhoneAuthVerification(newCode.join(""));
    }
  };

  // 휴대폰 인증번호 키보드 이벤트 처리
  const handlePhoneAuthCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !phoneAuthCode[index] && index > 0) {
      const prevInput = document.getElementById(`phone-auth-code-${index - 1}`);
      prevInput?.focus();
    }
  };

  // 휴대폰 인증번호 검증
  const handlePhoneAuthVerification = async (code: string) => {
    try {
      // 휴대폰 인증번호 검증 API 호출
      const response = await verifyPhoneAuthCode(formData.phone, code);
      
      if (response.success && response.verified) {
        setIsPhoneAuthValid(true);
        setPhoneAuthTimer(0);
        setPhoneAuthMessage("인증이 완료되었습니다.");
      } else {
        setIsPhoneAuthValid(false);
        setPhoneAuthMessage("인증번호가 올바르지 않습니다.");
      }
    } catch (error) {
      console.error("휴대폰 인증 오류:", error);
      setIsPhoneAuthValid(false);
      setPhoneAuthMessage("인증 중 오류가 발생했습니다.");
    }
  };

  // 2. 이메일 / 전화번호 중복 체크 상태 추가
  const [emailMessage, setEmailMessage] = useState("");
  const [isEmailValid, setIsEmailValid] = useState<boolean | null>(null);
  const [phoneMessage, setPhoneMessage] = useState("");
  const [isPhoneValid, setIsPhoneValid] = useState<boolean | null>(null);
  
  // 이메일 인증 관련 상태
  const [isEmailAuthSent, setIsEmailAuthSent] = useState(false);
  const [emailAuthMessage, setEmailAuthMessage] = useState("");
  const [isEmailAuthValid, setIsEmailAuthValid] = useState<boolean | null>(null);
  const [emailAuthTimer, setEmailAuthTimer] = useState(0);
  const [emailAuthCode, setEmailAuthCode] = useState(["", "", "", "", "", ""]);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  
  // 휴대폰 인증 관련 상태
  const [isPhoneAuthSent, setIsPhoneAuthSent] = useState(false);
  const [phoneAuthMessage, setPhoneAuthMessage] = useState("");
  const [isPhoneAuthValid, setIsPhoneAuthValid] = useState<boolean | null>(null);
  const [phoneAuthTimer, setPhoneAuthTimer] = useState(0);
  const [phoneAuthCode, setPhoneAuthCode] = useState(["", "", "", "", "", ""]);
  const [isPhoneSending, setIsPhoneSending] = useState(false);
  const [isPhoneSent, setIsPhoneSent] = useState(false);
  
  // 비밀번호 확인 관련 상태
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isPasswordValid, setIsPasswordValid] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<"weak" | "medium" | "strong" | null>(null);
  const [passwordFormatValid, setPasswordFormatValid] = useState<boolean | null>(null);

  // 3. 이메일 중복 자동 확인 useEffect 추가
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (!formData.email) {
        setEmailMessage("");
        setIsEmailValid(null);
        return;
      }

      if (!isValidEmailFormat(formData.email)) {
        setEmailMessage("올바른 이메일 형식이 아닙니다.");
        setIsEmailValid(false);
        return;
      }

      try {
        console.log("이메일 중복 체크 시작:", formData.email);
        const isDuplicate = await checkEmailDuplicate(formData.email);
        console.log("이메일 중복 체크 결과:", isDuplicate);
        
        if (isDuplicate) {
          setEmailMessage("이미 사용 중인 이메일입니다.");
          setIsEmailValid(false);
        } else {
          setEmailMessage("사용 가능한 이메일입니다.");
          setIsEmailValid(true);
        }
      } catch (error) {
        console.error("이메일 중복 체크 실패:", error);
        setEmailMessage("이메일 확인에 실패했습니다.");
        setIsEmailValid(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [formData.email]);


  // 5. 개별 체크박스 변경 시 전체 동의 상태 자동 갱신
  useEffect(() => {
    const allChecked = formData.terms1 && formData.terms2;
    if (formData.termsAll !== allChecked) {
      setFormData((prev) => ({ ...prev, termsAll: allChecked, terms: allChecked }));
    }
  }, [formData.terms1, formData.terms2]);

  // 이메일 인증 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (emailAuthTimer > 0) {
      interval = setInterval(() => {
        setEmailAuthTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [emailAuthTimer]);

  // 휴대폰 인증 타이머
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (phoneAuthTimer > 0) {
      interval = setInterval(() => {
        setPhoneAuthTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [phoneAuthTimer]);

  // 휴대폰 번호 유효성 검사
  useEffect(() => {
    if (!formData.phone) {
      setIsPhoneValid(null);
      setPhoneMessage("");
      return;
    }

    const phoneRegex = /^010[0-9]{8}$/;
    if (phoneRegex.test(formData.phone)) {
      setIsPhoneValid(true);
      setPhoneMessage("사용 가능한 휴대폰 번호입니다.");
    } else {
      setIsPhoneValid(false);
      setPhoneMessage("올바른 휴대폰 번호 형식이 아닙니다.");
    }
  }, [formData.phone]);

  // 휴대폰 인증 타이머 만료 처리
  useEffect(() => {
    if (phoneAuthTimer <= 0 && phoneAuthTimer !== 0) {
      setPhoneAuthMessage("인증 시간이 만료되었습니다. 인증번호를 재발송해주세요.");
      setIsPhoneAuthValid(false);
    }
  }, [phoneAuthTimer]);

  // 비밀번호 형식 및 강도 검증
  useEffect(() => {
    if (!formData.password) {
      setPasswordFormatValid(null);
      setPasswordStrength(null);
      return;
    }

    const formatCheck = validatePasswordFormat(formData.password);
    setPasswordFormatValid(formatCheck.isValid);
    setPasswordStrength(checkPasswordStrength(formData.password));
  }, [formData.password]);

  // 비밀번호 확인 검증
  useEffect(() => {
    if (!formData.passwordConfirm) {
      setPasswordMessage("");
      setIsPasswordValid(null);
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setPasswordMessage("비밀번호가 일치하지 않습니다.");
      setIsPasswordValid(false);
    } else {
      setPasswordMessage("비밀번호가 일치합니다.");
      setIsPasswordValid(true);
    }
  }, [formData.password, formData.passwordConfirm]);

  // 성공 모달 열릴 때 메시지 세팅 + 컨페티
  useEffect(() => {
    console.log("컨페티 useEffect 실행됨, isSuccessModalOpen:", isSuccessModalOpen);
    
    if (!isSuccessModalOpen) {
      console.log("모달이 닫혀있어서 컨페티 실행 안함");
      setTypedText("");
      return;
    }

    console.log("모달이 열려있어서 컨페티 실행 시작");
    const message = "가입 축하 하나머니 5,000P 적립 완료\n로그인하여 HanaPath를 시작해보세요!";
    setTypedText(message);

    // 축하 컨페티 (동적 import로 클라이언트에서만 로드)
    (async () => {
      try {
        console.log("canvas-confetti 모듈 import 시작");
        const confetti = (await import("canvas-confetti")).default;
        console.log("canvas-confetti 모듈 import 성공:", typeof confetti);

        let originX = 0.5;
        let originY = 0.98; // 화면 맨 아래쪽
        console.log("초기 origin 설정:", { originX, originY });
        
        if (successDialogRef.current) {
          console.log("successDialogRef.current 존재함");
          const rect = successDialogRef.current.getBoundingClientRect();
          console.log("모달 rect 정보:", rect);
          originX = (rect.left + rect.width / 2) / window.innerWidth;
          originY = (rect.top + rect.height * 1.5) / window.innerHeight; // 모달 훨씬 아래쪽에서 터지도록 조정
          console.log("계산된 origin:", { originX, originY });
        } else {
          console.log("successDialogRef.current가 null입니다");
        }

        console.log("첫 번째 컨페티 실행 시작");
        // 첫 번째 컨페티 (메인) - 중앙에서 폭발
        const result1 = confetti({
          particleCount: 150,
          spread: 65,
          startVelocity: 36,
          ticks: 220,
          gravity: 0.1,
          scalar: 0.9,
          origin: { x: originX, y: originY },
          colors: ["#009178", "#004E42", "#80e3d1", "#ffffff"],
        });
        console.log("첫 번째 컨페티 실행 완료:", result1);

        // 두 번째 컨페티 (약간 지연) - 좌우에서 폭발
        setTimeout(() => {
          console.log("두 번째 컨페티 실행 시작 (좌우)");
          // 왼쪽에서
          const result2 = confetti({
            particleCount: 75,
            spread: 45,
            startVelocity: 30,
            ticks: 200,
            gravity: 0.1,
            scalar: 0.8,
            origin: { x: originX - 0.1, y: originY },
            colors: ["#009178", "#004E42", "#80e3d1", "#ffffff"],
          });
          console.log("왼쪽 컨페티 실행 완료:", result2);
          
          // 오른쪽에서
          const result3 = confetti({
            particleCount: 75,
            spread: 45,
            startVelocity: 30,
            ticks: 200,
            gravity: 0.1,
            scalar: 0.8,
            origin: { x: originX + 0.1, y: originY },
            colors: ["#009178", "#004E42", "#80e3d1", "#ffffff"],
          });
          console.log("오른쪽 컨페티 실행 완료:", result3);
        }, 300);

        // 세 번째 컨페티 (마지막) - 상단에서 떨어지는 효과
        // setTimeout(() => {
        //   console.log("세 번째 컨페티 실행 시작 (상단)");
        //   const result4 = confetti({
        //     particleCount: 150,
        //     spread: 80,
        //     startVelocity: 25,
        //     ticks: 180,
        //     gravity: 0.3,
        //     scalar: 0.7,
        //     origin: { x: originX, y: originY - 0.2 },
        //     colors: ["#009178", "#004E42", "#80e3d1", "#ffffff"],
        //   });
        //   console.log("세 번째 컨페티 실행 완료:", result4);
        // }, 600);

        console.log("모든 컨페티 스케줄링 완료");

      } catch (e) {
        console.error("컨페티 실행 중 에러 발생:", e);
        console.error("에러 상세:", {
          message: e instanceof Error ? e.message : String(e),
          stack: e instanceof Error ? e.stack : undefined,
          name: e instanceof Error ? e.name : undefined
        });
      }
    })();

    return () => {
      console.log("컨페티 useEffect cleanup 실행");
    };
  }, [isSuccessModalOpen]);

  const progressValue = (step / totalSteps) * 100

  const stepTitles = [
    "기본 정보를 입력해주세요",
    "이메일 인증을 진행해주세요",
    "비밀번호를 설정해주세요",
    "본인 인증을 진행해주세요",
    "약관에 동의해주세요",
  ]

  const stepIcons = [User, Mail, Shield, Phone, Shield]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div
        animate={{
          y: [-10, 10, -10],
          rotate: [0, 5, 0, -5, 0],
        }}
        transition={{
          duration: 6,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-[#009178]/20 to-transparent rounded-full blur-xl"
      />
      <motion.div
        animate={{
          y: [10, -10, 10],
          rotate: [360, 180, 0],
        }}
        transition={{
          duration: 6,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 1,
        }}
        className="absolute bottom-20 right-20 w-60 h-60 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute bottom-1/3 left-1/4"
      >
        <Star className="w-4 h-4 text-blue-400/40" />
      </motion.div>

      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Side - Branding & Progress */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hidden lg:block space-y-8"
        >
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <HanaLogo size={40} />
              <span className="text-3xl font-black text-[#057D69]">HanaPath</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-4xl xl:text-5xl font-bold text-gray-800 leading-tight"
            >
              금융의 첫걸음을
              <br />
              <span className="text-[#009178] relative">
                함께 시작해요
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  className="absolute top-3 -right-6"
                >
                  <Clover className="w-6 h-6 text-[#009178]/60" />
                </motion.div>
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-xl text-gray-600 leading-relaxed"
            >
              HanaPath와 함께 스마트한 금융 생활을 시작하세요.
            </motion.p>
          </div>

          {/* Step Progress Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-semibold text-gray-700">가입 진행 상황</h3>
            <div className="space-y-3">
              {stepTitles.map((title, index) => {
                const StepIcon = stepIcons[index]
                const isActive = step === index + 1
                const isCompleted = step > index + 1

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 1 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <motion.div
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 1, repeat: isActive ? Number.POSITIVE_INFINITY : 0 }}
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300",
                        isCompleted
                          ? "bg-[#009178] text-white shadow-lg"
                          : isActive
                            ? "bg-[#009178] text-white shadow-lg"
                            : "bg-gray-200 text-gray-400",
                      )}
                    >
                      {isCompleted ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          <Check className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <StepIcon className="w-4 h-4" />
                      )}
                    </motion.div>
                    <span
                      className={cn(
                        "text-sm transition-colors duration-300",
                        isActive ? "text-[#009178] font-medium" : isCompleted ? "text-gray-600" : "text-gray-400",
                      )}
                    >
                      {title}
                    </span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Enhanced Decorative Elements */}
          <div className="relative">
            <motion.div
              animate={{ y: [-10, 10, -10], rotate: [0, 180, 360] }}
              transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" as const }}
              className="absolute top-0 right-20 w-20 h-20 bg-gradient-to-br from-[#009178]/20 to-transparent rounded-full"
            />
            <motion.div
              animate={{ y: [10, -10, 10], rotate: [360, 180, 0] }}
              transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" as const, delay: 1 }}
              className="absolute top-32 right-0 w-16 h-16 bg-gradient-to-br from-teal-400/25 to-transparent rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" as const, delay: 2 }}
              className="absolute top-16 right-32 w-12 h-12 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full"
            />
          </div>
        </motion.div>

        {/* Right Side - Signup Form */}
        <motion.div initial="initial" animate="animate" variants={fadeInUp} className="w-full max-w-md mx-auto lg:mx-0">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/30 relative overflow-hidden"
          >
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-[#009178]/5 pointer-events-none" />

            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-6 relative z-10">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center justify-center gap-2 mb-4"
              >
                <HanaLogo size={32} />
                <span className="text-2xl font-bold text-[#004E42]">HanaPath</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-2xl font-bold text-gray-800"
              >
                회원가입
              </motion.h2>
            </div>

            {/* Enhanced Progress Bar */}
            <div className="mb-8 relative z-10">
              <div className="flex justify-between items-center mb-3 text-sm text-gray-500">
                <span>Step {step}</span>
                <span>
                  {step} / {totalSteps}
                </span>
              </div>
              <div className="relative">
                <Progress
                  value={progressValue}
                  className="w-full h-3 [&>*]:bg-[#009178]"
                />
              </div>
            </div>

            {/* Form Steps */}
            <div className="relative h-96 overflow-visible">
              <AnimatePresence initial={false} custom={direction}>
                {step === 1 && (
                    <motion.div
                        key={1}
                        custom={direction}
                        variants={stepVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="absolute w-full space-y-6"
                    >
                      {/* 전체 섹션 타이틀 */}
                      <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                          className="text-center mb-4"
                      >
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="w-14 h-14 bg-[#009178] rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg"
                        >
                          <User className="w-6 h-6 text-white" />
                        </motion.div>
                        <h2 className="text-lg font-semibold text-gray-800">기본 정보</h2>
                      </motion.div>

                      {/* 사용자 유형 선택 + 이름 + 주민번호 묶음 */}
                      <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          className="space-y-4"
                      >
                        {/* 사용자 유형 */}
                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-gray-700">사용자 유형</Label>
                          <div className="flex gap-3">
                            <button
                                type="button"
                                className={cn(
                                    "w-full py-1 rounded-xl border-[1.5px] transition-all duration-300 flex flex-col items-center justify-center gap-1 text-sm",
                                    formData.userType === "teen"
                                        ? "border-[#009178] bg-[#009178]/10 text-[#009178] font-semibold shadow-sm"
                                        : "border-gray-200 text-gray-600 hover:border-[#009178]/40 hover:bg-[#009178]/5 hover:text-[#009178]"
                                )}
                                onClick={() => setFormData({ ...formData, userType: "teen" })}
                            >
                              <User className="w-4 h-4" />
                              청소년
                            </button>
                            <button
                                type="button"
                                className={cn(
                                    "w-full py-1 rounded-xl border-[1.5px] transition-all duration-300 flex flex-col items-center justify-center gap-1 text-sm",
                                    formData.userType === "parent"
                                        ? "border-[#009178] bg-[#009178]/10 text-[#009178] font-semibold shadow-sm"
                                        : "border-gray-200 text-gray-600 hover:border-[#009178]/40 hover:bg-[#009178]/5 hover:text-[#009178]"
                                )}
                                onClick={() => setFormData({ ...formData, userType: "parent" })}
                            >
                              <Shield className="w-4 h-4" />
                              부모님
                            </button>
                          </div>
                        </div>

                        {/* 이름 입력 */}
                        <div className="space-y-1">
                          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                            이름
                          </Label>
                          <Input
                              id="name"
                              placeholder="하나"
                              className="h-11 border-gray-200 focus:border-[#009178] focus:ring-[#009178] rounded-xl transition-all duration-300 hover:border-[#009178]/50"
                              value={formData.name}
                              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>

                        {/* 주민등록번호 */}
                        <div className="space-y-1">
                          <Label htmlFor="nationalIdFront" className="text-sm font-medium text-gray-700">
                            주민등록번호
                          </Label>
                          <div className="flex items-center gap-2 w-full">
                            {/* 앞 6자리 */}
                            <Input
                                id="nationalIdFront"
                                placeholder="YYMMDD"
                                maxLength={6}
                                className="flex-[3] h-11 text-center border-gray-200 focus:border-[#009178] focus:ring-[#009178] rounded-xl transition-all duration-300 hover:border-[#009178]/50"
                                value={formData.nationalIdFront}
                                onChange={(e) => setFormData({ ...formData, nationalIdFront: e.target.value })}
                            />

                            {/* 하이픈 */}
                            <span className="text-gray-400 text-lg">-</span>

                            {/* 뒷자리 1자리 + 점 */}
                            <div className="flex items-center gap-2 flex-[3]">
                              <Input
                                  id="nationalIdBackFirst"
                                  placeholder="●"
                                  maxLength={1}
                                  className="w-full h-11 text-center border-gray-200 focus:border-[#009178] focus:ring-[#009178] rounded-xl transition-all duration-300 hover:border-[#009178]/50"
                                  value={formData.nationalIdBackFirst}
                                  onChange={(e) => setFormData({ ...formData, nationalIdBackFirst: e.target.value })}
                              />
                              <div className="flex gap-[5px]">
                                {Array(6)
                                    .fill(0)
                                    .map((_, i) => (
                                        <div key={i} className="w-2 h-2 bg-gray-400 rounded-full opacity-40" />
                                    ))}
                              </div>
                            </div>
                          </div>
                        </div>

                      </motion.div>
                    </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key={2}
                    custom={direction}
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute w-full space-y-6"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="text-center mb-6"
                    >
                      <motion.div
                        whileHover={{ scale: 1.05, rotate: -5 }}
                        className="w-16 h-16 bg-[#009178] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                      >
                        <Mail className="w-8 h-8 text-white" />
                      </motion.div>
                      <h2 className="text-xl font-semibold text-gray-800">이메일 인증</h2>
                    </motion.div>
                    
                    {/* 이메일 입력 */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        이메일
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="email"
                          type="email"
                          placeholder="hello@hanapath.com"
                          className="flex-1 h-12 border-gray-200 focus:border-[#009178] focus:ring-[#009178] rounded-xl transition-all duration-300 hover:border-[#009178]/50"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (!isEmailValid || isEmailSending || isEmailSent) return;
                            handleSendEmailAuth();
                          }}
                          className={cn(
                            "h-12 px-4 rounded-xl whitespace-nowrap font-medium",
                            "transition-all duration-500 ease-in-out",
                            isEmailSending 
                              ? "bg-[#009178] text-white border-[#009178] shadow-lg hover:bg-[#009178] hover:border-[#009178] hover:text-white" 
                              : isEmailSent 
                                ? "bg-[#009178] text-white border-[#009178] shadow-lg hover:bg-[#009178] hover:border-[#009178] hover:text-white" 
                                : cn(
                                    "border-gray-200 bg-transparent text-gray-700",
                                    "hover:border-[#009178] hover:bg-[#009178] hover:text-white",
                                    "hover:shadow-md hover:shadow-[#009178]/20"
                                  )
                          )}
                        >
                          {isEmailSending ? (
                            <div className="flex items-center justify-center gap-2 w-full">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                              />
                              <span>발송중</span>
                            </div>
                          ) : isEmailSent ? (
                            <div className="flex items-center justify-center w-full">
                              <span>발송완료</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-full">
                              <span>인증번호 발송</span>
                            </div>
                          )}
                        </Button>
                      </div>
                      <p className={cn("text-sm mt-1", isEmailValid ? "text-green-500" : "text-red-500")}>{emailMessage}</p>
                    </motion.div>

                    {/* 이메일 인증번호 입력 */}
                    {isEmailAuthSent && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="space-y-4"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700">인증코드 입력</Label>
                            {isEmailAuthValid ? (
                              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                                인증 완료
                              </span>
                            ) : emailAuthTimer > 0 ? (
                              <span className="text-sm text-red-500 font-hana">
                                {Math.floor(emailAuthTimer / 60)}:{(emailAuthTimer % 60).toString().padStart(2, '0')}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex justify-center gap-2">
                            {emailAuthCode.map((digit, index) => (
                              <motion.input
                                key={index}
                                id={`auth-code-${index}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleAuthCodeChange(index, e.target.value)}
                                onKeyDown={(e) => handleAuthCodeKeyDown(index, e)}
                                disabled={isEmailAuthValid === true || emailAuthTimer <= 0}
                                className={cn(
                                  "w-12 h-12 text-center text-lg font-semibold border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#009178]/20 bg-white",
                                  digit 
                                    ? "border-[#009178] text-[#009178]" 
                                    : "border-gray-200 hover:border-[#009178]/50 focus:border-[#009178]",
                                  (isEmailAuthValid === true || emailAuthTimer <= 0) && "opacity-50 cursor-not-allowed bg-gray-100"
                                )}
                              />
                            ))}
                          </div>
                        </div>

                        {/* 재발송 링크 */}
                        <div className="flex justify-start">
                          <motion.button
                            type="button"
                            onClick={handleResendAuthCode}
                            disabled={emailAuthTimer > 0}
                            className={cn(
                              "text-sm transition-colors",
                              emailAuthTimer > 0 
                                ? "text-gray-400 cursor-not-allowed" 
                                : "text-[#009178] hover:text-[#004E42]"
                            )}
                          >
                            인증코드 재발송
                          </motion.button>
                        </div>

                      </motion.div>
                    )}
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key={3}
                    custom={direction}
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute w-full space-y-6"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="text-center mb-6"
                    >
                      <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        className="w-16 h-16 bg-[#009178] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                      >
                        <Shield className="w-8 h-8 text-white" />
                      </motion.div>
                      <h2 className="text-xl font-semibold text-gray-800">비밀번호 설정</h2>
                    </motion.div>
                    
                    {/* 비밀번호 입력 */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        비밀번호
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="비밀번호를 입력하세요"
                          className={cn(
                            "h-12 pr-10 border-gray-200 focus:border-[#009178] focus:ring-[#009178] rounded-xl transition-all duration-300 hover:border-[#009178]/50",
                            passwordFormatValid === false && "border-red-500 focus:border-red-500 focus:ring-red-500",
                            passwordFormatValid === true && "border-green-500 focus:border-green-500 focus:ring-green-500"
                          )}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                        <motion.button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all origin-center"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5 block" />
                          ) : (
                            <Eye className="w-5 h-5 block" />
                          )}
                        </motion.button>
                      </div>
                      
                      {/* 비밀번호 형식 안내 및 강도 표시 */}
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        {/* 형식 안내 메시지 - 고정 높이로 위치 유지 */}
                        <div className="h-5 flex items-start">
                          {passwordFormatValid === false ? (
                            <p className="text-sm text-red-500">
                              {validatePasswordFormat(formData.password).message}
                            </p>
                          ) : !formData.password ? (
                            <p className="text-sm text-gray-500">
                              영문, 숫자, 특수문자 포함 8자리 이상이어야 합니다.
                            </p>
                          ) : null}
                        </div>
                        
                        {/* 비밀번호 강도 표시 영역 - 동적 높이 */}
                        <motion.div 
                          animate={{ 
                            height: formData.password && passwordStrength ? "auto" : "10px",
                            opacity: formData.password && passwordStrength ? 1 : 0
                          }}
                          transition={{ 
                            duration: 0.6, 
                            ease: [0.4, 0.0, 0.2, 1],
                            height: { duration: 0.5, ease: [0.4, 0.0, 0.2, 1] },
                            opacity: { duration: 0.4, ease: "easeOut" }
                          }}
                          className="overflow-hidden"
                        >
                          {formData.password && passwordStrength && (
                            <motion.div
                              initial={{ opacity: 0, y: -15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ 
                                duration: 0.5, 
                                delay: 0.2,
                                ease: [0.4, 0.0, 0.2, 1]
                              }}
                              className="space-y-2"
                            >
                              
                              {/* 진행률 바 스타일 강도 표시 */}
                              <div className="relative">
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ 
                                      width: passwordStrength === "weak" ? "33%" :
                                             passwordStrength === "medium" ? "66%" : "100%"
                                    }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className={cn(
                                      "h-full rounded-full transition-all duration-500",
                                      passwordStrength === "weak" ? "bg-gradient-to-r from-red-400 to-red-500" :
                                      passwordStrength === "medium" ? "bg-gradient-to-r from-yellow-400 to-yellow-500" :
                                      passwordStrength === "strong" ? "bg-gradient-to-r from-green-400 to-green-500" : "bg-gray-300"
                                    )}
                                  />
                                </div>
                                
                                {/* 강도별 라벨 표시 - 배지 스타일 */}
                                <div className="flex justify-between mt-2 px-2">
                                  {[
                                    { level: "weak", label: "약함" },
                                    { level: "medium", label: "양호" },
                                    { level: "strong", label: "강함" }
                                  ].map((item, index) => (
                                    <motion.div
                                      key={item.level}
                                      animate={{
                                        scale: passwordStrength === item.level ? 1.05 : 1,
                                      }}
                                      transition={{ duration: 0.3 }}
                                      className="flex flex-col items-center gap-1"
                                    >
                                      <span className={cn(
                                        "text-xs font-medium px-2 py-1 rounded-full transition-all duration-300",
                                        passwordStrength === item.level 
                                          ? passwordStrength === "weak" ? "bg-red-100 text-red-600" :
                                            passwordStrength === "medium" ? "bg-yellow-100 text-yellow-600" :
                                            passwordStrength === "strong" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                                          : "text-gray-400"
                                      )}>
                                        {item.label}
                                      </span>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                              
                            </motion.div>
                          )}
                        </motion.div>
                      </motion.div>
                    </motion.div>

                    {/* 비밀번호 재입력 */}
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="space-y-2"
                      style={{ marginTop: '16px' }}
                    >
                      <Label htmlFor="passwordConfirm" className="text-sm font-medium text-gray-700">
                        비밀번호 확인
                      </Label>
                      <Input
                        id="passwordConfirm"
                        type="password"
                        placeholder="비밀번호를 다시 입력하세요"
                        className="h-12 border-gray-200 focus:border-[#009178] focus:ring-[#009178] rounded-xl transition-all duration-300 hover:border-[#009178]/50"
                        value={formData.passwordConfirm}
                        onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                      />
                      <p className={cn("text-sm mt-1", isPasswordValid ? "text-green-500" : "text-red-500")}>
                        {passwordMessage}
                      </p>
                    </motion.div>
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key={4}
                    custom={direction}
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute w-full space-y-6"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="text-center mb-6"
                    >
                      <motion.div
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        className="w-16 h-16 bg-[#009178] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                      >
                        <Phone className="w-8 h-8 text-white" />
                      </motion.div>
                      <h2 className="text-xl font-semibold text-gray-800">본인 인증</h2>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        휴대폰 번호
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="phone"
                          type="tel"
                          inputMode="numeric"
                          placeholder="010-0000-0000"
                          maxLength={13}
                          className="flex-1 h-12 border-gray-200 focus:border-[#009178] focus:ring-[#009178] rounded-xl transition-all duration-300 hover:border-[#009178]/50"
                          value={formatPhoneNumber(formData.phone)}
                          onChange={(e) => {
                            const numbers = e.target.value.replace(/[^0-9]/g, "").slice(0, 11)
                            setFormData({ ...formData, phone: numbers })
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (!isPhoneValid || isPhoneSending || isPhoneSent) return;
                            handleSendPhoneAuth();
                          }}
                          className={cn(
                            "h-12 px-4 rounded-xl whitespace-nowrap font-medium",
                            "transition-all duration-500 ease-in-out",
                            isPhoneSending 
                              ? "bg-[#009178] text-white border-[#009178] shadow-lg hover:bg-[#009178] hover:border-[#009178] hover:text-white" 
                              : isPhoneSent 
                                ? "bg-[#009178] text-white border-[#009178] shadow-lg hover:bg-[#009178] hover:border-[#009178] hover:text-white" 
                                : cn(
                                    "border-gray-200 bg-transparent text-gray-700",
                                    "hover:border-[#009178] hover:bg-[#009178] hover:text-white",
                                    "hover:shadow-md hover:shadow-[#009178]/20"
                                  )
                          )}
                        >
                          {isPhoneSending ? (
                            <div className="flex items-center justify-center gap-2 w-full">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                              />
                              <span>발송중</span>
                            </div>
                          ) : isPhoneSent ? (
                            <div className="flex items-center justify-center w-full">
                              <span>발송완료</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center w-full">
                              <span>인증번호 발송</span>
                            </div>
                          )}
                        </Button>
                      </div>
                      <p className={cn("text-sm mt-1", isPhoneValid ? "text-green-500" : "text-red-500")}>{phoneMessage}</p>
                    </motion.div>
                    {/* 휴대폰 인증번호 입력 */}
                    {isPhoneAuthSent && (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="space-y-4"
                      >
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700">인증코드 입력</Label>
                            {isPhoneAuthValid ? (
                              <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                                인증 완료
                              </span>
                            ) : phoneAuthTimer > 0 ? (
                              <span className="text-sm text-red-500 font-hana">
                                {Math.floor(phoneAuthTimer / 60)}:{(phoneAuthTimer % 60).toString().padStart(2, '0')}
                              </span>
                            ) : null}
                          </div>
                          <div className="flex justify-center gap-2">
                            {phoneAuthCode.map((digit, index) => (
                              <motion.input
                                key={index}
                                id={`phone-auth-code-${index}`}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handlePhoneAuthCodeChange(index, e.target.value)}
                                onKeyDown={(e) => handlePhoneAuthCodeKeyDown(index, e)}
                                disabled={isPhoneAuthValid === true || phoneAuthTimer <= 0}
                                className={cn(
                                  "w-12 h-12 text-center text-lg font-semibold border-2 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#009178]/20 bg-white",
                                  digit
                                    ? "border-[#009178] text-[#009178]" 
                                    : "border-gray-200 hover:border-[#009178]/50 focus:border-[#009178]",
                                  (isPhoneAuthValid === true || phoneAuthTimer <= 0) && "opacity-50 cursor-not-allowed bg-gray-100"
                                )}
                              />
                            ))}
                          </div>
                          <p className={cn("text-sm text-center", isPhoneAuthValid === true ? "text-green-500" : isPhoneAuthValid === false ? "text-red-500" : "text-gray-500")}>
                            {phoneAuthMessage}
                          </p>

                          {/* 재발송 링크 */}
                          <div className="flex justify-start !mt-0">
                            <motion.button
                              type="button"
                              onClick={handleResendPhoneAuthCode}
                              disabled={phoneAuthTimer > 0}
                              className={cn(
                                "text-sm transition-colors",
                                phoneAuthTimer > 0 
                                  ? "text-gray-400 cursor-not-allowed" 
                                  : "text-[#009178] hover:text-[#004E42]"
                              )}
                            >
                              인증코드 재발송
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div
                    key={5}
                    custom={direction}
                    variants={stepVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="absolute w-full space-y-6"
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      className="text-center mb-6"
                    >
                      <motion.div
                        whileHover={{ scale: 1.05, rotate: -5 }}
                        className="w-16 h-16 bg-[#009178] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                      >
                        <Shield className="w-8 h-8 text-white" />
                      </motion.div>
                      <h2 className="text-xl font-semibold text-gray-800">약관 동의</h2>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                      className="space-y-4 pt-4 border-t border-gray-100"
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                            id="terms-all"
                            className="border-gray-300 data-[state=checked]:bg-[#009178] data-[state=checked]:border-[#009178]"
                            checked={formData.termsAll}
                            onCheckedChange={(checked) => {
                              const value = Boolean(checked);
                              setFormData((prev) => ({
                                ...prev,
                                termsAll: value,
                                terms1: value,
                                terms2: value,
                              }));
                            }}
                        />
                        <Label htmlFor="terms-all" className="font-semibold text-base text-gray-800">
                          전체 동의
                        </Label>
                      </div>
                      <div className="pl-4 space-y-3 text-sm">
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.4 }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="terms-1"
                              className="border-gray-300 data-[state=checked]:bg-[#009178] data-[state=checked]:border-[#009178]"
                              checked={formData.terms1}
                              onCheckedChange={(checked) => {
                                const value = Boolean(checked);
                                setFormData((prev) => ({ ...prev, terms1: value }));
                              }}
                            />
                            <Label htmlFor="terms-1" className="text-gray-700">
                              이용약관 동의 (필수)
                            </Label>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => setIsModalOpen(true)}
                            className="text-xs text-[#009178] hover:text-[#004E42] underline font-medium transition-colors"
                          >
                            보기
                          </motion.button>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.5 }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="terms-2"
                              className="border-gray-300 data-[state=checked]:bg-[#009178] data-[state=checked]:border-[#009178]"
                              checked={formData.terms2}
                              onCheckedChange={(checked) => {
                                const value = Boolean(checked);
                                setFormData((prev) => ({ ...prev, terms2: value }));
                              }}
                            />
                            <Label htmlFor="terms-2" className="text-gray-700">
                              개인정보 수집 및 이용 동의 (필수)
                            </Label>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            onClick={() => setIsPrivacyModalOpen(true)}
                            className="text-xs text-[#009178] hover:text-[#004E42] underline font-medium transition-colors"
                          >
                            보기
                          </motion.button>
                        </motion.div>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Enhanced Navigation Buttons */}
            <div className="mt-8 flex justify-between relative z-10">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="ghost"
                  onClick={handlePrev}
                  disabled={step === 1}
                  className="h-12 px-6 rounded-xl hover:bg-gray-100 transition-all duration-300"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> 이전
                </Button>
              </motion.div>
              {step < totalSteps ? (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleNext}
                      disabled={(() => {
                        const isDisabled = 
                          (step === 1 && (!formData.userType || !formData.name || formData.nationalIdFront.length !== 6 || formData.nationalIdBackFirst.length !== 1)) ||
                          (step === 2 && (!isEmailValid || !isEmailAuthValid)) ||
                          (step === 3 && (!formData.password || !passwordFormatValid || !isPasswordValid)) ||
                          (step === 4 && (!formData.phone || formData.phone.length !== 11 || !isPhoneAuthValid));
                        
                        if (step === 2) {
                          console.log("다음 버튼 상태 체크 - isEmailValid:", isEmailValid, "isEmailAuthValid:", isEmailAuthValid, "disabled:", isDisabled);
                        }
                        
                        return isDisabled;
                      })()}
                      className={cn(
                        "h-12 px-6 bg-[#009178] hover:bg-[#007A65] rounded-xl group shadow-lg hover:shadow-xl transition-all duration-300",
                        (step === 1 && (!formData.userType || !formData.name || formData.nationalIdFront.length !== 6 || formData.nationalIdBackFirst.length !== 1)) ||
                        (step === 2 && (!isEmailValid || !isEmailAuthValid)) ||
                        (step === 3 && (!formData.password || !passwordFormatValid || !isPasswordValid)) ||
                        (step === 4 && (!formData.phone || formData.phone.length !== 11 || !isPhoneAuthValid))
                          ? "opacity-50 cursor-not-allowed" : ""
                      )}
                    >
                      다음 <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </motion.div>
              ) : (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    onClick={handleComplete}
                    disabled={isLoading}
                    className={cn(
                      "h-12 px-6 bg-[#009178] hover:bg-[#004E42] rounded-xl group shadow-lg hover:shadow-xl transition-all duration-300",
                      isLoading && "opacity-70 cursor-not-allowed",
                    )}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        />
                        가입 중...
                      </div>
                    ) : (
                      <>
                        가입 완료 <Check className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </div>

            {/* Login Link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="mt-6 text-center relative z-10"
            >
              <p className="text-gray-600">
                이미 계정이 있으신가요?{" "}
                <Link href="/login" className="text-[#009178] hover:text-[#004E42] font-semibold transition-colors">
                  로그인
                </Link>
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Enhanced Terms Modal */}
      <AlertDialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">이용약관</AlertDialogTitle>
            <AlertDialogDescription>이용약관 내용입니다. 스크롤하여 전체 내용을 확인해주세요.</AlertDialogDescription>
          </AlertDialogHeader>
          <TermsOfService />
          <AlertDialogFooter>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => setIsModalOpen(false)}
                className="bg-[#009178] hover:bg-[#004E42] rounded-xl transition-all duration-300"
              >
                확인
              </Button>
            </motion.div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 개인정보 수집 및 이용 동의 모달 */}
      <AlertDialog open={isPrivacyModalOpen} onOpenChange={setIsPrivacyModalOpen}>
        <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">개인정보 수집 및 이용 동의</AlertDialogTitle>
            <AlertDialogDescription>개인정보 수집 및 이용에 대한 내용입니다. 스크롤하여 전체 내용을 확인해주세요.</AlertDialogDescription>
          </AlertDialogHeader>
          <PrivacyPolicy />
          <AlertDialogFooter>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => setIsPrivacyModalOpen(false)}
                className="bg-[#009178] hover:bg-[#004E42] rounded-xl transition-all duration-300"
              >
                확인
              </Button>
            </motion.div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 기존 회원가입 섹션 끝나는 부분 바로 위에 추가 */}
      <AlertDialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <AlertDialogContent ref={successDialogRef} className="max-w-md text-center p-3 sm:p-5">
          <AlertDialogHeader className="space-y-3 sm:space-y-5">
            <AlertDialogTitle className="text-xl font-bold text-[#009178]">회원가입 완료</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              <span className="inline-block text-center">
                {typedText.split("\n").map((line, lineIdx) => (
                  <span key={`line-${lineIdx}`} className="inline-block">
                    {Array.from(line).filter((ch) => ch !== "🎁").map((ch, idx) => (
                      <span key={`ch-${lineIdx}-${idx}`} className="inline-block">
                        {ch === " " ? "\u00A0" : ch}
                      </span>
                    ))}
                    {lineIdx === 0 && (
                      <span key={`gift-${lineIdx}`} className="inline-block ml-0 align-[-0.1em]">
                        <Gift className="w-5 h-5 text-[#009178]" />
                      </span>
                    )}
                    {lineIdx < typedText.split("\n").length - 1 && <br key={`br-${lineIdx}`} />}
                  </span>
                ))}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-1">
            <Link href="/login">
              <Button className="w-full bg-[#009178] text-white hover:bg-[#007c64] transition-all">
                로그인하러 가기
              </Button>
            </Link>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 축하 이미지를 별도로 모달 외부에 배치 */}
      {isSuccessModalOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, x: 20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1, type: "spring", stiffness: 200 }}
          className="fixed top-[32%] right-[33%] translate-x-32 -translate-y-1/2 z-[60] hidden sm:block pointer-events-none"
        >
          <motion.div
            animate={{ 
              y: [-5, 5, -5],
              rotate: [0, 2, 0, -2, 0]
            }}
            transition={{ 
              duration: 3, 
              repeat: Number.POSITIVE_INFINITY, 
              ease: "easeInOut" 
            }}
            className="relative"
          >
            <img 
              src="/congrats.png" 
              alt="축하 이미지" 
              className="w-44 h-44 object-contain"
            />
          </motion.div>
        </motion.div>
      )}

      {/* 회원가입 실패 모달 */}
      <AlertDialog open={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
        <AlertDialogContent className="max-w-md text-center space-y-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-red-600">회원가입 실패</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage || "에러가 발생했습니다."}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              onClick={() => setIsErrorModalOpen(false)}
              className="w-full bg-red-600 text-white hover:bg-red-700 transition-all"
            >
              확인
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )

}
