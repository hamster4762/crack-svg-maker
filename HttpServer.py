import sys
from http.server import SimpleHTTPRequestHandler
from socketserver import ThreadingTCPServer

def run():
    # 기본값 설정 (인자가 없을 때 포트 8000, 주소 localhost)
    port = 8000
    bind_address = 'localhost'

    # 인자가 들어왔을 때 처리 (예: server.exe 8000 --bind localhost)
    args = sys.argv[1:]
    if args:
        # 첫 번째 인자가 포트 번호인지 확인
        try:
            port = int(args[0])
        except ValueError:
            pass

        # --bind 옵션이 인자에 포함되어 있는지 확인 및 값 추출
        if '--bind' in args:
            try:
                bind_idx = args.index('--bind')
                # --bind 바로 다음에 오는 값을 주소로 사용
                if bind_idx + 1 < len(args):
                    bind_address = args[bind_idx + 1]
            except ValueError:
                pass

    server_address = (bind_address, port)
    
    # 지정된 주소와 포트로 멀티스레드 서버 구동
    httpd = ThreadingTCPServer(server_address, SimpleHTTPRequestHandler)
    
    print(f"Serving HTTP on {bind_address} port {port} (http://{bind_address}:{port}/) ...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass

if __name__ == '__main__':
    run()
