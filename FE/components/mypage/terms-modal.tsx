"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, X } from "lucide-react"

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
  type: "service" | "privacy" | "financial"
  accountType: "wallet" | "investment"
}

// 디지털 지갑 서비스 이용약관
const walletServiceTerms = `제1조 (목적)
이 약관은 HanaPath(하나패스)가 제공하는 디지털 지갑 서비스(이하 "서비스")의 이용과 관련하여 HanaPath(이하 "회사")와 이용자(이하 "회원") 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
이 약관에서 사용하는 용어의 정의는 다음과 같습니다.
① "디지털 지갑"이란 회원이 HanaPath 모바일 애플리케이션을 통해 전자적으로 자금을 보관하고, 이를 이용하여 결제, 송금 등을 수행할 수 있는 전자금융서비스를 말합니다.
② "회원"이란 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 자를 말합니다.
③ "전자금융거래"란 전자적 방법으로 회사와 회원 간에 금융상품 및 서비스를 이용하는 거래를 말합니다.

제3조 (서비스의 이용)
① 회원은 회사가 정한 절차에 따라 디지털 지갑을 개설하고, 본인 인증을 완료한 후 서비스를 이용할 수 있습니다.
② 서비스 이용 시 발생하는 수수료는 회사가 정한 바에 따르며, 회원에게 사전 고지됩니다.
③ 서비스 이용 시간은 24시간이며, 시스템 점검 등으로 인한 일시 중단 시에는 사전 공지합니다.

제4조 (회원의 의무)
① 회원은 서비스 이용 시 본인의 계정 정보 및 비밀번호를 안전하게 관리해야 합니다.
② 회원은 서비스 이용과 관련하여 관련 법령 및 회사의 약관을 준수해야 합니다.
③ 회원은 타인의 정보를 도용하거나 허위 정보를 제공해서는 안 됩니다.

제5조 (회사의 의무)
① 회사는 회원의 개인정보를 보호하고, 관련 법령에 따라 관리합니다.
② 회사는 서비스의 안정적인 제공을 위해 노력합니다.
③ 회사는 회원의 거래 내역을 안전하게 보관합니다.

제6조 (책임 제한)
① 회사는 천재지변, 전쟁, 테러, 해킹 등 불가항력적인 사유로 인한 서비스 장애에 대해 책임을 지지 않습니다.
② 회원의 고의 또는 과실로 인한 손해에 대해서는 회사가 책임을 지지 않습니다.
③ 회사는 제3자가 제공하는 정보의 정확성에 대해 보장하지 않습니다.

제7조 (약관의 변경)
① 회사는 필요 시 본 약관을 변경할 수 있으며, 변경된 약관은 HanaPath 홈페이지 또는 모바일 애플리케이션을 통해 공지합니다.
② 회원이 변경된 약관에 동의하지 않는 경우, 서비스 이용을 중단할 수 있습니다.
③ 변경된 약관은 공지 후 7일이 경과한 시점부터 효력을 발생합니다.

제8조 (준거법 및 관할)
① 이 약관은 대한민국 법률에 따라 해석됩니다.
② 서비스 이용과 관련하여 발생한 분쟁에 대해서는 서울중앙지방법원을 전속 관할 법원으로 합니다.

제9조 (기타)
① 이 약관에서 정하지 않은 사항은 전자금융거래법, 개인정보보호법 등 관련 법령에 따릅니다.
② 이 약관은 2024년 1월 1일부터 시행됩니다.`

