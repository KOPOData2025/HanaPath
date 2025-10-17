#!/usr/bin/env python3
"""
스미싱 탐지 Flask 서비스 실행 스크립트
"""

import os
import sys
from smishing_detection_service import app

if __name__ == '__main__':
    # 모델 파일 존재 확인
    model_path = os.path.join(os.path.dirname(__file__), 'smishingmodel.h5')
    if not os.path.exists(model_path):
        print(f"모델 파일을 찾을 수 없습니다: {model_path}")
        print("BE/model/ 폴더에 smishingmodel.h5 파일을 넣어주세요.")
        sys.exit(1)
    
    # 토크나이저 파일 존재 확인
    tokenizer_path = os.path.join(os.path.dirname(__file__), 'tokenizer.pkl')
    if not os.path.exists(tokenizer_path):
        print(f"토크나이저 파일을 찾을 수 없습니다: {tokenizer_path}")
        print("토크나이저가 없으면 기본 토크나이저를 사용합니다.")
    
    # MAX_LEN 파일 확인
    max_len_path = os.path.join(os.path.dirname(__file__), 'max_len.txt')
    if os.path.exists(max_len_path):
        with open(max_len_path, 'r') as f:
            max_len = int(f.read().strip())
        print(f"MAX_LEN 로드: {max_len}")
    else:
        print("기본값을 사용합니다.")
    
    print("스미싱 탐지 서비스 시작")
    
    app.run(host='0.0.0.0', port=5002, debug=True)
