# Senior Care Monitor 2026 - 상세 시스템 명세서 (Detailed Specification)

> **문서 버전**: 2.0 (상급자 보고용)  
> **작성 일자**: 2026-02-04  
> **작성 시스템**: Antigravity Agent  

---

## 1. 개요 및 목적 (Overview & Purpose)

### 1.1. 시스템 개요
**Senior Care Monitor 2026**은 기존의 단순 안부 확인 방식을 넘어, **데이터 기반의 입체적 돌봄 모니터링**을 수행하기 위해 개발된 통합 관리 시스템입니다. 본 시스템은 유선, 대면, 온라인, 심층 인터뷰라는 4단계 다층적(Multi-layered) 모니터링 체계를 갖추고 있으며, 수집된 데이터를 실시간으로 분석하여 **위험군 조기 발견** 및 **맞춤형 서비스 제공**을 지원합니다.

### 1.2. 도입 목적 및 기대 효과
*   **사각지대 해소**: 정량적 지표와 정성적 상담 로그를 결합하여 숨겨진 위기 가구 발굴.
*   **업무 표준화**: 주관적 판단에 의존하던 상담 업무를 표준화된 체크리스트와 자동 판정 로직으로 체계화.
*   **데이터 기반 정책 수립**: IPA(Importance-Performance Analysis) 기법과 가설 검증 모델을 통해 서비스 효과성을 객관적으로 입증하고 증거 기반(Evidence-based) 정책 제언 도출.

---

## 2. 시스템 아키텍처 (System Architecture)

### 2.1. 기술 스택 (Tech Stack)
*   **Core Framework**: React 19 (Vite 기반), TypeScript 5.8
*   **UI/UX**: Tailwind CSS (유체형 디자인 시스템 적용), Lucide React (아이콘)
*   **State Management**: React Context API & Local State (경량화 아키텍처)
*   **Data Processing**: Client-side Simulation Engine (로컬 데이터 시뮬레이션 및 검증 로직 내장)
*   **Backend Interface**: Google Apps Script (Serverless), REST API Protocol
*   **Database**: Google Sheets (실시간 데이터 동기화 및 영구 저장)

### 2.2. 데이터 파이프라인 (Data Pipeline)
본 시스템은 다음과 같은 순환형 데이터 구조를 가집니다.

1.  **Generation (생성)**: 유선 모니터링을 통한 1차 기초 데이터 생성.
2.  **Detection (감지)**: 위험 키워드 및 패턴 분석을 통한 '현장 점검 대상' 자동 필터링.
3.  **Validation (검증)**: 현장 방문을 통한 상태 검증 및 '효과성 가설' 수립.
4.  **Verification (확증)**: 대규모 온라인 설문을 통한 가설 검증 및 '심층 면접 대상' 추출.
5.  **Synchronization (동기화)**: Google Sheets API를 통한 중앙 데이터베이스 저장.

---

## 3. 핵심 데이터 모델링 (Core Data Verification)

시스템 내에서 관리되는 주요 데이터 엔티티의 명세입니다.

### 3.1. 모니터링 모드 (MonitoringMode)
*   `유선(매월)`: 정기 안부 확인 및 기초 스크리닝.
*   `1차 대면`: 위험군 대상 주거/신체 정밀 점검.
*   `온라인설문`: 대규모 만족도 및 IPA 조사.
*   `2차 대면`: 데이터 불일치 및 우수 사례 심층 인터뷰.
*   `답변관리`: 수행기관 피드백 연동.

### 3.2. 서비스 유형 (ServiceType)
*   `일반 서비스`: 안전지원, 사회참여 등 표준 서비스.
*   `퇴원환자 단기 집중`: 병원 퇴원 후 3개월 내 집중 건강 관리.
*   `특화서비스`: 우울/은둔형 독거노인 대상 심리 정서 지원.

---

## 4. 모듈별 상세 기능 및 로직 명세 (Module Specification)

