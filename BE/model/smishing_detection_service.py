from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pickle
import numpy as np
from konlpy.tag import Komoran
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.models import load_model
import logging
from dotenv import load_dotenv

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# .env 파일 로드
load_dotenv(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

class SmishingDetectionService:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.komoran = None
        self.max_len = None
        self.load_model_and_tokenizer()
    
    def load_model_and_tokenizer(self):
        """모델과 토크나이저를 로드합니다."""
        try:
            # 모델 로드
            model_path = os.path.join(os.path.dirname(__file__), 'smishingmodel.h5')
            if os.path.exists(model_path):
                self.model = load_model(model_path)
                logger.info(f"모델 로드 완료: {model_path}")
                logger.info(f"모델 입력 shape: {self.model.input_shape}")
                logger.info(f"모델 출력 shape: {self.model.output_shape}")
            else:
                logger.error(f"모델 파일을 찾을 수 없습니다: {model_path}")
                return
            
            # 토크나이저 로드 (pickle로 저장된 경우)
            tokenizer_path = os.path.join(os.path.dirname(__file__), 'tokenizer.pkl')
            if os.path.exists(tokenizer_path):
                with open(tokenizer_path, 'rb') as f:
                    self.tokenizer = pickle.load(f)
                logger.info(f"토크나이저 로드 완료: {tokenizer_path}")
            else:
                logger.warning("토크나이저 파일이 없습니다. 새로 생성합니다.")
                self.tokenizer = Tokenizer(oov_token='<OOV>')
            
            # Komoran 초기화
            self.komoran = Komoran()
            
            # MAX_LEN 설정 
            max_len_path = os.path.join(os.path.dirname(__file__), 'max_len.txt')
            if os.path.exists(max_len_path):
                with open(max_len_path, 'r') as f:
                    self.max_len = int(f.read().strip())
                logger.info(f"MAX_LEN 로드: {self.max_len}")
            else:
                self.max_len = 19  # 기본값
                logger.warning("MAX_LEN 파일을 찾을 수 없습니다. 기본값을 사용합니다.")
            
            # 모델의 실제 입력 길이 확인
            if self.model:
                model_input_shape = self.model.input_shape
                if model_input_shape and len(model_input_shape) > 1:
                    model_max_len = model_input_shape[1] 
                    logger.info(f"모델이 기대하는 입력 길이: {model_max_len}")
                    if model_max_len != self.max_len:
                        logger.warning(f"MAX_LEN 불일치! 설정값: {self.max_len}, 모델 기대값: {model_max_len}")
                        logger.warning("모델이 제대로 작동하지 않을 수 있습니다.")
                        # 모델의 실제 길이로 맞춤
                        self.max_len = model_max_len
                        logger.info(f"MAX_LEN을 모델에 맞게 조정: {self.max_len}")
            
            logger.info("스미싱 탐지 서비스 초기화 완료")
            
        except Exception as e:
            logger.error(f"모델 로드 중 오류 발생: {str(e)}")
    
    def extract_nouns(self, text):
        """텍스트에서 명사만 추출합니다."""
        try:
            return ' '.join(self.komoran.nouns(str(text)))
        except Exception as e:
            logger.error(f"형태소 분석 중 오류: {str(e)}")
            return ''
    
    def preprocess_text(self, text):
        """텍스트를 전처리합니다."""
        logger.info(f"원본 텍스트: {text}")
        
        # 1. 형태소 분석으로 명사 추출
        logger.info("형태소 분석 시작...")
        nouns = self.extract_nouns(text)
        logger.info(f"추출된 명사: {nouns}")
        
        # 2. 토크나이징
        if self.tokenizer:
            logger.info("토크나이징 시작...")
            sequence = self.tokenizer.texts_to_sequences([nouns])
            logger.info(f"시퀀스: {sequence[0][:20]}... (총 {len(sequence[0])}개 토큰)")
            
            padded_sequence = pad_sequences(sequence, maxlen=self.max_len, padding='post')
            logger.info(f"패딩 완료 - 최종 shape: {padded_sequence.shape}")
            return padded_sequence
        else:
            logger.error("토크나이저가 로드되지 않았습니다.")
            return None
    
    def predict(self, text):
        """텍스트의 스미싱 여부를 예측합니다."""
        try:
            logger.info(f"스미싱 탐지 시작 - 입력 텍스트: {text[:50]}...")
            
            if not self.model:
                logger.error("모델이 로드되지 않았습니다.")
                return {
                    'error': '모델이 로드되지 않았습니다.',
                    'isSmishing': False,
                    'confidence': 0.0
                }
            
            logger.info("모델 로드 상태 확인 완료")
            
            # 전처리
            logger.info("텍스트 전처리 시작...")
            processed_text = self.preprocess_text(text)
            if processed_text is None:
                logger.error("텍스트 전처리 실패")
                return {
                    'error': '텍스트 전처리 중 오류가 발생했습니다.',
                    'isSmishing': False,
                    'confidence': 0.0
                }
            
            logger.info(f"전처리 완료 - 입력 shape: {processed_text.shape}")
            
            # 예측
            logger.info("AI 모델 예측 시작...")
            prediction = self.model.predict(processed_text, verbose=0)
            confidence = float(prediction[0][0])
            
            # 정상 메시지 패턴 체크
            is_normal_pattern = self.is_normal_message_pattern(text)
            is_suspicious_pattern = self.is_suspicious_pattern(text)
            
            # 오탐 방지를 위한 동적 임계값 설정
            if is_normal_pattern and not is_suspicious_pattern:
                # 정상 패턴이 있고 의심 패턴이 없으면 매우 높은 임계값 사용 (0.9)
                threshold = 0.9
                logger.info("정상 메시지 패턴 감지됨 - 매우 높은 임계값 적용")
            elif is_suspicious_pattern and not is_normal_pattern:
                # 의심 패턴이 있고 정상 패턴이 없으면 낮은 임계값 사용 (0.6)
                threshold = 0.6
                logger.info("의심 패턴 감지됨 - 낮은 임계값 적용")
            elif is_normal_pattern and is_suspicious_pattern:
                # 정상 패턴과 의심 패턴이 모두 있으면 중간 임계값 사용 (0.8)
                threshold = 0.8
                logger.info("정상 패턴과 의심 패턴 모두 감지됨 - 중간 임계값 적용")
            else:
                # 일반적인 경우 0.7 임계값 사용
                threshold = 0.7
                logger.info("일반 메시지 - 표준 임계값 적용")
            
            is_smishing = confidence >= threshold
            
            logger.info(f"예측 결과 - 신뢰도: {confidence:.4f}, 스미싱 여부: {is_smishing} (임계값: {threshold})")
            
            # 모델 결과 생성
            model_result = {
                'isSmishing': bool(is_smishing),
                'confidence': round(confidence * 100, 2),
                'reasons': self.generate_reasons(text, is_smishing, confidence),
                'suggestions': self.generate_suggestions(is_smishing)
            }
            
            logger.info(f"스미싱 탐지 완료 - 최종 결과: {'스미싱 의심' if model_result['isSmishing'] else '정상 메시지'}")
            
            return model_result
            
        except Exception as e:
            logger.error(f"예측 중 오류 발생: {str(e)}", exc_info=True)
            return {
                'error': f'예측 중 오류가 발생했습니다: {str(e)}',
                'isSmishing': False,
                'confidence': 0.0
            }
    
    def is_normal_message_pattern(self, text):
        """정상 메시지 패턴을 감지합니다."""
        import re
        text_lower = text.lower()
        
        # 정상 메시지 패턴들 (더 정교한 패턴 매칭)
        normal_patterns = [
            # 카드/결제 관련 - 구체적인 패턴
            r'결제.*승인.*\d+원', r'카드.*사용.*\d+원', r'승인.*완료', r'결제.*완료',
            r'사용내역.*\d+원', r'결제.*\d+원.*승인',
            # 택배/배송 관련 - 운송장번호 포함
            r'배송.*시작', r'배송.*완료', r'택배.*배송', r'운송장.*\d+', r'배송.*안내',
            r'집하처.*출발', r'배송.*예정',
            # 은행/금융 관련 - 구체적인 금액/날짜
            r'정기예금.*만기', r'만기.*알림', r'입금.*\d+원', r'잔액.*\d+원',
            r'대출금리.*인하', r'자동재예치',
            # 공공기관/정부 관련 - 공식 도메인 포함
            r'국민연금.*건강검진', r'건강보험.*혜택', r'국세청.*환급금',
            r'정부.*혜택', r'재난지원금', r'무료.*건강검진',
            # 교육기관 관련
            r'등록금.*납부', r'납부.*마감', r'학교.*안내', r'교육.*혜택',
            r'연구비.*지원', r'신청기간',
            # 공식 기관명 (정확한 매칭)
            r'신한카드|하나카드|kb국민카드', r'하나은행|국민은행|우리은행|신한은행',
            r'cj대한통운|한진택배|로젠택배', r'국민연금공단|건강보험공단',
            r'서울대학교|한국과학기술원', r'서울시|국세청'
        ]
        
        # 정상 패턴이 있는지 확인
        for pattern in normal_patterns:
            if re.search(pattern, text_lower):
                return True
                
        return False
    
    def is_suspicious_pattern(self, text):
        """스미싱 의심 패턴을 감지합니다."""
        import re
        text_lower = text.lower()
        
        # 스미싱 의심 패턴들
        suspicious_patterns = [
            # 긴급성 강조 + 개인정보 요구
            r'급합니다.*계좌번호', r'즉시.*비밀번호', r'5분.*내.*처리',
            r'24시간.*내.*받지.*않으면', r'지금당장.*연락',
            # 의심스러운 링크
            r'bit\.ly|tinyurl\.com|t\.co', r'클릭.*하세요', r'링크.*클릭',
            # 개인정보 요구
            r'계좌번호.*입력', r'비밀번호.*입력', r'otp.*입력', r'주민등록번호.*입력',
            # 과도한 이익 약속
            r'100만원.*당첨', r'50만원.*적립', r'무료.*상품.*증정',
            r'특별.*이벤트.*무료', r'상품권.*당첨',
            # 문법 오류 패턴
            r'급한일이있어서', r'지금당장', r'즉시확인', r'5분내',
            # 공식기관 사칭 + 개인정보
            r'국세청.*계좌정보.*입력', r'건강보험.*개인정보.*입력',
            r'은행.*보안강화.*계정.*정지'
        ]
        
        # 의심 패턴이 있는지 확인
        for pattern in suspicious_patterns:
            if re.search(pattern, text_lower):
                return True
                
        return False
    
    def generate_reasons(self, text, is_smishing, confidence):
        """분석 이유를 생성합니다."""
        reasons = []
        
        # 패턴 체크
        is_normal_pattern = self.is_normal_message_pattern(text)
        is_suspicious_pattern = self.is_suspicious_pattern(text)
        
        if is_smishing:
            if is_normal_pattern and is_suspicious_pattern:
                # 정상 패턴과 의심 패턴이 모두 있는 경우
                reasons.append("정상 메시지 패턴이지만 의심 요소가 포함되어 있습니다")
                reasons.append("공식 기관을 사칭한 스미싱일 가능성이 높습니다")
            elif is_suspicious_pattern:
                # 의심 패턴이 있는 경우
                if 'bit.ly' in text.lower() or 'tinyurl' in text.lower():
                    reasons.append("의심스러운 단축 URL이 포함되어 있습니다")
                elif '급합니다' in text or '즉시' in text:
                    reasons.append("긴급성을 강조하며 개인정보를 요구합니다")
                else:
                    reasons.append("스미싱의 전형적인 특징이 감지되었습니다")
                reasons.append("AI 분석 결과 스미싱으로 판단됩니다")
            else:
                if confidence > 0.8:
                    reasons.append("높은 신뢰도로 스미싱으로 판단됩니다")
                else:
                    reasons.append("AI 분석 결과 스미싱으로 판단됩니다")
                reasons.append("의심스러운 표현이 포함되어 있습니다")
        else:
            if is_normal_pattern:
                if '결제' in text and '승인' in text:
                    reasons.append("정상적인 카드 결제 알림 메시지입니다")
                elif '배송' in text and '택배' in text:
                    reasons.append("정상적인 택배 배송 알림 메시지입니다")
                elif '은행' in text or '카드' in text:
                    reasons.append("정상적인 금융기관 알림 메시지입니다")
                else:
                    reasons.append("정상적인 기관 알림 메시지입니다")
                reasons.append("공식 서비스로 확인됩니다")
            else:
                reasons.append("정상적인 메시지로 판단됩니다")
                reasons.append("금전적 이익을 약속하지 않습니다")
        
        return reasons[:2]  # 최대 2개만 반환
    
    def generate_suggestions(self, is_smishing):
        """권장사항을 생성합니다."""
        if is_smishing:
            return [
                "해당 메시지를 삭제하세요",
                "발신자 번호를 차단하세요"
            ]
        else:
            return [
                "정상적인 메시지입니다",
                "안전하게 응답하셔도 됩니다"
            ]

# 서비스 인스턴스 생성
smishing_service = SmishingDetectionService()

@app.route('/health', methods=['GET'])
def health_check():
    """서비스 상태 확인"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': smishing_service.model is not None,
        'tokenizer_loaded': smishing_service.tokenizer is not None
    })

@app.route('/detect', methods=['POST'])
def detect_smishing():
    """스미싱 탐지 API"""
    try:
        logger.info("스미싱 탐지 API 호출됨")
        data = request.get_json()
        logger.info(f"받은 데이터: {data}")
        
        if not data or 'message' not in data:
            logger.warning("메시지가 제공되지 않음")
            return jsonify({
                'error': '메시지가 제공되지 않았습니다.',
                'isSmishing': False,
                'confidence': 0.0
            }), 400
        
        message = data['message']
        if not message.strip():
            logger.warning("빈 메시지")
            return jsonify({
                'error': '빈 메시지입니다.',
                'isSmishing': False,
                'confidence': 0.0
            }), 400
        
        logger.info(f"유효한 메시지 수신: {message[:50]}...")
        
        # 스미싱 탐지 실행
        logger.info("스미싱 탐지 서비스 호출 시작")
        result = smishing_service.predict(message)
        logger.info(f"탐지 결과: {result}")
        logger.info(f"isSmishing 값: {result.get('isSmishing')}, 타입: {type(result.get('isSmishing'))}")
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"API 오류: {str(e)}", exc_info=True)
        return jsonify({
            'error': f'서버 오류가 발생했습니다: {str(e)}',
            'isSmishing': False,
            'confidence': 0.0
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    app.run(host='0.0.0.0', port=port, debug=True)
