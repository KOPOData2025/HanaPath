import os
import json
import time
import threading
import requests
import websocket
from dotenv import load_dotenv
from datetime import datetime
from flask import Flask, request, jsonify


# .env 로드
dotenv_path = os.path.join(os.path.dirname(__file__), '..', 'BE', 'backend', '.env')
load_dotenv(dotenv_path)

# 모의 계좌 환경변수
APP_KEY = os.getenv("KIS_APP_KEY")
APP_SECRET = os.getenv("KIS_APP_SECRET")
KIS_ENV = os.getenv("KIS_ENV", "mock").lower()

# Spring API URLs
SPRING_POST_URL = os.getenv("SPRING_POST_URL")
SPRING_EXECUTION_URL = os.getenv("SPRING_EXECUTION_URL")
tickers_env = os.getenv("TICKERS")
SUBSCRIBED_TICKERS = [t.strip() for t in tickers_env.split(",") if t.strip()]

# 모의 계좌 API URL
BASE_URL_MOCK = "https://openapivts.koreainvestment.com:29443"
WS_URL_MOCK = "ws://ops.koreainvestment.com:21000"

# 실계좌 API URL
BASE_URL_REAL = "https://openapi.koreainvestment.com:9443"
WS_URL_REAL = "ws://ops.koreainvestment.com:31000"

# 토큰 캐시 파일
cache_file_mock = os.path.join(os.path.dirname(__file__), "token_cache_mock.json")

def get_access_token_mock():
    """모의 계좌용 토큰 발급 (호가용)"""
    if os.path.exists(cache_file_mock):
        try:
            with open(cache_file_mock, 'r') as f:
                cached = json.load(f)
                expires_at = datetime.fromisoformat(cached.get("expires_at"))
                if datetime.now() < expires_at:
                    print("모의 계좌 캐시 토큰 사용")
                    return cached.get("access_token")
        except Exception as e:
            print("모의 계좌 캐시 토큰 로드 실패:", e)

    # 새 모의 계좌 토큰 발급
    print("모의 계좌 새 토큰 발급 중...")
    url = f"{BASE_URL_MOCK}/oauth2/tokenP"
    headers = {'Content-Type': 'application/json'}
    payload = {
        "grant_type": "client_credentials",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET
    }

    res = requests.post(url, headers=headers, json=payload)
    if res.status_code == 200:
        data = res.json()
        token = data["access_token"]
        expires_in = int(data.get("expires_in", 86400))
        expires_at = datetime.fromtimestamp(datetime.now().timestamp() + expires_in)
        with open(cache_file_mock, 'w') as f:
            json.dump({
                "access_token": token,
                "expires_at": expires_at.isoformat()
            }, f, indent=2)
        print("모의 계좌 토큰 발급 성공")
        return token
    else:
        print("모의 계좌 토큰 발급 실패:", res.text)
        return None

def build_subscribe_frame(tr_id, tr_key, token, app_key, app_secret):
    return json.dumps({
        "header": {
            "authorization": f"Bearer {token}",
            "appkey": app_key,
            "appsecret": app_secret,
            "tr_type": "1",
            "tr_id": tr_id,
            "custtype": "P"
        },
        "body": {
            "input": {
                "tr_id": tr_id,
                "tr_key": tr_key
            }
        }
    })

# 전역 WebSocket 연결 관리
ws_connections = {
    "mock": None,
    "live": None
}

# 현재 구독 중인 종목들
active_subscriptions = set()

# Flask 
app = Flask(__name__)

def subscribe_ticker(ticker):
    """특정 종목 구독 (백엔드 요청으로)"""
    global ws_connections, active_subscriptions

    if ticker in active_subscriptions:
        print(f"{ticker} 이미 구독 중")
        return True

    ws = ws_connections.get("mock")
    if not ws:
        print(f"WebSocket 연결 없음")
        return False

    token = get_access_token_mock()
    if not token:
        print("토큰 없음")
        return False

    try:
        # 체결 데이터 구독 (H0STCNT0)
        msg = build_subscribe_frame("H0STCNT0", ticker, token, APP_KEY, APP_SECRET)
        ws.send(msg)
        time.sleep(0.2)

        # 호가 데이터 구독 (H0STASP0)
        msg_hoga = build_subscribe_frame("H0STASP0", ticker, token, APP_KEY, APP_SECRET)
        ws.send(msg_hoga)
        time.sleep(0.2)

        active_subscriptions.add(ticker)
        print(f"{ticker} 구독 성공 - 현재 구독: {active_subscriptions}")
        return True

    except Exception as e:
        print(f"{ticker} 구독 실패: {e}")
        return False