// 모의 투자 계좌 서비스 이용약관
const investmentServiceTerms = `제1조 (목적)
이 약관은 HanaPath(하나패스)가 제공하는 모의 투자 계좌 서비스(이하 "서비스")의 이용과 관련하여 HanaPath(이하 "회사")와 이용자(이하 "회원") 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
이 약관에서 사용하는 용어의 정의는 다음과 같습니다.
① "모의 투자 계좌"란 회원이 실제 자금을 투자하지 않고 가상의 자금을 이용하여 투자 연습을 할 수 있는 서비스를 말합니다.
② "회원"이란 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 자를 말합니다.
③ "가상 자금"이란 실제 가치가 없는 모의 투자 전용 자금을 말합니다.

제3조 (서비스의 이용)
① 회원은 회사가 정한 절차에 따라 모의 투자 계좌를 개설하고, 본인 인증을 완료한 후 서비스를 이용할 수 있습니다.
② 서비스 이용은 무료이며, 투자 결과는 실제 금융 거래와 무관합니다.
③ 서비스에서 제공되는 시장 데이터는 실제 시장과 동일하지만, 거래는 가상으로 이루어집니다.

제4조 (회원의 의무)
① 회원은 서비스 이용 시 본인의 계정 정보 및 비밀번호를 안전하게 관리해야 합니다.
② 회원은 서비스 이용과 관련하여 관련 법령 및 회사의 약관을 준수해야 합니다.
③ 회원은 모의 투자 결과를 실제 투자 결정에 직접 활용하지 않아야 합니다.

제5조 (회사의 의무)
① 회사는 회원의 개인정보를 보호하고, 관련 법령에 따라 관리합니다.
② 회사는 서비스의 안정적인 제공을 위해 노력합니다.
③ 회사는 정확한 시장 데이터 제공을 위해 노력하지만, 그 정확성을 보장하지는 않습니다.

제6조 (책임 제한)
① 회사는 서비스에서 제공되는 정보의 정확성, 완전성, 신뢰성에 대해 보장하지 않습니다.
② 회원은 모의 투자 계좌의 결과를 실제 투자 결정에 활용하지 않아야 하며, 이를 활용하여 발생한 손해에 대해 회사는 책임을 지지 않습니다.
③ 회사는 시스템 장애, 네트워크 오류 등으로 인한 서비스 중단에 대해 책임을 지지 않습니다.

제7조 (약관의 변경)
① 회사는 필요 시 본 약관을 변경할 수 있으며, 변경된 약관은 HanaPath 홈페이지 또는 모바일 애플리케이션을 통해 공지합니다.
② 회원이 변경된 약관에 동의하지 않는 경우, 서비스 이용을 중단할 수 있습니다.
③ 변경된 약관은 공지 후 7일이 경과한 시점부터 효력을 발생합니다.

제8조 (준거법 및 관할)
① 이 약관은 대한민국 법률에 따라 해석됩니다.
② 서비스 이용과 관련하여 발생한 분쟁에 대해서는 서울중앙지방법원을 전속 관할 법원으로 합니다.

제9조 (기타)
① 이 약관에서 정하지 않은 사항은 자본시장과 금융투자업에 관한 법률, 개인정보보호법 등 관련 법령에 따릅니다.
② 이 약관은 2024년 1월 1일부터 시행됩니다.`

// 개인정보 수집·이용 동의서
const privacyTerms = `개인정보 수집·이용 동의서

HanaPath(하나패스)(이하 '회사')는 디지털 지갑 및 모의 투자 계좌 서비스 제공을 위해 다음과 같이 개인정보를 수집·이용하고자 합니다.

1. 수집·이용 목적
- 서비스 제공 및 계좌 관리
- 본인 확인 및 인증
- 거래 내역 관리 및 조회
- 고객 상담 및 민원 처리
- 서비스 개선 및 신규 서비스 개발

2. 수집·이용 항목
가. 필수 항목
- 성명, 생년월일, 성별
- 휴대폰번호, 이메일 주소
- 계좌번호, 거래내역
- 기기정보(디바이스 ID, OS 정보)

나. 선택 항목
- 주소, 직업, 소득수준
- 투자성향, 투자경험

3. 보유·이용 기간
- 서비스 이용 기간 중 보유·이용
- 계좌 해지 시 즉시 파기 (단, 관련 법령에 따라 보존 의무가 있는 경우 해당 기간까지 보관)

4. 개인정보 제3자 제공
회사는 원칙적으로 고객의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.
- 고객이 사전에 동의한 경우
- 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우

5. 개인정보 처리 위탁
회사는 서비스 제공을 위해 다음과 같이 개인정보 처리를 위탁하고 있습니다.
- 클라우드 서비스 제공업체: 서버 운영 및 관리
- 보안 서비스 제공업체: 보안 및 암호화 서비스

6. 고객의 권리
고객은 언제든지 개인정보 처리 현황에 대한 열람, 정정·삭제, 처리정지 요구 등의 권리를 행사할 수 있습니다.

7. 개인정보 보호책임자
- 성명: 개인정보보호책임자
- 연락처: 1588-1111
- 이메일: privacy@hanapath.com

8. 동의 거부 권리
위 개인정보 수집·이용에 동의하지 않을 수 있으나, 동의하지 않을 경우 서비스 이용이 제한될 수 있습니다.

※ 본 동의서는 2024년 1월 1일부터 시행됩니다.`

