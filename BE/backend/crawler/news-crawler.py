import requests
from bs4 import BeautifulSoup
from datetime import datetime
import json
from pymongo import MongoClient
from urllib.parse import urlparse
from dotenv import load_dotenv
import os
import re

# .env 파일 경로 지정
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)

# MongoDB 접속 정보
MONGO_USER = os.getenv('MONGO_USER')
MONGO_PASSWORD = os.getenv('MONGO_PASSWORD')
MONGO_HOST = os.getenv('MONGO_HOST')
MONGO_PORT = int(os.getenv('MONGO_PORT', 27017))
MONGO_DB = os.getenv('MONGO_DB')
COLLECTION_NAME = 'breakingnews'

# 카테고리별 속보 URL
CATEGORY_MAP = {
    '금융': 'https://news.naver.com/breakingnews/section/101/259',
    '증권': 'https://news.naver.com/breakingnews/section/101/258',
    '경제 일반': 'https://news.naver.com/breakingnews/section/101/263',
}

HEADERS = {
    'User-Agent': 'Mozilla/5.0'
}

def connect_mongodb():
    uri = f"mongodb://{MONGO_USER}:{MONGO_PASSWORD}@{MONGO_HOST}:{MONGO_PORT}"
    client = MongoClient(uri)
    return client[MONGO_DB][COLLECTION_NAME]

def normalize_url(url):
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}"

def fetch_article_links(category_url, limit=30):
    res = requests.get(category_url, headers=HEADERS)
    soup = BeautifulSoup(res.text, 'html.parser')
    links = []

    for a in soup.select('a.sa_text_title'):
        href = a.get('href')
        if href and href.startswith('https://') and href not in links:
            links.append(href)
        if len(links) >= limit:
            break
    return links

def fetch_article_details(url, category):
    try:
        res = requests.get(url, headers=HEADERS)
        soup = BeautifulSoup(res.text, 'html.parser')

        title_tag = soup.select_one('h2#title_area span') or soup.select_one('h2.media_end_head_headline')
        title = title_tag.text.strip() if title_tag else None

        content_tag = soup.select_one('#dic_area') or soup.select_one('.newsct_article')
        content_html = content_tag.decode_contents().strip() if content_tag else None

        # \n, 여러 공백 제거
        if content_tag:
            raw_text = content_tag.get_text(separator=' ')
            content_text = re.sub(r'\s+', ' ', raw_text).strip()
        else:
            content_text = None

        source_tag = soup.select_one('.media_end_head_top_logo img')
        source = source_tag['alt'] if source_tag else '알 수 없음'

        datetime_tag = soup.select_one('.media_end_head_info_datestamp_time') or soup.select_one('span.media_end_head_info_datestamp_time')
        published_at = datetime_tag['data-date-time'] if datetime_tag and 'data-date-time' in datetime_tag.attrs else None

        thumbnail_tag = soup.find('meta', property='og:image')
        if not thumbnail_tag or not thumbnail_tag.get('content'):
            print("썸네일 없음, 기사 스킵")
            return None
        thumbnail_url = thumbnail_tag['content']

        return {
            'category': category,
            'url': url,
            'title': title,
            'content_html': content_html,
            'content_text': content_text,
            'source': source,
            'published_at': published_at,
            'thumbnail_url': thumbnail_url,
            'crawled_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'summary': None,
            'explanation': None
        }
    except Exception as e:
        print(f"[!] 기사 파싱 실패: {url} - {e}")
        return None

def save_to_json(data):
    def clean(doc):
        doc = dict(doc)
        doc.pop('_id', None)
        return doc

    cleaned = [clean(d) for d in data]
    timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
    filename = f"news_result_{timestamp}.json"

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(cleaned, f, indent=2, ensure_ascii=False)
    print(f"JSON 파일 저장 완료: {filename}")

def main():
    collection = connect_mongodb()
    all_articles = []
    success_count = {cat: 0 for cat in CATEGORY_MAP}

    for category, url in CATEGORY_MAP.items():
        print(f"\n{category} 카테고리 속보 수집 중...")
        links = fetch_article_links(url, limit=30)

        count = 0
        for link in links:
            if collection.find_one({"url": link}):
                print(f"중복 기사 (URL) 스킵: {link}")
                continue

            article = fetch_article_details(link, category)
            if not article:
                continue

            if collection.find_one({"title": article["title"], "content_text": article["content_text"]}):
                print(f"중복 기사 (제목+내용) 스킵: {article['title'][:40]}...")
                continue

            try:
                collection.insert_one(article)
                all_articles.append(article)
                success_count[category] += 1
                count += 1
                print(f"저장 완료: {article['title'][:40]}...")
            except Exception as e:
                print(f"[!] MongoDB 저장 실패: {e}")

            if count >= 10:
                break

    if all_articles:
        save_to_json(all_articles)

    print("\n카테고리별 수집 결과:")
    for cat, cnt in success_count.items():
        print(f"  - {cat}: {cnt}건")

if __name__ == "__main__":
    main()
