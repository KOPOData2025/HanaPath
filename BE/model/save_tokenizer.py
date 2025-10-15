import pandas as pd
import pickle
from konlpy.tag import Komoran
from tensorflow.keras.preprocessing.text import Tokenizer

# 1. 데이터 로드 
file_path = '/content/drive/MyDrive/final_premium_smishing_dataset.csv'
df = pd.read_csv(file_path, encoding='utf-8-sig')

# 2. Komoran 형태소 분석
komoran = Komoran()
def extract_nouns(text):
    try:
        return ' '.join(komoran.nouns(str(text)))
    except:
        return ''

df['result'] = df['message'].apply(extract_nouns)

# 3. 토크나이저 생성 및 학습
X = df['result'].values
tokenizer = Tokenizer(oov_token='<OOV>')
tokenizer.fit_on_texts(X)

# 4. 토크나이저 저장
with open('tokenizer.pkl', 'wb') as f:
    pickle.dump(tokenizer, f)

print("토크나이저가 tokenizer.pkl로 저장되었습니다.")
print(f"단어 사전 크기: {len(tokenizer.word_index) + 1}")

# 5. MAX_LEN 계산
sequences = tokenizer.texts_to_sequences(X)
MAX_LEN = max(len(seq) for seq in sequences)
print(f"MAX_LEN: {MAX_LEN}")

# 6. MAX_LEN도 별도 파일로 저장
with open('max_len.txt', 'w') as f:
    f.write(str(MAX_LEN))

print(f"MAX_LEN이 max_len.txt로 저장되었습니다: {MAX_LEN}")
