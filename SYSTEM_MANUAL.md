# Senior Care Monitor 2026 - System Manual

## 1. 개요 (Overview)
**Senior Care Monitor 2026**은 노인맞춤돌봄서비스의 효율화를 위해 설계된 통합 모니터링 시스템입니다. 유선 상담, 현장 방문, 온라인 설문, 심층 인터뷰 등 다양한 채널을 통해 수집된 데이터를 통합 관리하고, **IPA(Importance-Performance Analysis)** 및 **가설 검증(Hypothesis Verification)** 모델을 통해 데이터 기반의 의사결정을 지원합니다.

---

## 2. 시스템 아키텍처 (Architecture)
본 시스템은 다음과 같은 기술 스택으로 구성되어 있습니다.

*   **Frontend**: React (Vite), TypeScript
*   **Styling**: Tailwind CSS
*   **State Management**: React Context / Local Compound State
*   **Data Storage**: Google Sheets (via Google Apps Script)
*   **Deployment**: Static Hosting (GitHub Pages / Vercel compatible)

---

## 3. 핵심 기능 (Core Features)

### 3.1. 유선 모니터링 (Phone Monitoring)
*   **목적**: 매월 정기적인 안부 확인 및 기초 상태 점검.
*   **기능**:
    *   대상자 통화 기록 로드 및 상태 입력.
    *   **주요 제공 서비스** 체크박스를 통한 서비스 현황 파악 (안전지원, 사회참여, 생활교육 등).
    *   **위험 감지 시그널**: 통화 내용 중 '불안', '고립', '식사 거부' 등의 키워드가 감지되면 자동으로 '1차 대면(현장 점검)' 대상자로 등록 권고.
    *   **시뮬레이션**: 데모 모드에서 가상의 통화 기록 30건을 생성하여 시나리오 테스트 가능.

### 3.2. 1차 대면: 현장 리스크 점검 (Visit Mode - Risk Screening)
*   **목적**: 유선 상담에서 위험이 감지된 대상자를 직접 방문하여 주거 및 신체 상태를 정밀 진단.
*   **기능**:
    *   **환경 스크리닝**: 위생(악취, 음식 부패) 및 주거 안전(미끄럼, 문턱) 체크리스트.
    *   **자동 판정 알고리즘**: 입력된 위험 요인과 10대 정밀 지표를 종합 분석하여 '일반관리', '주의', '위기' 등급을 자동 산출.
    *   **자동 조치 권고**: 판정 등급에 따라 필요한 조치사항(푸드뱅크 연계, 안전바 설치 등)이 포함된 리포트 자동 생성.
    *   **가설 수립(Hypothesis Generation)**: 현장 인터뷰 내용(`STEP 1` 탐색 질문)을 바탕으로 서비스 효과성에 대한 가설("말벗 서비스는 우울감을 낮출 것이다")을 수립하여 온라인 설문 검증 단계로 이관.

### 3.3. 온라인 설문 & IPA 분석 (Online Survey & Analysis)
*   **목적**: 대규모 정량 데이터를 통해 서비스 만족도 및 가설 검증.
*   **기능**:
    *   **IPA 리포트**: 중요도(Priority)와 만족도(Performance)를 교차 분석하여 '중점 개선 영역', '유지 강화 영역', '미충족 욕구(Gap)'를 도출.
    *   **가설 검증**: 1차 대면에서 수립된 가설이 통계적으로 유의미한지 확인(지지/기각).
    *   **데이터 일괄 처리**: CSV 파일 업로드 기능을 통해 대량의 설문 데이터를 한 번에 처리하고 분석 대시보드에 반영.

### 3.4. 2차 대면: 심층 인터뷰 (In-depth Interview)
*   **목적**: 데이터 불일치 사례나 우수 사례에 대한 질적 연구.
*   **기능**:
    *   **대상자 선정**: 온라인 설문 결과와 실제 데이터가 다른 경우(데이터 불일치군) 또는 성과가 매우 우수한 경우(성과 우수군) 등을 자동 필터링.
    *   **인터뷰 가이드**: 대상자 유형별 맞춤형 질문지(Q1~Q10) 제공. (예: 데이터 불일치군에게는 "설문 점수와 실제 생활의 차이"를 묻는 질문 제시)
    *   **종합 리포트**: 변화 추적(Before/After) 및 인터뷰어 소견 작성.

### 3.5. 수행기관 답변관리 (Agency Response)
*   **목적**: 시군구 수행기관의 피드백 수집 및 데이터 동기화.
*   **기능**: 구글 시트와 연동하여 실시간 데이터 현황을 확인하고 관리.

---

## 4. 데이터 흐름 (Data Flow)
1.  **유선 모니터링** -> (위험 감지) -> **1차 대면 리스트**
2.  **1차 대면 점검** -> (가설 수립) -> **온라인 설문 가설 목록**
3.  **온라인 설문 결과** -> (특이사항 발견) -> **2차 심층 인터뷰 대상자**
4.  **최종 결과**: 구글 시트(`sendToGoogleSheet`)로 전송되어 영구 저장.

---

## 5. 설치 및 실행 (Setup & Run)
1.  **의존성 설치**:
    ```bash
    npm install
    ```
2.  **개발 서버 실행**:
    ```bash
    npm run dev
    ```
3.  **구글 시트 연동**:
    *   `docs/google-sheets-setup.md` 문서를 참고하여 Apps Script를 배포.
    *   앱 우측 상단 '설정' 버튼을 눌러 배포된 Web App URL을 입력.

---

## 6. 버전 관리 (Version Control)
*   **Repository**: GitHub (Shinyongki/senior-care-monitor-2026)
*   **Workflow**:
    *   Feature Branch 작업 -> PR -> Main Merge
    *   주요 변경 사항 발생 시 `constants.ts` 및 `types.ts` 의존성 확인 필수.

---
**작성일**: 2026-01-18
**작성자**: Antigravity Agent
