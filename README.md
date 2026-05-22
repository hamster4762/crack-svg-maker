# crack-svg-maker
- 크랙에서 Cloudflare Workers를 고려하여 생성한 image 주소를 기기에서 svg 이미지로 치환합니다.
- 이 확장은 ai를 사용하여 제작했습니다.
- 다운로드 : https://github.com/hamster4762/crack-svg-maker/raw/refs/heads/main/crack-svg-maker.user.js

# 사용방법
<img width="1195" height="796" alt="image" src="https://github.com/user-attachments/assets/d579f7c3-f912-424b-b644-6507db14970b" />

1. 스크립트 등록
2. 스크립트와 매핑되는 단축어 등록
3. imgae base url 입력

## 로컬 서버에서 Image 가져오기
1. image가 있는 폴더에서 HttpServer.exe 실행 (또는 python -m http.server 8000 --bind 127.0.0.1)
2. 팝업창 상단에서 Image 주소 입력 `http://localhost:8000`
3. HttpServer.exe 다운로드 : https://github.com/hamster4762/crack-svg-maker/releases/download/v.1.0.0/HttpServer.exe

## 외부 서버에서 Image 가져오기
1. TamperMonkey 대시보드에서 SVG 이미지 생성기 클릭
2. // @connect localhost 아래에 한줄 추가 `// @connect {가져올 이미지 서버 주소}`
3. 팝업창 상단에서 Image 주소 입력 `{가져올 이미지 서버 주소}`

# 스크립트 작성 가이드
- env.AVATARS를 흉내낸 클래스를 제공함
- env.AVATARS.get(파일명) 함수로 base url에 있는 이미지 로드 가능
- workers 코드를 가져온다면 `/^d`는 `/^\d`로, `/+`는 `/\+`로 이스케이프 문자 추가 필요함
