// ==UserScript==
// @name         크랙 SVG 이미지 생성기
// @namespace    https://crack.wrtn.ai/
// @version      1.0.0
// @description  크랙에서 svgm.invalid로 시작하는 이미지 주소를 감지하여 사용자가 작성한 스크립트를 통해 생성한 SVG 이미지로 동적 치환해 줍니다. (version 관리방식: 크랙UI변경.기능추가및수정.핫픽스)
// @author       gemini
// @match        https://crack.wrtn.ai/*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      localhost
// @connect      127.0.0.1
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // --- 기본 스크립트 (삭제/수정 불가 보호 대상) ---
    const DEFAULT_CHAT_SCRIPT = `/***\nSample Script\n--- 단축어 예시 ---\n[채팅]\n빌동조건='/채팅'입력시발동\n동작=문단중간에 아래 기본형식 변형해 이미지 출력\n형식=\"![](https://svgm.invalid/chat?t={현재시간을HH:mm형태로}&m={캐릭터명,메시지내용,...})\"\n지침=[\n\"메시지는 캐릭터명,메시지내용 조합을 시간순으로 나열(예시:&m=John,Sick？,Me,No,John,Cool)\",\n\"특수문자는 항상 전각문자 사용\",\n\"공백=%20\",\n"{user}는 Me로 치환"\n]\n***/\n\nexport default {\n  async fetch(request, env) {\n    const url = new URL(request.url);\n    const raw = url.searchParams.get(\"m\") || url.searchParams.get(\"amp;m\") || \"\";\n    const time = url.searchParams.get(\"t\") || url.searchParams.get(\"amp;t\") || \"12:00\";\n    const name = url.searchParams.get(\"name\") || url.searchParams.get(\"amp;name\") || \"KakaoTalk\";\n\n    // 메시지 리스트 파싱\n    const parts = raw ? decodeURIComponent(raw).split(\",\") : [];\n    const messages = [];\n    for (let i = 0; i < parts.length; i += 2) {\n      if (parts[i] && parts[i+1]) {\n        messages.push({\n          sender: parts[i].trim(),\n          text: parts[i+1].trim()\n        });\n      }\n    }\n\n    if (messages.length === 0) {\n      messages.push({ sender: \"System\", text: \"표시할 대화 내용이 존재하지 않습니다.\" });\n    }\n\n    const width = 360;\n    const headerHeight = 50;\n    const padding = 15;\n    \n    let currentY = headerHeight + padding;\n    const renderedMessages = [];\n\n    messages.forEach((msg) => {\n      const isMe = msg.sender.toLowerCase() === 'me' || msg.sender === '나' || msg.sender === 'user';\n      const text = msg.text;\n\n      // 한글 1.8포인트, 영어 1포인트 기준으로 텍스트 래핑 계산\n      const maxLen = 14;\n      const lines = [];\n      let currentLine = \"\";\n      let charCount = 0;\n\n      for (let char of text) {\n        const isDouble = char.charCodeAt(0) > 255;\n        const weight = isDouble ? 1.8 : 1;\n        if (charCount + weight > maxLen) {\n          lines.push(currentLine);\n          currentLine = char;\n          charCount = weight;\n        } else {\n          currentLine += char;\n          charCount += weight;\n        }\n      }\n      if (currentLine) lines.push(currentLine);\n\n      const bubbleHeight = lines.length * 19 + 16;\n      const maxLineLen = Math.max(...lines.map(line => {\n        let len = 0;\n        for (let c of line) len += c.charCodeAt(0) > 255 ? 1.8 : 1;\n        return len;\n      }));\n      const bubbleWidth = Math.min(220, Math.max(40, maxLineLen * 11 + 22));\n\n      renderedMessages.push({\n        isMe,\n        sender: msg.sender,\n        lines,\n        bubbleWidth,\n        bubbleHeight,\n        y: currentY\n      });\n\n      currentY += bubbleHeight + 20;\n    });\n\n    const svgHeight = currentY + 15;\n\n    let messagesSvg = \"\";\n    renderedMessages.forEach((m) => {\n      if (m.isMe) {\n        const bubbleX = width - m.bubbleWidth - 15;\n        const textX = bubbleX + 11;\n        const bubbleY = m.y;\n        \n        let linesSvg = \"\";\n        m.lines.forEach((line, lineIdx) => {\n          linesSvg += \"<text x=\\\"\" + textX + \"\\\" y=\\\"\" + (bubbleY + 21 + lineIdx * 19) + \"\\\" fill=\\\"#000000\\\" font-family=\\\"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif\\\" font-size=\\\"12.5px\\\">\" + escXml(line) + \"</text>\";\n        });\n\n        messagesSvg += \"<g><text x=\\\"\" + (bubbleX - 6) + \"\\\" y=\\\"\" + (bubbleY + m.bubbleHeight - 4) + \"\\\" fill=\\\"#7F7F7F\\\" font-family=\\\"sans-serif\\\" font-size=\\\"9px\\\" text-anchor=\\\"end\\\">\" + escXml(time) + \"</text><rect x=\\\"\" + bubbleX + \"\\\" y=\\\"\" + bubbleY + \"\\\" width=\\\"\" + m.bubbleWidth + \"\\\" height=\\\"\" + m.bubbleHeight + \"\\\" rx=\\\"7\\\" fill=\\\"#FEE500\\\"/><polygon points=\\\"\" + (width - 15) + \",\" + (bubbleY + 8) + \" \" + (width - 8) + \",\" + (bubbleY + 12) + \" \" + (width - 15) + \",\" + (bubbleY + 16) + \"\\\" fill=\\\"#FEE500\\\"/>\" + linesSvg + \"</g>\";\n      } else {\n        const profileX = 15;\n        const profileSize = 32;\n        const bubbleX = profileX + profileSize + 10;\n        const textX = bubbleX + 11;\n        const senderY = m.y;\n        const bubbleY = senderY + 14;\n        \n        let linesSvg = \"\";\n        m.lines.forEach((line, lineIdx) => {\n          linesSvg += \"<text x=\\\"\" + textX + \"\\\" y=\\\"\" + (bubbleY + 21 + lineIdx * 19) + \"\\\" fill=\\\"#000000\\\" font-family=\\\"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif\\\" font-size=\\\"12.5px\\\">\" + escXml(line) + \"</text>\";\n        });\n\n        messagesSvg += \"<g><circle cx=\\\"\" + (profileX + profileSize/2) + \"\\\" cy=\\\"\" + (senderY + profileSize/2) + \"\\\" r=\\\"\" + (profileSize/2) + \"\\\" fill=\\\"#A3C1AD\\\"/><text x=\\\"\" + (profileX + profileSize/2) + \"\\\" y=\\\"\" + (senderY + profileSize/2 + 4.5) + \"\\\" fill=\\\"#FFFFFF\\\" font-family=\\\"sans-serif\\\" font-size=\\\"13px\\\" font-weight=\\\"bold\\\" text-anchor=\\\"middle\\\">\" + escXml(m.sender[0]) + \"</text><text x=\\\"\" + bubbleX + \"\\\" y=\\\"\" + (senderY + 9) + \"\\\" fill=\\\"#2C2C2C\\\" font-family=\\\"sans-serif\\\" font-size=\\\"10.5px\\\" font-weight=\\\"bold\\\">\" + escXml(m.sender) + \"</text><rect x=\\\"\" + bubbleX + \"\\\" y=\\\"\" + bubbleY + \"\\\" width=\\\"\" + m.bubbleWidth + \"\\\" height=\\\"\" + m.bubbleHeight + \"\\\" rx=\\\"7\\\" fill=\\\"#FFFFFF\\\"/><polygon points=\\\"\" + bubbleX + \",\" + (bubbleY + 8) + \" \" + (bubbleX - 7) + \",\" + (bubbleY + 12) + \" \" + (bubbleX) + \",\" + (bubbleY + 16) + \"\\\" fill=\\\"#FFFFFF\\\"/><text x=\\\"\" + (bubbleX + m.bubbleWidth + 6) + \"\\\" y=\\\"\" + (bubbleY + m.bubbleHeight - 4) + \"\\\" fill=\\\"#7F7F7F\\\" font-family=\\\"sans-serif\\\" font-size=\\\"9px\\\" text-anchor=\\\"start\\\">\" + escXml(time) + \"</text>\" + linesSvg + \"</g>\";\n      }\n    });\n\n    const svg = \"<svg xmlns=\\\"http://www.w3.org/2000/svg\\\" width=\\\"\" + width + \"\\\" height=\\\"\" + svgHeight + \"\\\" viewBox=\\\"0 0 \" + width + \" \" + svgHeight + \"\\\" style=\\\"background-color: #BACEE0; border-radius: 8px;\\\"><rect width=\\\"100%\\\" height=\\\"100%\\\" fill=\\\"#BACEE0\\\" rx=\\\"8\\\"/><rect width=\\\"\" + width + \"\\\" height=\\\"\" + headerHeight + \"\\\" fill=\\\"#BACEE0\\\"/><text x=\\\"18\\\" y=\\\"31\\\" font-family=\\\"sans-serif\\\" font-size=\\\"14.5px\\\" font-weight=\\\"bold\\\" fill=\\\"#1C1C1C\\\">\" + escXml(name) + \"</text><line x1=\\\"0\\\" y1=\\\"\" + headerHeight + \"\\\" x2=\\\"\" + width + \"\\\" y2=\\\"\" + headerHeight + \"\\\" stroke=\\\"#AFBFCD\\\" stroke-width=\\\"0.8\\\"/>\" + messagesSvg + \"</svg>\";\n\n    return new Response(svg, {\n      headers: {\n        \"Content-Type\": \"image/svg+xml; charset=utf-8\"\n      }\n    });\n  }\n};\n\nfunction escXml(s) {\n  return String(s).replace(/&/g, \"&amp;\").replace(/</g, \"&lt;\").replace(/>/g, \"&gt;\").replace(/\"/g, \"&quot;\");\n}\n`;

    // --- Tampermonkey 스토리지 관리 (GM_setValue, GM_getValue 기반) ---
    const GM_SCRIPTS_KEY = 'crack_svg_maker_scripts';
    const GM_BASE_URL_KEY = 'crack_svg_base_url';

    function getBaseUrl() {
        return GM_getValue(GM_BASE_URL_KEY, '') || '';
    }
    function saveBaseUrl(url) {
        GM_setValue(GM_BASE_URL_KEY, url.trim());
    }

    function getSavedScripts() {
        let data = GM_getValue(GM_SCRIPTS_KEY, null);
        if (!data) {
            const initial = {
                'chat': DEFAULT_CHAT_SCRIPT
            };
            GM_setValue(GM_SCRIPTS_KEY, JSON.stringify(initial));
            return initial;
        }
        try {
            const parsed = typeof data === 'string' ? JSON.parse(data) : data;
            if (!parsed.chat) {
                parsed.chat = DEFAULT_CHAT_SCRIPT;
                GM_setValue(GM_SCRIPTS_KEY, JSON.stringify(parsed));
            }
            return parsed;
        } catch (e) {
            const initial = {
                'chat': DEFAULT_CHAT_SCRIPT
            };
            GM_setValue(GM_SCRIPTS_KEY, JSON.stringify(initial));
            return initial;
        }
    }

    function saveScripts(scripts) {
        if (!scripts.chat) {
            scripts.chat = DEFAULT_CHAT_SCRIPT;
        }
        GM_setValue(GM_SCRIPTS_KEY, JSON.stringify(scripts));
    }

    function escapeXml(s) {
        return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    }

    async function runUserScript(scriptCode, fakeUrlStr) {
        try {
            const kvStore = new Map();
            const env = {
                KV: {
                    async get(key) {
                        return kvStore.get(key) ?? null;
                    },
                    async put(key, value) {
                        kvStore.set(key, value);
                    }
                },
                AVATARS: {
                    async get(filePath) {
                        const baseUrl = getBaseUrl();
                        const url = baseUrl.replace(/\/$/, "") + "/" + filePath.replace(/^\//, "");
                        try {
                            return new Promise((resolve) => {
                                GM_xmlhttpRequest({
                                    method: "GET",
                                    url: url,
                                    responseType: "arraybuffer",
                                    onload: function (response) {
                                        if (response.status != 200) {
                                            resolve(null);
                                        }
                                        else {
                                            var buffer = null;
                                            const data = response.response || response.responseText;
                                            if (data instanceof ArrayBuffer) {
                                                buffer = data;
                                            } else {
                                                const bytes = new Uint8Array(data.length);
                                                for (let i = 0; i < data.length; i++) {
                                                    bytes[i] = data.charCodeAt(i) & 0xff;
                                                }
                                                buffer = bytes.buffer;
                                            }
                                            resolve({
                                                async arrayBuffer() {
                                                    return buffer;
                                                }
                                            });
                                        }
                                    },
                                    onerror: function (error) {
                                        resolve(null);
                                    }
                                });
                            });
                        } catch(e) {
                            return null;
                        }
                    }
                }
            };

            let processed = scriptCode;
            processed = processed.replace(/export\s+default\s+/, "return ");

            const getModule = new Function(processed);
            const moduleInstance = getModule();

            if (moduleInstance && typeof moduleInstance.fetch === 'function') {
                const fakeRequest = {
                    url: fakeUrlStr
                };
                
                const response = await moduleInstance.fetch(fakeRequest, env);
                
                let svgContent = "";
                if (response instanceof Response) {
                    svgContent = await response.text();
                } else if (response && typeof response.text === 'function') {
                    svgContent = await response.text();
                } else if (typeof response === 'string') {
                    svgContent = response;
                } else {
                    svgContent = String(response);
                }
                return svgContent;
            } else {
                throw new Error("스크립트에 'export default { async fetch(request, env) { ... } }' 구조가 정의되어 있지 않습니다.");
            }
        } catch (error) {
            console.error("유저 스크립트 실행에 실패했습니다:", error);
            return `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="80">` +
              `<rect width="100%" height="100%" fill="#FFF5F5" rx="5" stroke="#FEB2B2" stroke-width="1"/>` +
              `<text x="180" y="35" text-anchor="middle" font-family="sans-serif" font-size="11.5px" font-weight="bold" fill="#E53E3E">스크립트 실행 에러</text>` +
              `<text x="180" y="55" text-anchor="middle" font-family="monospace" font-size="10px" fill="#718096">${escapeXml(error.message.substring(0, 48))}</text>` +
            `</svg>`;
        }
    }

    async function replaceAllSvgmImages() {
        const imgs = document.querySelectorAll('img[src*="svgm.invalid"]:not([data-svg-replaced])');
        if (imgs.length === 0) return;

        const scripts = getSavedScripts();

        for (const img of imgs) {
            img.setAttribute('data-svg-replaced', 'pending');
            const originalSrc = img.getAttribute('src');

            try {
                let cleanSrc = originalSrc;
                if (!cleanSrc.startsWith('http://') && !cleanSrc.startsWith('https://')) {
                    cleanSrc = 'https://' + cleanSrc;
                }

                const parsedUrl = new URL(cleanSrc);
                if (!parsedUrl.host.includes('svgm.invalid')) {
                    img.removeAttribute('data-svg-replaced');
                    continue;
                }

                // 한글 식별자 매칭을 위해 디코딩 처리 수행
                const decodedPathname = decodeURIComponent(parsedUrl.pathname);
                const paths = decodedPathname.split('/').filter(p => p.trim() !== "");
                const scriptName = paths[0];

                if (!scriptName) {
                    img.setAttribute('data-svg-replaced', 'failed_no_script_name');
                    continue;
                }

                const code = scripts[scriptName];
                if (!code) {
                    console.warn(`[크랙 SVG 생성기] 등록된 스크립트 중 '${scriptName}' 을 찾을 수 없습니다. (URL: ${cleanSrc})`);
                    img.setAttribute('data-svg-replaced', 'failed_script_not_found');
                    continue;
                }

                const svgText = await runUserScript(code, cleanSrc);

                const base64Data = btoa(unescape(encodeURIComponent(svgText)));
                const dataUrl = `data:image/svg+xml;base64,${base64Data}`;

                img.setAttribute('src', dataUrl);
                img.setAttribute('data-svg-replaced', 'true');
                
                img.onload = () => {
                   img.style.display = "block";
                };

            } catch (err) {
                console.error("[크랙 SVG 생성기] 이미지 변환 중 치명적 예외:", err);
                img.setAttribute('data-svg-replaced', 'failed_error');
            }
        }
    }

    const popupStyles = `
        .crack-svg-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0 14px;
            height: 34px;
            border-radius: 20px;
            background: linear-gradient(135deg, #FF6B81, #FF4757) !important;
            color: white !important;
            font-weight: 700;
            font-size: 13px;
            border: none;
            cursor: pointer;
            box-shadow: 0 3px 10px rgba(255, 71, 87, 0.4);
            margin-right: 8px;
            transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .crack-svg-button:hover {
            transform: scale(1.05);
            background: linear-gradient(135deg, #FF4757, #FF2E44) !important;
            box-shadow: 0 4px 14px rgba(255, 71, 87, 0.6);
        }

        #crack-svg-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.65);
            z-index: 1000000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            backdrop-filter: blur(4px);
        }

        #crack-svg-modal {
            background: #1E1E24;
            color: #E2E8F0;
            width: 95vw;
            height: 85vh;
            max-width: 1200px;
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            border: 1px solid #2F2F38;
        }

        .crack-svg-hdr {
            padding: 16px 24px;
            background: #141418;
            border-bottom: 1px solid #2F2F38;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .crack-svg-hdr h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 800;
            letter-spacing: -0.02em;
            background: linear-gradient(to right, #FF6B81, #FFA502);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .crack-svg-header-left {
            display: flex;
            align-items: center;
            gap: 14px;
            min-width: 0;
        }
        .crack-svg-baseurl-input {
            width: 420px;
            max-width: 45vw;
            background: #0E0E11;
            border: 1px solid #2F2F38;
            border-radius: 8px;
            color: #E2E8F0;
            padding: 8px 12px;
            font-size: 12px;
            outline: none;
            transition: border-color 0.15s;
        }
        .crack-svg-baseurl-input:focus {
            border-color: #FF4757;
        }
        .crack-svg-close {
            background: none;
            border: none;
            color: #A0AEC0;
            font-size: 24px;
            font-weight: bold;
            cursor: pointer;
            transition: color 0.15s;
        }
        .crack-svg-close:hover {
            color: #FFF;
        }

        .crack-svg-body {
            flex: 1;
            display: flex;
            overflow: hidden;
            background: #17171C;
        }

        .crack-svg-sidebar {
            width: 250px;
            background: #141418;
            border-right: 1px solid #2F2F38;
            display: flex;
            flex-direction: column;
            padding: 16px;
            gap: 12px;
            overflow-y: auto;
        }
        .sidebar-title {
            font-size: 12px;
            font-weight: 700;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
        }
        .tab-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
            flex: 1;
        }
        .tab-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            border-radius: 8px;
            background: #1E1E24;
            cursor: pointer;
            font-size: 13.5px;
            font-weight: 600;
            color: #A0AEC0;
            border: 1px solid transparent;
            transition: all 0.15s;
        }
        .tab-item:hover {
            background: #25252D;
            color: #FFF;
        }
        .tab-item.active {
            background: rgba(255, 71, 87, 0.12);
            color: #FF5263;
            border-color: rgba(255, 71, 87, 0.3);
        }
        .tab-delete-btn {
            background: none;
            border: none;
            color: #718096;
            cursor: pointer;
            font-size: 14px;
            padding: 2px 6px;
            border-radius: 4px;
            transition: all 0.15s;
        }
        .tab-delete-btn:hover {
            background: #EA2027;
            color: white;
        }

        .sidebar-add-btn {
            padding: 10px;
            border-radius: 8px;
            border: 1.5px dashed #2F2F38;
            background: transparent;
            color: #A0AEC0;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: all 0.15s;
        }
        .sidebar-add-btn:hover {
            border-color: #FF4757;
            color: #FF4757;
            background: rgba(255, 71, 87, 0.03);
        }

        .crack-svg-content {
            flex: 1;
            display: flex;
            padding: 20px;
            gap: 20px;
            overflow: hidden;
        }

        .editor-container {
            flex: 1.2;
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-width: 0;
        }
        .editor-title-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .editor-label {
            font-size: 12px;
            font-weight: 700;
            color: #A0AEC0;
        }
        .editor-title-input {
            background: #141418;
            border: 1px solid #2F2F38;
            border-radius: 6px;
            color: #FFF;
            padding: 6px 12px;
            font-size: 13px;
            font-weight: 700;
            flex: 1;
            outline: none;
            transition: border-color 0.15s;
        }
        .editor-title-input:focus {
            border-color: #FF4757;
        }
        .editor-title-input:disabled {
            color: #718096;
            background: #121215;
            border-color: #1A1A22;
            cursor: not-allowed;
        }

        .textarea-wrapper {
            flex: 1;
            border: 1px solid #2F2F38;
            border-radius: 8px;
            overflow: hidden;
            background: #0E0E11;
        }
        .script-textarea {
            width: 100%;
            height: 100%;
            background: transparent;
            border: none;
            resize: none;
            font-family: "Fira Code", "Consolas", "JetBrains Mono", monospace;
            font-size: 13px;
            line-height: 1.6;
            color: #C5C6C7;
            padding: 16px;
            outline: none;
            box-sizing: border-box;
            tab-size: 4;
        }

        .preview-container {
            flex: 0.8;
            display: flex;
            flex-direction: column;
            gap: 12px;
            min-width: 0;
            border-left: 1px solid #2F2F38;
            padding-left: 20px;
        }
        .preview-label-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .preview-label {
            font-size: 13px;
            font-weight: 700;
            color: #A0AEC0;
        }
        .preview-status {
            font-size: 11px;
            font-weight: bold;
            color: #2ED573;
        }
        .preview-box {
            flex: 1;
            background: #141418;
            border: 1px solid #2F2F38;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: auto;
            position: relative;
            padding: 10px;
        }
        .preview-box svg {
            max-width: 100%;
            max-height: 100%;
        }

        .test-param-wrapper {
            background: #141418;
            border: 1px solid #2F2F38;
            border-radius: 8px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .test-param-title {
            font-size: 11.5px;
            font-weight: 700;
            color: #718096;
            text-transform: uppercase;
        }
        .test-input-row {
            display: flex;
            gap: 8px;
        }
        .test-param-input {
            flex: 1;
            background: #0E0E11;
            border: 1px solid #2F2F38;
            border-radius: 6px;
            color: #E2E8F0;
            padding: 8px 12px;
            font-size: 12.5px;
            font-family: monospace;
            outline: none;
        }
        .test-param-input:focus {
            border-color: #FFA502;
        }
        .test-run-btn {
            background: #FFA502;
            color: #1E1E24;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            font-size: 12.5px;
            font-weight: 800;
            cursor: pointer;
            transition: background 0.15s;
            white-space: nowrap;
        }
        .test-run-btn:hover {
            background: #FF7F50;
        }

        .crack-svg-ftr {
            padding: 14px 24px;
            background: #141418;
            border-top: 1px solid #2F2F38;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .help-url {
            font-size: 12px;
            color: #718096;
            text-decoration: none;
        }
        .help-url:hover {
            color: #A0AEC0;
            text-decoration: underline;
        }
        .ftr-btn-row {
            display: flex;
            gap: 10px;
        }
        .crack-svg-btn {
            padding: 8px 18px;
            border-radius: 6px;
            font-size: 13.5px;
            font-weight: 700;
            cursor: pointer;
            border: 1px solid #2F2F38;
            background: #1E1E24;
            color: #E2E8F0;
            transition: all 0.15s;
        }
        .crack-svg-btn:hover {
            background: #25252D;
            border-color: #4A4A5A;
        }
        .crack-svg-btn-primary {
            background: #FF4757;
            color: white;
            border-color: #FF4757;
        }
        .crack-svg-btn-primary:hover {
            background: #FF2E44;
            border-color: #FF2E44;
        }
    `;

    function injectGlobalStyles() {
        if (document.getElementById('crack-svg-embedded-css')) return;
        const style = document.createElement('style');
        style.id = 'crack-svg-embedded-css';
        style.textContent = popupStyles;
        document.head.appendChild(style);
    }

    let activeTabId = 'chat';
    let localScripts = {};

    function showModelPopup() {
        injectGlobalStyles();
        if (document.getElementById('crack-svg-modal-overlay')) return;

        localScripts = getSavedScripts();

        const overlay = document.createElement('div');
        overlay.id = 'crack-svg-modal-overlay';
        overlay.innerHTML = `<div id="crack-svg-modal">` +
            `<div class="crack-svg-hdr">` +
                `<div class="crack-svg-header-left">` +
                    `<h2>🔥 크랙 SVG 이미지 생성기</h2>` +
                    `<input type="text" class="crack-svg-baseurl-input" id="crack-base-url-input" placeholder="IMAGE URL 입력"/>` +
                `</div>` +
                `<button class="crack-svg-close">&times;</button>` +
            `</div>` +
            `<div class="crack-svg-body">` +
                `<div class="crack-svg-sidebar">` +
                    `<div class="sidebar-title">스크립트 목록 (식별자)</div>` +
                    `<div class="tab-list" id="crack-tab-list-container"></div>` +
                    `<button class="sidebar-add-btn" id="crack-sidebar-add-btn">+ 스크립트 추가</button>` +
                `</div>` +
                `<div class="crack-svg-content">` +
                    `<div class="editor-container">` +
                        `<div class="editor-title-row">` +
                            `<span class="editor-label">식별자 이름</span>` +
                            `<input type="text" class="editor-title-input" id="crack-script-name-input" placeholder="영어 소문자, 숫자, 한글 가능 (예: chat, 채팅)"/>` +
                        `</div>` +
                        `<div class="textarea-wrapper">` +
                            `<textarea class="script-textarea" id="crack-script-editor-textarea" spellcheck="false" placeholder="export default {\\n  async fetch(request, env) {\\n    return new Response('...');\\n  }\\n};\"></textarea>` +
                        `</div>` +
                    `</div>` +
                    `<div class="preview-container">` +
                        `<div class="preview-label-row">` +
                            `<span class="preview-label">실시간 랜더 미리보기</span>` +
                            `<span class="preview-status" id="crack-preview-status-indicator">● 대기 중</span>` +
                        `</div>` +
                        `<div class="preview-box" id="crack-svg-render-preview-box">` +
                            `<span style="color: #4A4A5A; font-size: 13px;">테스트 실행을 눌러 SVG를 확인하세요</span>` +
                        `</div>` +
                        `<div class="test-param-wrapper">` +
                            `<div class="test-param-title">런타임 시뮬레이션 파라미터</div>` +
                            `<div class="test-input-row">` +
                                `<input type="text" class="test-param-input" id="crack-test-param-input" placeholder="?t=12:35&m=John,Hello,Me,Hi!"/>` +
                                `<button class="test-run-btn" id="crack-test-run-btn">테스트 실행</button>` +
                            `</div>` +
                        `</div>` +
                    `</div>` +
                `</div>` +
            `</div>` +
            `<div class="crack-svg-ftr">` +
                `<div class="help-url">호스트 주소: http://svgm.invalid/{식별자}?파라미터목록</div>` +
                `<div class="ftr-btn-row">` +
                    `<button class="crack-svg-btn" id="crack-modal-close-btn">닫기</button>` +
                `</div>` +
            `</div>` +
        `</div>`;

        document.body.appendChild(overlay);

        overlay.querySelector('.crack-svg-close').onclick = removeHtmlModal;
        overlay.querySelector('#crack-modal-close-btn').onclick = removeHtmlModal;
        overlay.querySelector('#crack-sidebar-add-btn').onclick = addNewScriptTab;
        overlay.querySelector('#crack-test-run-btn').onclick = runCurrentTestRender;

        const baseUrlInput = overlay.querySelector('#crack-base-url-input');
        const nameInput = overlay.querySelector('#crack-script-name-input');
        const editorTextarea = overlay.querySelector('#crack-script-editor-textarea');

        baseUrlInput.value = getBaseUrl();
        baseUrlInput.oninput = () => {
            saveBaseUrl(baseUrlInput.value);
        };

        // 한글 입력 중 자음/모음이 분리되거나 중간 제거되는 것을 막기 위해 'change' 혹은 'blur' 시점에 필터링 적용 제어
        nameInput.onchange = (e) => {
            let val = nameInput.value.trim().replace(/[^a-z0-9ㄱ-ㅎㅏ-ㅣ가-힣]/g, '');
            nameInput.value = val;

            if (val && val !== activeTabId) {
                if (localScripts[val]) {
                    alert('이미 존재하는 식별자 이름입니다.');
                    nameInput.value = activeTabId;
                    return;
                }
                const oldVal = activeTabId;
                localScripts[val] = localScripts[oldVal];
                delete localScripts[oldVal];
                activeTabId = val;
                saveScripts(localScripts);
                renderTabList();
            }
        };

        editorTextarea.oninput = () => {
            localScripts[activeTabId] = editorTextarea.value;
            saveScripts(localScripts);
        };

        renderTabList();
        selectTab(activeTabId);

        overlay.querySelector('#crack-test-param-input').value = "?t=09:40&m=John,안녕!,Me,반가워!,John,오늘%20뭐해？,Me,새%20스크립트%20짜는중!&name=kakao";
    }

    function removeHtmlModal() {
        const overlay = document.getElementById('crack-svg-modal-overlay');
        if (overlay) overlay.remove();
        replaceAllSvgmImages();
    }

    function renderTabList() {
        const container = document.getElementById('crack-tab-list-container');
        if (!container) return;

        container.innerHTML = '';
        const scripts = getSavedScripts();

        Object.keys(scripts).forEach(key => {
            const isProtected = key === 'chat';

            const item = document.createElement('div');
            item.className = `tab-item ${key === activeTabId ? 'active' : ''}`;
            item.setAttribute('data-tab-id', key);
            item.innerHTML = `<span>` + escapeXml(key) + `</span>` +
                (isProtected ? '' : `<button class="tab-delete-btn" data-delete-id="${key}">&times;</button>`);

            item.onclick = (e) => {
                if (e.target.classList.contains('tab-delete-btn')) {
                    e.stopPropagation();
                    const targetId = e.target.getAttribute('data-delete-id');
                    if (confirm(`정말로 스크립트 식별자 '${targetId}' 를 삭제하시겠습니까?`)) {
                        delete localScripts[targetId];
                        saveScripts(localScripts);
                        activeTabId = 'chat';
                        renderTabList();
                        selectTab('chat');
                    }
                    return;
                }
                selectTab(key);
            };

            container.appendChild(item);
        });
    }

    function selectTab(id) {
        activeTabId = id;
        const container = document.getElementById('crack-tab-list-container');
        if (!container) return;

        container.querySelectorAll('.tab-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-tab-id') === id) {
                item.classList.add('active');
            }
        });

        const scripts = getSavedScripts();
        const code = scripts[id] || '';

        const nameInput = document.getElementById('crack-script-name-input');
        const editorTextarea = document.getElementById('crack-script-editor-textarea');

        nameInput.value = id;
        editorTextarea.value = code;

        if (id === 'chat') {
            nameInput.disabled = true;
        } else {
            nameInput.disabled = false;
        }

        const previewBox = document.getElementById('crack-svg-render-preview-box');
        if (previewBox) {
            previewBox.innerHTML = '<span style="color: #4A4A5A; font-size: 13px;">테스트 실행을 눌러 SVG를 확인하세요</span>';
        }
        const status = document.getElementById('crack-preview-status-indicator');
        if (status) {
            status.textContent = '● 대기 중';
            status.style.color = '#FFA502';
        }
    }

    function addNewScriptTab() {
        const scripts = getSavedScripts();
        
        let newName = '커스텀';
        let cursor = 1;
        while (scripts[newName + cursor]) {
            cursor++;
        }
        const finalName = newName + cursor;

        const template = `export default {\n` +
  `  async fetch(request, env) {\n` +
  `    const url = new URL(request.url);\n` +
  `    const paramVal = url.searchParams.get("val") || "안녕하세요!";\n\n` +
  `    const svg = \\\`<svg xmlns=\\\"http://www.w3.org/2000/svg\\\" width=\\\"300\\\" height=\\\"200\\\" style=\\\"background-color: #1E1E24; border-radius: 10px;\\\">\n` +
  `      <rect width=\\\"100%\\\" height=\\\"100%\\\" fill=\\\"#1E1E24\\\" rx=\\\"10\\\"/>\n` +
  `      <circle cx=\\\"150\\\" cy=\\\"80\\\" r=\\\"40\\\" fill=\\\"#FFA502\\\"/>\n` +
  `      <text x=\\\"150\\\" y=\\\"150\\\" text-anchor=\\\"middle\\\" font-family=\\\"sans-serif\\\" font-size=\\\"16px\\\" fill=\\\"#FFFFFF\\\" font-weight=\\\"bold\\\">\\\\\\\${paramVal}</text>\n` +
  `    </svg>\\\`;\n\n` +
  `    return new Response(svg, {\n` +
  `      headers: {\n` +
  `        "Content-Type": "image/svg+xml; charset=utf-8"\n` +
  `      }\n` +
  `    });\n` +
  `  }\n` +
  `};`;

        scripts[finalName] = template;
        saveScripts(scripts);
        localScripts = scripts;

        activeTabId = finalName;
        renderTabList();
        selectTab(finalName);
    }

    async function runCurrentTestRender() {
        const editorTextarea = document.getElementById('crack-script-editor-textarea');
        const paramInput = document.getElementById('crack-test-param-input');
        const previewBox = document.getElementById('crack-svg-render-preview-box');
        const status = document.getElementById('crack-preview-status-indicator');

        if (!editorTextarea || !previewBox || !status) return;

        status.textContent = '● 렌더링 중...';
        status.style.color = '#FFA502';

        const rawParams = paramInput.value.trim();
        const fakeUrl = `http://svgm.invalid/${activeTabId}${rawParams}`;

        const codeVal = editorTextarea.value;
        const svgContent = await runUserScript(codeVal, fakeUrl);

        previewBox.innerHTML = svgContent;
        status.textContent = '● 렌더링 요청 성공';
        status.style.color = '#2ED573';
    }

    function injectSvgToolButton() {
        const headerContainer = document.querySelector('.absolute.z-\\[5\\] .flex.gap-3.items-center');
        if (!headerContainer || headerContainer.querySelector('.crack-svg-button')) return;

        const svgBtn = document.createElement('button');
        svgBtn.className = 'crack-svg-button';
        svgBtn.type = 'button';
        svgBtn.innerHTML = '🎨 SVG';
        svgBtn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            showModelPopup();
        };

        headerContainer.prepend(svgBtn);
    }

    function bootstrap() {
        injectGlobalStyles();

        const domObserver = new MutationObserver(() => {
            requestAnimationFrame(() => {
                injectSvgToolButton();
                replaceAllSvgmImages();
            });
        });
        domObserver.observe(document.body, { childList: true, subtree: true });

        setInterval(() => {
            injectSvgToolButton();
            replaceAllSvgmImages();
        }, 800);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();