def unsubscribe_ticker(ticker):
    """특정 종목 구독 해제"""
    global active_subscriptions

    if ticker in active_subscriptions:
        active_subscriptions.remove(ticker)
        print(f"{ticker} 구독 해제 - 현재 구독: {active_subscriptions}")
        return True
    return False

# Flask API 엔드포인트
@app.route('/subscribe/<ticker>', methods=['POST'])
def api_subscribe(ticker):
    result = subscribe_ticker(ticker)
    return jsonify({"success": result, "ticker": ticker, "subscriptions": list(active_subscriptions)})

@app.route('/unsubscribe/<ticker>', methods=['POST'])
def api_unsubscribe(ticker):
    result = unsubscribe_ticker(ticker)
    return jsonify({"success": result, "ticker": ticker, "subscriptions": list(active_subscriptions)})

@app.route('/subscriptions', methods=['GET'])
def api_get_subscriptions():
    return jsonify({"subscriptions": list(active_subscriptions)})

def on_open_mock(ws):
    """모의 계좌 WebSocket 연결 - 동적 구독 대기"""
    print("모의 계좌 WebSocket 연결 성공")
    print("동적 구독 모드: 사용자가 종목을 클릭할 때까지 대기 중...")
    # 아무것도 구독하지 않고 대기

def on_message_mock(ws, message):
    """모의 계좌 메시지 처리"""
    try:
        # JSON 파싱 시도
        try:
            data = json.loads(message)
            header = data.get("header", {})
            tr_id = header.get("tr_id", "")

            # PINGPONG 메시지는 하트비트이므로 무시
            if tr_id == "PINGPONG":
                return

            body = data.get("body", {})
            if body.get("msg1") == "SUBSCRIBE SUCCESS":
                print("모의 계좌 구독 성공")
                return

            # 호가 데이터 처리
            ticker = body.get("symbol", "")
            if ticker:  # 종목코드가 있을 때만 처리
                price = int(body.get("stck_prpr", "0"))
                volume = int(body.get("acml_vol", "0"))
                ask_prices = [int(body.get(f"askp{i}", 0)) for i in range(1, 11)]
                bid_prices = [int(body.get(f"bidp{i}", 0)) for i in range(1, 11)]

                result = {
                    "ticker": ticker,
                    "price": price,
                    "volume": volume,
                    "askPrices": ask_prices,
                    "bidPrices": bid_prices,
                    "timestamp": int(datetime.now().timestamp() * 1000)
                }

                print(f"모의 호가: {ticker}: {price}원")
                send_to_spring(result, SPRING_POST_URL)

        except json.JSONDecodeError:
            # 파이프로 구분된 실제 시세 데이터 처리
            if isinstance(message, str) and "|" in message:
                parse_pipe_separated_data_mock(message)

    except Exception as e:
        print("모의 계좌 메시지 처리 오류:", e)

