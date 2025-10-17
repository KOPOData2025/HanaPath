export function PrivacyPolicy() {
  return (
    <div className="prose prose-sm max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-lg">
      <h4 className="font-semibold text-gray-800">제1조 (개인정보 수집 및 이용 목적)</h4>
      <p className="text-gray-600 leading-relaxed">
        HanaPath는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
      </p>
      <ul className="text-gray-600 leading-relaxed mt-2 ml-4">
        <li>• 회원가입 및 관리: 회원 식별, 가입의사 확인, 본인확인, 연령확인, 만14세 미만 아동 개인정보 수집 시 법정대리인 동의여부 확인</li>
        <li>• 서비스 제공: 금융교육 콘텐츠 제공, 투자 정보 및 시장 분석, 포트폴리오 관리, 커뮤니티 서비스, 챗봇 상담</li>
        <li>• 하나머니 서비스: 출석 체크, 퀴즈 보상, 스토어 구매, 포인트 적립 및 사용</li>
        <li>• 모의투자 서비스: 투자 계좌 관리, 거래 내역 관리, 성과 분석</li>
        <li>• 고객상담 및 민원처리: 문의사항 확인, 사실조사를 위한 연락·통지, 처리결과 통보</li>
      </ul>

      <h4 className="font-semibold text-gray-800 mt-4">제2조 (수집하는 개인정보의 항목)</h4>
      <p className="text-gray-600 leading-relaxed">
        <strong>필수항목:</strong> 이름, 생년월일, 성별, 이메일, 휴대폰번호, 비밀번호<br/>
        <strong>선택항목:</strong> 프로필 이미지, 관심 분야<br/>
        <strong>자동수집항목:</strong> IP주소, 쿠키, MAC주소, 서비스 이용기록, 방문기록, 불량 이용기록, 기기정보
      </p>

      <h4 className="font-semibold text-gray-800 mt-4">제3조 (개인정보의 처리 및 보유기간)</h4>
      <p className="text-gray-600 leading-relaxed">
        ① 회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.<br/>
        ② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:<br/>
        &nbsp;&nbsp;• 회원가입 및 관리: 회원 탈퇴 시까지<br/>
        &nbsp;&nbsp;• 서비스 제공: 서비스 이용 종료 시까지<br/>
        &nbsp;&nbsp;• 하나머니 서비스: 포인트 소진 완료 후 5년<br/>
        &nbsp;&nbsp;• 모의투자 서비스: 투자 계좌 해지 후 5년<br/>
        &nbsp;&nbsp;• 고객상담 및 민원처리: 민원처리 완료 후 3년
      </p>

      <h4 className="font-semibold text-gray-800 mt-4">제4조 (개인정보의 제3자 제공)</h4>
      <p className="text-gray-600 leading-relaxed">
        ① 회사는 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.<br/>
        ② 회사는 다음과 같이 개인정보를 제3자에게 제공하고 있습니다:<br/>
        &nbsp;&nbsp;• 제공받는 자: 한국투자증권(주)<br/>
        &nbsp;&nbsp;• 제공하는 개인정보 항목: 이름, 생년월일, 성별<br/>
        &nbsp;&nbsp;• 제공받는 자의 이용목적: 모의투자 서비스 제공<br/>
        &nbsp;&nbsp;• 보유 및 이용기간: 서비스 이용 종료 시까지
      </p>

      <h4 className="font-semibold text-gray-800 mt-4">제5조 (개인정보 처리의 위탁)</h4>
      <p className="text-gray-600 leading-relaxed">
        ① 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:<br/>
        &nbsp;&nbsp;• 위탁받는 자: Amazon Web Services (AWS)<br/>
        &nbsp;&nbsp;• 위탁하는 업무의 내용: 클라우드 서버 운영 및 데이터 저장<br/>
        &nbsp;&nbsp;• 위탁받는 자: (주)카카오<br/>
        &nbsp;&nbsp;• 위탁하는 업무의 내용: 푸시 알림 서비스 제공
      </p>

      <h4 className="font-semibold text-gray-800 mt-4">제6조 (정보주체의 권리·의무 및 행사방법)</h4>
      <p className="text-gray-600 leading-relaxed">
        ① 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:<br/>
        &nbsp;&nbsp;• 개인정보 처리현황 통지요구<br/>
        &nbsp;&nbsp;• 오류 등이 있을 경우 정정·삭제 요구<br/>
        &nbsp;&nbsp;• 처리정지 요구<br/>
        ② 제1항에 따른 권리 행사는 회사에 대해 서면, 전화, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 회사는 이에 대해 지체없이 조치하겠습니다.
      </p>

      <h4 className="font-semibold text-gray-800 mt-4">제7조 (개인정보의 안전성 확보조치)</h4>
      <p className="text-gray-600 leading-relaxed">
        회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:<br/>
        • 관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등<br/>
        • 기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 개인정보의 암호화, 보안프로그램 설치<br/>
        • 물리적 조치: 전산실, 자료보관실 등의 접근통제
      </p>

      <h4 className="font-semibold text-gray-800 mt-4">제8조 (개인정보 보호책임자)</h4>
      <p className="text-gray-600 leading-relaxed">
        회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:<br/><br/>
        <strong>개인정보 보호책임자</strong><br/>
        • 성명: 김하나<br/>
        • 직책: 개인정보보호팀장<br/>
        • 연락처: 1588-8888, privacy@hanapath.com<br/><br/>
        <strong>개인정보 보호담당부서</strong><br/>
        • 부서명: 개인정보보호팀<br/>
        • 담당자: 이보호<br/>
        • 연락처: 1588-8889, privacy@hanapath.com
      </p>

      <h4 className="font-semibold text-gray-800 mt-4">제9조 (권익침해 구제방법)</h4>
      <p className="text-gray-600 leading-relaxed">
        정보주체는 아래의 기관에 대해 개인정보 침해신고를 할 수 있습니다:<br/>
        • 개인정보보호위원회: privacy.go.kr / 국번없이 182<br/>
        • 개인정보분쟁조정위원회: www.kopico.go.kr / 1833-6972<br/>
        • 대검찰청 사이버범죄수사단: www.spo.go.kr / 02-3480-3571<br/>
        • 경찰청 사이버안전국: cyberbureau.police.go.kr / 국번없이 182
      </p>

      <div className="mt-6 p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
        <p className="text-sm text-green-800 font-medium">
          <strong>시행일자:</strong> 2024년 1월 1일<br/>
          <strong>최종 개정일:</strong> 2024년 12월 1일
        </p>
      </div>
    </div>
  )
}