각 모니터링 단계는 독립적인 비즈니스 로직과 자동화된 알고리즘을 포함하고 있습니다.

### 4.1. 유선 모니터링 (Phone Mode)
유선 상담 내용을 기록하고, 텍스트 분석을 통해 위험군을 1차적으로 선별합니다.

*   **주요 기능**:
    *   통화 상태(완료/부재/거부) 기록.
    *   제공 서비스(안전, 사회, 교육 등) 다중 선택 관리.
    *   **위험군 자동 감지 알고리즘 (Risk Detection Logic)**:
        *   다음 조건 중 하나 이상 충족 시 `RiskTarget`(1차 대면 대상)으로 자동 플래그 처리:
            1.  **만족도 저하**: 서비스 만족도가 '불만족'인 경우.
            2.  **특이 동향**: `safety_trend` 필드에 6자 이상의 구체적 위험 징후가 기록된 경우.
            3.  **위험 키워드 매칭**: 지표(Indicator) 선택값에 `'불안'`, `'고립'`, `'어려움'`, `'거부'`, `'발견'`, `'불만족'` 문자열이 포함된 경우.
    *   **결과 처리**: 감지된 위험 요인을 `riskDetails` 필드에 자동 요약하여 1차 대면 모듈로 이관.

### 4.2. 1차 대면: 현장 리스크 점검 (Visit Mode)
선별된 위험군을 방문하여 10대 정밀 지표와 환경 체크리스트를 기반으로 위급도를 판정합니다.

*   **진단 항목**:
    *   **환경/위생 리스크**: 의복/위생 불량, 악취, 부패 음식, 식재료 부족 등.
    *   **주거 안전 리스크**: 미끄럼 위험, 문턱, 조명 불량, 비상연락 부재 등.
    *   **신체 기능**: 자유로운 보행 가능 / 보조 필요 / 거동 불가.
*   **자동 등급 판정 알고리즘 (Auto-Grading Logic)**:
    시스템은 입력된 데이터를 실시간 분석하여 다음 수식에 따라 위험 점수(`Score`)를 산출합니다.
    *   `Base Score` = (체크된 환경/안전 항목 개수)
    *   `Indicator Score`:
        *   **CRITICAL**(위기) 키워드(`위기`, `위험`, `심각`, `단절`, `거부`, `공포` 등): 개당 **+2점**
        *   **WARNING**(주의) 키워드(`주의`, `미흡`, `갈등`, `고립`, `불안` 등): 개당 **+1점**
    *   **등급 판정 기준**:
        *   **🚨 위기 (Danger)**: `Score` ≥ 4 OR `Critical Count` > 0 OR `거동 불가`
        *   **⚠️ 주의 (Caution)**: `Score` ≥ 2 OR `Warning Count` > 0
        *   **✨ 우수 (Best Practice)**: `표준 지표` 5개 이상 충족 AND `Score` == 0
        *   **일반 (Normal)**: 상기 해당 사항 없음.
*   **조치 권고 리포트 (Action Report)**: 판정된 등급과 식별된 리스크 유형(영양, 주거, 정서 등)에 맞춰 맞춤형 조치 사항(푸드뱅크 연계, 안전바 설치 등)을 자동 생성합니다.

### 4.3. 온라인 설문 및 효과성 검증 (Online Mode)
대규모 정량 데이터를 통해 서비스의 효과성을 통계적으로 검증하고 정책 제언을 도출합니다.

*   **IPA (Importance-Performance Analysis) 분석**:
    *   **우선순위(Q14)**와 **만족도**를 교차 분석하여 정책 방향 도출.
    *   **집중 개선 영역**: 중요도는 높으나 만족도가 낮은 항목 (예: 야간 응급 대응).
    *   **유지 강화 영역**: 중요도와 만족도가 모두 높은 항목 (예: 말벗 서비스).
    *   **미충족 욕구(Gap) 감지**: 정량 평가 외에 서술형(Q15) 응답에서 구체적 결핍 요인 추출.