// 금융서비스 약관
const financialTerms = `금융서비스 이용약관

제1조 (목적)
이 약관은 HanaPath(하나패스)가 제공하는 금융서비스의 이용과 관련하여 HanaPath(이하 "회사")와 고객 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (금융서비스의 종류)
① 예금·적금 서비스
② 대출 서비스
③ 투자·자산관리 서비스
④ 외환·송금 서비스
⑤ 카드 서비스
⑥ 기타 회사가 제공하는 금융서비스

제3조 (서비스 이용)
① 고객은 회사가 정한 절차에 따라 서비스를 신청하고 이용할 수 있습니다.
② 서비스 이용 시 발생하는 수수료 및 이자는 회사가 정한 바에 따릅니다.
③ 고객은 서비스 이용 전 관련 약관 및 수수료를 확인해야 합니다.

제4조 (고객의 의무)
① 고객은 정확한 정보를 제공하고, 변경사항이 있을 경우 즉시 통지해야 합니다.
② 고객은 계좌 정보 및 인증수단을 안전하게 관리해야 합니다.
③ 고객은 관련 법령 및 약관을 준수해야 합니다.

제5조 (회사의 의무)
① 회사는 고객의 자산을 안전하게 보관하고 관리합니다.
② 회사는 고객의 개인정보를 보호합니다.
③ 회사는 서비스의 안정적인 제공을 위해 노력합니다.

제6조 (손해배상)
① 회사의 고의 또는 중과실로 인한 손해에 대해서는 손해배상 책임을 집니다.
② 고객의 고의 또는 과실로 인한 손해에 대해서는 회사가 책임을 지지 않습니다.

제7조 (분쟁해결)
① 서비스 이용과 관련한 분쟁은 상호 협의를 통해 해결합니다.
② 협의가 이루어지지 않는 경우 관련 법령에 따라 해결합니다.

제8조 (준거법 및 관할)
① 이 약관은 대한민국 법률에 따라 해석됩니다.
② 서비스 이용과 관련하여 발생한 분쟁에 대해서는 서울중앙지방법원을 전속 관할 법원으로 합니다.

제9조 (기타)
① 이 약관에서 정하지 않은 사항은 전자금융거래법, 개인정보보호법 등 관련 법령에 따릅니다.
② 이 약관은 2024년 1월 1일부터 시행됩니다.`

export default function TermsModal({ isOpen, onClose, type, accountType }: TermsModalProps) {
  const getTermsContent = () => {
    if (type === "service") {
      return accountType === "wallet" ? walletServiceTerms : investmentServiceTerms
    } else if (type === "privacy") {
      return privacyTerms
    } else if (type === "financial") {
      return financialTerms
    }
    return ""
  }

  const getTermsTitle = () => {
    if (type === "service") {
      return accountType === "wallet" ? "디지털 지갑 서비스 이용약관" : "모의 투자 계좌 서비스 이용약관"
    } else if (type === "privacy") {
      return "개인정보 수집·이용 동의서"
    } else if (type === "financial") {
      return "금융서비스 이용약관"
    }
    return ""
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-['Hana2']">{getTermsTitle()}</DialogTitle>
          <p className="text-sm text-gray-600 font-['Hana2']">약관 내용입니다. 스크롤하여 전체 내용을 확인해주세요.</p>
        </DialogHeader>
        
        <div className="prose prose-sm max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg font-['Hana2']">
          <div className="space-y-4">
            {getTermsContent().split('\n\n').map((section, index) => {
              if (section.startsWith('제') && section.includes('조')) {
                // 조항 제목
                const [title, ...content] = section.split('\n')
                return (
                  <div key={index}>
                    <h4 className="font-semibold text-gray-800 font-['Hana2']">{title}</h4>
                    <p className="text-gray-600 leading-relaxed mt-2 font-['Hana2']">
                      {content.join('\n').split('\n').map((line, lineIndex) => (
                        <span key={lineIndex}>
                          {line}
                          {lineIndex < content.join('\n').split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  </div>
                )
              } else if (section.includes('수집·이용 동의서') || section.includes('금융서비스 이용약관')) {
                // 제목 섹션
                return (
                  <div key={index}>
                    <h3 className="font-bold text-lg text-gray-800 mb-4 font-['Hana2']">{section}</h3>
                  </div>
                )
              } else {
                // 일반 내용
                return (
                  <div key={index}>
                    <p className="text-gray-600 leading-relaxed font-['Hana2']">
                      {section.split('\n').map((line, lineIndex) => (
                        <span key={lineIndex}>
                          {line}
                          {lineIndex < section.split('\n').length - 1 && <br />}
                        </span>
                      ))}
                    </p>
                  </div>
                )
              }
            })}
          </div>
        </div>
        
        <div className="mt-4">
          <Button 
            onClick={onClose} 
            className="w-full bg-[#009178] hover:bg-[#004E42] rounded-xl transition-all duration-300"
          >
            확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
