import os
import json
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

# 캐시 저장소
_cache = {}
_cache_expiry = {}
CACHE_DURATION = 60 

# .env 로드
dotenv_path = os.path.join(os.path.dirname(__file__), '..', 'BE', 'backend', '.env')
load_dotenv(dotenv_path)

# 환경변수
APP_KEY = os.getenv("KIS_APP_KEY")
APP_SECRET = os.getenv("KIS_APP_SECRET")
KIS_ENV = os.getenv("KIS_ENV", "mock").lower()

# 환경별 API URL
if KIS_ENV == "live":
    BASE_URL = "https://openapi.koreainvestment.com:9443"
else:
    BASE_URL = "https://openapivts.koreainvestment.com:29443"

# 토큰 캐시 파일
cache_file = os.path.join(os.path.dirname(__file__), "token_cache.json")

def get_from_cache(key):
    """캐시에서 데이터 조회"""
    if key in _cache and key in _cache_expiry:
        if datetime.now() < _cache_expiry[key]:
            print(f"캐시에서 조회: {key}")
            return _cache[key]
        else:
            # 만료된 캐시 삭제
            del _cache[key]
            del _cache_expiry[key]
    return None

def set_cache(key, data):
    """캐시에 데이터 저장"""
    _cache[key] = data
    _cache_expiry[key] = datetime.now() + timedelta(seconds=CACHE_DURATION)
    print(f"캐시에 저장: {key}")

def get_access_token():
    """토큰 가져오기 (캐시 우선)"""
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r') as f:
                cached = json.load(f)
                expires_at = datetime.fromisoformat(cached.get("expires_at"))
                if datetime.now() < expires_at:
                    return cached.get("access_token")
        except Exception as e:
            print("캐시 토큰 로드 실패:", e)

    # 새 토큰 발급
    url = f"{BASE_URL}/oauth2/tokenP"
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
        
        with open(cache_file, 'w') as f:
            json.dump({
                "access_token": token,
                "expires_at": expires_at.isoformat()
            }, f, indent=2)
        return token
    else:
        print("토큰 발급 실패:", res.text)
        return None