def parse_execution_data(data_fields):
    try:
        # 필드 추출
        ticker = data_fields[0]  # 종목코드 (MKSC_SHRN_ISCD)
        time_str = data_fields[1]  # 체결시간 (STCK_CNTG_HOUR)
        price = safe_int(data_fields[2])  # 현재가 (STCK_PRPR)
        volume = safe_int(data_fields[12])  # 체결 수량 (CNTG_VOL)
        trade_code = data_fields[21].strip()  # 체결구분 (CCLD_DVSN)

        # 체결유형 판단
        if trade_code in ["1", "B", "+"]:
            trade_type = "BUY"
        elif trade_code in ["5", "S", "-"]:
            trade_type = "SELL"
        else:
            print(f"체결구분 '{trade_code}'은 무시됨")
            return

        # 유효성 검증
        if price <= 0 or volume <= 0:
            print(f"체결가 수신 실패: 장이 마감했거나 거래 없음")
            print(f"무효 데이터: price={price}, volume={volume}")
            return

        # 시간 처리 (표시는 HH:MM:SS, 식별자는 밀리초 타임스탬프로 고유화)
        formatted_time = format_time(time_str)
        # (원래) timestamp = create_timestamp_from_kis_time(time_str)
        timestamp = int(datetime.now().timestamp() * 1000)

        # 전송 객체
        result = {
            "ticker": ticker,
            "price": price,
            "volume": volume,
            "tradeType": trade_type,
            "time": formatted_time,
            "timestamp": timestamp,
        }

        # 로그 출력
        print("=" * 100)
        print(f" 체결 정보")
        print(f"   종목코드 : {ticker}")
        print(f"   체결가격 : {price:,}원")
        print(f"   체결수량 : {volume:,}주")
        print(f"   체결시간 : {formatted_time}")
        print(f"   체결구분 : {trade_type} (원본 코드: '{trade_code}')")
        print(f"   Timestamp : {timestamp}")
        print("=" * 100)

        # 전송
        send_to_spring(result, SPRING_EXECUTION_URL)

    except Exception as e:
        print(f"체결 데이터 파싱 오류: {e}")

def parse_pipe_separated_data_mock(message):
    """모의 계좌 파이프 데이터 파싱 (호가용)"""
    try:
        if isinstance(message, bytes):
            message = message.decode('utf-8')
            
        fields = message.split('|')
        if len(fields) < 4:
            return
            
        tr_id = fields[1]
        code = fields[2]
        data_part = fields[3]
        data_fields = data_part.split('^')
        
        print(f"모의 계좌 TR_ID: {tr_id}, 코드: {code}")
        
        if tr_id == "H0STCNT0":  # 현재가 정보 (체결 포함)
            current_time = datetime.now().strftime("%H:%M:%S.%f")[:-3]
            print(f"[{current_time}] H0STCNT0 현재가 데이터 수신: {code}")
            print(f"전체 필드 수: {len(data_fields)}")
            parse_current_price_data(data_fields, "모의")
            parse_execution_data(data_fields)
        elif tr_id == "H0STCNT1":  # 체결가 전용 
            current_time = datetime.now().strftime("%H:%M:%S.%f")[:-3]
            print(f"[{current_time}] H0STCNT1 체결 전용 데이터 수신: {code}")
            print(f"전체 필드 수: {len(data_fields)}")
            parse_execution_data(data_fields)
        elif tr_id == "H0STCIT0":  # 체결내역 전용
            current_time = datetime.now().strftime("%H:%M:%S.%f")[:-3]
            print(f"[{current_time}] H0STCIT0 체결내역 데이터 수신: {code}")
            print(f"전체 필드 수: {len(data_fields)}")
            print(f"첫 20개 필드: {data_fields[:20] if len(data_fields) > 20 else data_fields}")
            parse_execution_data(data_fields)
        elif tr_id == "H0STASP0":  # 호가 정보
            print(f"H0STASP0 호가 데이터 수신: {code}, 필드 수: {len(data_fields)}")
            print(f"실제 필드 데이터 (첫 50개): {data_fields[:50] if len(data_fields) > 50 else data_fields}")
            parse_orderbook_data(data_fields, "모의")
            
    except Exception as e:
        print("모의 계좌 파이프 데이터 파싱 오류:", e)

def safe_int(value, default=0):
    """안전한 정수 변환"""
    try:
        if not value or not str(value).strip().replace('-', '').isdigit():
            return default
        num = int(value)
        if num < -2147483648 or num > 2147483647:
            return default
        return num
    except:
        return default