*   **가설 검증 모델 (Hypothesis Verification)**:
    *   1차 대면에서 수립된 가설(`Hypothesis`)을 온라인 설문 결과와 매핑.
    *   **지지(Support)**: 관련 효과성 문항 응답 ≥ 4점.
    *   **특이(Mismatch)**: 가설은 '효과 있음'을 예측했으나 실제 응답이 저조(≤ 2점)하거나 그 반대의 경우 → 심층 인터뷰 대상으로 자동 분류.
*   **후보군 자동 추출 (Advanced Candidate Extraction)**:
    *   설문 결과 중 IPA Gap이 크거나, 가설과 데이터가 불일치하는 대상을 식별하여 `Candidate List`에 등재.

### 4.4. 2차 대면: 심층 인터뷰 (Second Visit Mode)
데이터가 말해주지 않는 이면의 사실을 파악하기 위한 정성적(Qualitative) 조사 단계입니다.

*   **대상자 그룹핑**:
    1.  **성과 우수군**: 서비스 만족도가 유지 또는 상승한 집단 (성공 요인 분석).
    2.  **데이터 불일치군**: 정량 데이터와 정성 데이터가 모순되는 집단 (숨겨진 요인 발굴).
    3.  **특이 사례군**: 복합적인 불만이나 특이한 니즈가 있는 집단.
*   **추적 조사 (Before/After Tracking)**:
    *   4대 핵심 지표(`생활 안정성`, `정서 상태`, `사회적 교류`, `건강 관리`)에 대해 서비스 이용 전후의 변화 추이를 기록.
*   **심층 질문 로직**: 대상자 유형별로 특화된 질문 세트(`INTERVIEW_QUESTIONS`)가 동적으로 로드되어, 조사원이 맥락에 맞는 깊이 있는 질문을 수행하도록 유도.

---

## 5. 외부 시스템 연동 (External Interface)

### 5.1. Google Sheets API 연동
본 시스템은 별도의 DB 구축 비용 없이 효율적인 데이터 관리를 위해 Google Sheets를 백엔드로 사용합니다.

*   **통신 프로토콜**: HTTP POST / GET (via Google Apps Script Web App URL)
*   **데이터 매핑 (Schema Mapping)**:
    *   시스템의 JSON 데이터 객체를 Google Sheet의 2차원 배열(Row/Column)로 평탄화(Flattening)하여 전송.
    *   주요 지표(Indicators) 및 체크리스트는 하나의 셀 내에 JSON 문자열 또는 콤마(,) 구분 텍스트로 병합 저장.
*   **보안 및 인증**: CORS(Cross-Origin Resource Sharing) 정책 준수 및 스크립트 배포 시 권한 설정 관리.

---

## 6. 운영 및 유지보수 (Operations & Maintenance)

### 6.1. 설치 및 구동
1.  **Repository Clone**: `git clone [REPO_URL]`
2.  **Dependency Install**: `npm install` (Node.js 18+ 권장)
3.  **Run Development**: `npm run dev` (Port 5173 기본)

### 6.2. 배포 가이드
*   **빌드**: `npm run build` 명령을 통해 정적 파일(`dist/`) 생성.
*   **호스팅**: GitHub Pages, Vercel, Netlify 등 정적 웹 호스팅 서비스에 즉시 배포 가능.

### 6.3. 문제 해결 (Troubleshooting)
*   **API 연동 실패**:
    *   Google Apps Script 배포 URL이 정확한지 확인.
    *   브라우저 Console Log에 CORS 오류 발생 여부 확인.
    *   `utils/googleSheetApi.ts` 내의 데이터 필드 매핑이 시트 헤더와 일치하는지 점검.
*   **화면 로딩 오류**:
    *   `localStorage` 초기화 (`F12` > Application > Local Storage > Clear) 후 재시도.
    *   유효하지 않은 데이터 타입(Null/Undefined)이 State에 존재하는지 `useEffect` 디버깅 필요.

---
**[문서 끝]**