def get_daily_chart(ticker, start_date, end_date):
    """일봉 차트 데이터 조회"""
    token = get_access_token()
    if not token:
        return None
    
    url = f"{BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice"
    headers = {
        "Content-Type": "application/json",
        "authorization": f"Bearer {token}",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET,
        "tr_id": "FHKST03010100"
    }
    
    params = {
        "fid_cond_mrkt_div_code": "J",
        "fid_input_iscd": ticker,
        "fid_input_date_1": start_date.strftime("%Y%m%d"),
        "fid_input_date_2": end_date.strftime("%Y%m%d"),
        "fid_period_div_code": "D",  # D: 일봉, W: 주봉, M: 월봉
        "fid_org_adj_prc": "0"
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            data = response.json()
            return parse_chart_data(data)
        else:
            print(f"일봉 조회 실패: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"일봉 조회 오류: {e}")
        return None

def get_weekly_chart(ticker, start_date, end_date):
    """주봉 차트 데이터 조회"""
    token = get_access_token()
    if not token:
        return None
    
    url = f"{BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice"
    headers = {
        "Content-Type": "application/json",
        "authorization": f"Bearer {token}",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET,
        "tr_id": "FHKST03010100"
    }
    
    params = {
        "fid_cond_mrkt_div_code": "J",
        "fid_input_iscd": ticker,
        "fid_input_date_1": start_date.strftime("%Y%m%d"),
        "fid_input_date_2": end_date.strftime("%Y%m%d"),
        "fid_period_div_code": "W",  # W: 주봉
        "fid_org_adj_prc": "0"
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            data = response.json()
            return parse_chart_data(data)
        else:
            print(f"주봉 조회 실패: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"주봉 조회 오류: {e}")
        return None

def parse_chart_data(response_data):
    """차트 데이터 파싱"""
    try:
        if response_data.get("rt_cd") != "0":
            print(f"API 오류: {response_data.get('msg1', 'Unknown error')}")
            return None
            
        output = response_data.get("output2", [])
        if not output:
            print("차트 데이터 없음")
            return None
        
        chart_data = []
        for item in output:
            try:
                candle = {
                    "date": item.get("stck_bsop_date", ""),  # 날짜
                    "time": item.get("stck_cntg_hour", ""),  # 시간 (분봉용)
                    "open": int(item.get("stck_oprc", 0)),   # 시가
                    "high": int(item.get("stck_hgpr", 0)),   # 고가
                    "low": int(item.get("stck_lwpr", 0)),    # 저가
                    "close": int(item.get("stck_clpr", 0)),  # 종가
                    "volume": int(item.get("acml_vol", 0))   # 거래량
                }
                chart_data.append(candle)
            except (ValueError, TypeError) as e:
                print(f"데이터 파싱 오류: {e}, 데이터: {item}")
                continue
                
        return sorted(chart_data, key=lambda x: (x["date"], x.get("time", "")))
        
    except Exception as e:
        print(f"차트 데이터 파싱 오류: {e}")
        return None

def get_stock_info(ticker):
    """종목 기본 정보 조회 (캐시 적용)"""
    # 캐시 키 생성
    cache_key = f"info_{ticker}"
    
    # 캐시에서 먼저 조회
    cached_data = get_from_cache(cache_key)
    if cached_data:
        return cached_data
        
    token = get_access_token()
    if not token:
        return None
        
    url = f"{BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price"
    headers = {
        "Content-Type": "application/json",
        "authorization": f"Bearer {token}",
        "appkey": APP_KEY,
        "appsecret": APP_SECRET,
        "tr_id": "FHKST01010100"
    }
    
    params = {
        "fid_cond_mrkt_div_code": "J",
        "fid_input_iscd": ticker
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            data = response.json()
            result = parse_stock_info(data, ticker)
            # 성공하면 캐시에 저장
            if result:
                set_cache(cache_key, result)
            return result
        else:
            print(f"종목 정보 조회 실패: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"종목 정보 조회 오류: {e}")
        return None

def parse_stock_info(response_data, ticker):
    """종목 정보 파싱"""
    try:
        if response_data.get("rt_cd") != "0":
            print(f"API 오류: {response_data.get('msg1', 'Unknown error')}")
            return None
            
        output = response_data.get("output", {})
        if not output:
            print("종목 정보 없음")
            return None
            
        # 실제 API 응답 로깅
        print(f"{ticker} API 응답 필드들:")
        for key, value in output.items():
            print(f"  {key}: {value}")
            
        def safe_int(value, default=0):
            """안전한 정수 변환"""
            try:
                if not value:
                    return default
                return int(float(str(value)))
            except (ValueError, TypeError):
                return default

        def safe_float(value, default=0.0):
            """안전한 실수 변환"""
            try:
                if not value:
                    return default
                return float(str(value))
            except (ValueError, TypeError):
                return default
        
        stock_info = {
            "ticker": ticker,
            "name": output.get("hts_kor_isnm", ""),  # 종목명
            "currentPrice": safe_int(output.get("stck_prpr", 0)),  # 현재가
            "changeAmount": safe_int(output.get("prdy_vrss", 0)),  # 전일대비
            "changeRate": safe_float(output.get("prdy_ctrt", 0)),  # 등락률
            "openPrice": safe_int(output.get("stck_oprc", 0)),  # 시가
            "highPrice": safe_int(output.get("stck_hgpr", 0)),  # 고가
            "lowPrice": safe_int(output.get("stck_lwpr", 0)),  # 저가
            "volume": safe_int(output.get("acml_vol", 0)),  # 거래량
            "tradingValue": safe_int(output.get("acml_tr_pbmn", 0)),  # 거래대금
            "marketCap": safe_int(output.get("hts_avls", 0)) * 1000000,  # 시가총액
            "capital": safe_int(output.get("cpfn", 0)) * 100000000,  # 자본금
            "per": safe_float(output.get("per", 0)),  # PER
            "pbr": safe_float(output.get("pbr", 0)),  # PBR
            "eps": safe_int(output.get("eps", 0)),  # EPS
            "bps": safe_int(output.get("bps", 0)),  # BPS
            "sector": output.get("bstp_kor_isnm", ""),  # 업종명
            "listingShares": safe_int(output.get("lstn_stcn", 0)),  # 상장주수
        }
        
        return stock_info
        
    except Exception as e:
        print(f"종목 정보 파싱 오류: {e}")
        return None

def get_chart_data(ticker, chart_type="daily", period=30):
    """
    차트 데이터 통합 조회 (캐시 적용)
    :param ticker: 종목코드
    :param chart_type: "daily", "weekly", "minute1", "minute5", "minute30"
    :param period: 조회 기간 (일 단위)
    """
    # 캐시 키 생성
    cache_key = f"chart_{ticker}_{chart_type}_{period}"
    
    # 캐시에서 먼저 조회
    cached_data = get_from_cache(cache_key)
    if cached_data:
        return cached_data
    
    print(f"{ticker} {chart_type} 차트 조회 시작...")
    
    data = None
    if chart_type == "daily":
        end_date = datetime.now()
        start_date = end_date - timedelta(days=period)
        data = get_daily_chart(ticker, start_date, end_date)
    elif chart_type == "weekly":
        end_date = datetime.now()
        # 주봉은 주 단위로 계산 
        weeks = min(period // 7, 156) 
        start_date = end_date - timedelta(days=weeks * 7)
        data = get_weekly_chart(ticker, start_date, end_date)
    else:
        print(f"지원하지 않는 차트 타입: {chart_type}")
        return None
    
    # 데이터가 있으면 캐시에 저장
    if data:
        set_cache(cache_key, data)
    
    return data

if __name__ == "__main__":
    import sys
    
    # 명령행 인자 처리
    if len(sys.argv) >= 3:
        ticker = sys.argv[1]
        data_type = sys.argv[2]  # "daily", "weekly", "minute1", "info"
        
        if data_type == "info":
            # 종목 정보 조회
            info = get_stock_info(ticker)
            if info:
                print(json.dumps(info, ensure_ascii=False))
            else:
                print("{}")
        else:
            # 차트 데이터 조회
            period = int(sys.argv[3]) if len(sys.argv) >= 4 else 30
            data = get_chart_data(ticker, data_type, period)
            
            # JSON 형태로 출력 (Spring에서 파싱용)
            if data:
                print(json.dumps(data, ensure_ascii=False))
            else:
                print("[]")