def parse_current_price_data(data_fields, account_type):
    """현재가 데이터 파싱"""
    try:
        if len(data_fields) < 15:
            print(f"{account_type} 현재가 데이터 필드 수 부족:", len(data_fields))
            return

        ticker = data_fields[0]
        price = safe_int(data_fields[2])
        volume = safe_int(data_fields[13])

        result = {
            "ticker": ticker,
            "price": price,
            "volume": volume,
            "askPrices": [0] * 10,
            "bidPrices": [0] * 10,
            "timestamp": int(datetime.now().timestamp() * 1000)
        }

        print(f"{account_type} 현재가: {ticker}: {price}원")
        send_to_spring(result, SPRING_POST_URL)

    except Exception as e:
        print(f"{account_type} 현재가 파싱 오류:", e)

def parse_orderbook_data(data_fields, account_type):
    """호가 데이터 파싱 - KIS API 필드 순서 기반"""
    try:
        if len(data_fields) < 50:
            print(f"{account_type} 호가 데이터 필드 수 부족:", len(data_fields))
            return
            
        ticker = data_fields[0]
        
        # 로그 분석 결과 기반 올바른 필드 순서
        # 매도호가 10개 (3~12번 필드)
        ask_prices = []
        for i in range(3, 13):
            ask_prices.append(safe_int(data_fields[i] if i < len(data_fields) else "0"))
        
        # 매수호가 10개 (13~22번 필드)  
        bid_prices = []
        for i in range(13, 23):
            bid_prices.append(safe_int(data_fields[i] if i < len(data_fields) else "0"))
        
        # 매도호가 잔량 10개 (23~32번 필드)
        ask_volumes = []
        for i in range(23, 33):
            ask_volumes.append(safe_int(data_fields[i] if i < len(data_fields) else "0"))
        
        # 매수호가 잔량 10개 (33~42번 필드)
        bid_volumes = []
        for i in range(33, 43):
            bid_volumes.append(safe_int(data_fields[i] if i < len(data_fields) else "0"))
        
        # 현재가 (매수1호가 또는 매도1호가)
        price = bid_prices[0] if bid_prices[0] > 0 else ask_prices[0]
        
        # 총 거래량 
        volume = 0
        # if len(data_fields) > 60:
        #     # 총 매도호가 잔량 + 총 매수호가 잔량
        #     total_ask = safe_int(data_fields[60] if len(data_fields) > 60 else "0")
        #     total_bid = safe_int(data_fields[61] if len(data_fields) > 61 else "0")
        #     volume = total_ask + total_bid
        
        result = {
            "ticker": ticker,
            "price": price,
            "volume": 0,
            "askPrices": ask_prices,
            "bidPrices": bid_prices,
            "askVolumes": ask_volumes,  # 매도호가 잔량
            "bidVolumes": bid_volumes,  # 매수호가 잔량
            "timestamp": int(datetime.now().timestamp() * 1000)
        }
        
        print(f"{account_type} 호가: {ticker}: {price}원")
        print(f"매도호가: {ask_prices[:3]}... (잔량: {ask_volumes[:3]})")
        print(f"매수호가: {bid_prices[:3]}... (잔량: {bid_volumes[:3]})")
        print(f"총 거래량: {volume:,}주")
        send_to_spring(result, SPRING_POST_URL)
        
    except Exception as e:
        print(f"{account_type} 호가 파싱 오류:", e)

def determine_trade_type_improved(cntg_gubun, data_fields):
    """개선된 체결 구분 판단 - KIS API 표준"""
    try:
        print(f"체결구분 분석 시작: '{cntg_gubun}'")
        
        trade_type = "BUY"  # 기본값
        
        # KIS API 체결구분 코드 매핑
        if cntg_gubun:
            cntg_code = cntg_gubun.strip()
            if cntg_code in ["2", "S", "매도"]:
                trade_type = "SELL"
                print(f"체결구분 매핑: '{cntg_code}' -> SELL")
            elif cntg_code in ["1", "B", "매수"]:
                trade_type = "BUY"
                print(f"체결구분 매핑: '{cntg_code}' -> BUY")
            else:
                print(f"알 수 없는 체결구분: '{cntg_code}' -> 기본값 BUY")
        
        # 추가 필드에서도 체결구분 찾기
        if len(data_fields) > 6:
            for i in range(6, min(len(data_fields), 10)):
                field_str = str(data_fields[i]).strip().upper()
                if field_str in ["SELL", "매도", "2", "S"]:
                    trade_type = "SELL"
                    print(f"추가 필드에서 체결구분 감지: 필드[{i}]='{field_str}' -> SELL")
                    break
                elif field_str in ["BUY", "매수", "1", "B"]:
                    trade_type = "BUY"
                    print(f"추가 필드에서 체결구분 감지: 필드[{i}]='{field_str}' -> BUY")
                    break
        
        return trade_type
    except Exception as e:
        print(f"체결구분 판단 오류: {e}")
        return "BUY"  # 오류 시 기본값

def format_time(time_str):
    """시간 포맷팅"""
    try:
        if len(time_str) >= 6:
            return f"{time_str[:2]}:{time_str[2:4]}:{time_str[4:6]}"
        return time_str
    except:
        return datetime.now().strftime("%H:%M:%S")

def create_timestamp_from_kis_time(time_str):
    """KIS 시간 문자열을 타임스탬프로 변환"""
    try:
        if not time_str or len(time_str) < 6:
            return int(datetime.now().timestamp() * 1000)
        
        now = datetime.now()
        hour = int(time_str[:2])
        minute = int(time_str[2:4])
        second = int(time_str[4:6])
        
        execution_time = now.replace(hour=hour, minute=minute, second=second, microsecond=0)
        
        return int(execution_time.timestamp() * 1000)
    except Exception as e:
        print(f"시간 변환 오류: {e}, time_str: {time_str}")
        return int(datetime.now().timestamp() * 1000)

def send_to_spring(result, url):
    """Spring 백엔드로 데이터 전송 (항상 전송 - 백엔드에서 필터링)"""
    try:
        current_time = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        response = requests.post(url, json=result, timeout=5)
        
        if response.status_code == 200:
            print(f"[{current_time}] Spring 전송: {result['ticker']} {result.get('price', 0):,}원 / {result.get('volume', 0):,}주")
        else:
            print(f"[{current_time}] Spring 실패: {result['ticker']} - {response.status_code}")
            
    except requests.exceptions.ConnectionError as e:
        print(f"Spring 연결 불가: {result['ticker']} - 백엔드 실행 확인 필요")
    except Exception as e:
        print(f"Spring 오류: {result['ticker']} - {str(e)}")

def on_error_mock(ws, error):
    print("모의 계좌 WebSocket 에러:", error)

def on_close_mock(ws, close_status_code, close_msg):
    print("모의 계좌 WebSocket 연결 종료")



def start_websockets():
    """WebSocket과 HTTP API 서버 동시 실행"""
    
    def run_mock():
        """모의 계좌 WebSocket 실행"""
        while True:
            try:
                print("KIS WebSocket 연결 시작...")
                ws_mock = websocket.WebSocketApp(
                    WS_URL_MOCK,
                    on_open=on_open_mock,
                    on_message=on_message_mock,
                    on_error=on_error_mock,
                    on_close=on_close_mock
                )
                ws_connections["mock"] = ws_mock
                ws_mock.run_forever()
            except Exception as e:
                print("KIS WebSocket 오류:", e)
            print("5초 후 재연결...")
            time.sleep(5)

    def run_api_server():
        """Flask API 서버 실행"""
        print("Python API 서버 시작")
        app.run(host='0.0.0.0', port=5001, debug=False, use_reloader=False)

    # WebSocket과 API 서버를 별도 스레드에서 실행
    threading.Thread(target=run_mock, daemon=True).start()
    threading.Thread(target=run_api_server, daemon=True).start()

if __name__ == "__main__":
    print("KIS 동적 구독 시스템 시작")
    print("=" * 60)
    print(f"Spring 백엔드: {SPRING_POST_URL}")  
    print(f"Python API")
    print(f"KIS Key: {APP_KEY[:10]}...")
    print("동적 구독: 종목 클릭 시에만 구독")
    print("=" * 60)
    
    start_websockets()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n시스템 종료...")

