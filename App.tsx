
import React, { useState, useEffect } from 'react';
import { MonitoringMode, Hypothesis, Candidate, RiskTarget, FormDataState, ServiceType, VerificationData, PhoneCallRecord } from './types';
import { PHONE_INDICATORS, VISIT_INDICATORS, INTERVIEW_QUESTIONS, ONLINE_EFFECTIVENESS_INDICATORS, REGION_AGENCY_MAP } from './constants';
import { Toast } from './components/ui/Toast';
import { ReportModal } from './components/ui/ReportModal';
import { SettingsModal } from './components/ui/SettingsModal';
import { sendToGoogleSheet } from './utils/googleSheetApi';

// Icons
import {
  Phone, Users, ClipboardCheck, Activity,
  Save, Copy, Settings, CloudUpload, MessageSquare, ExternalLink
} from 'lucide-react';

// Components
import BasicInfo from './components/sections/BasicInfo';
import PhoneMode from './components/modes/PhoneMode';
import OnlineMode from './components/modes/OnlineMode';
import VisitMode from './components/modes/VisitMode';
import SecondVisitMode from './components/modes/SecondVisitMode';
import AgencyResponseMode from './components/modes/AgencyResponseMode';

const App: React.FC = () => {
  // --- Global State ---
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' | 'info', show: boolean }>({ msg: '', type: 'success', show: false });
  const [reportModal, setReportModal] = useState<{ visible: boolean, data: { fileName: string, subject: string, summary: string } }>({
    visible: false,
    data: { fileName: '', subject: '', summary: '' }
  });
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type, show: true });
  };

  // Persisted Data
  // 하드코딩된 기본 Google Apps Script URL (항상 동일한 시트 사용)
  const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGdQ6jmam7HHyaU8FPvuHHg-CrMQ0qxkd2SUag829Yz6RW0mv5rzWozjFL_JZMKZG1zg/exec';
  const [scriptUrl, setScriptUrl] = useState<string>(() => localStorage.getItem('googleSheetUrl') || DEFAULT_SCRIPT_URL);

  const [hypotheses, setHypotheses] = useState<Hypothesis[]>(() => {
    const saved = localStorage.getItem('hypotheses');
    return saved ? JSON.parse(saved) : [];
  });

  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('candidates');
    return saved ? JSON.parse(saved) : [];
  });

  const [riskTargets, setRiskTargets] = useState<RiskTarget[]>(() => {
    const saved = localStorage.getItem('riskTargets');
    return saved ? JSON.parse(saved) : [];
  });

  // New: Phone Logs
  const [phoneLog, setPhoneLog] = useState<PhoneCallRecord[]>(() => {
    const saved = localStorage.getItem('phoneLog');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('hypotheses', JSON.stringify(hypotheses));
  }, [hypotheses]);

  useEffect(() => {
    localStorage.setItem('candidates', JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem('riskTargets', JSON.stringify(riskTargets));
  }, [riskTargets]);

  useEffect(() => {
    localStorage.setItem('phoneLog', JSON.stringify(phoneLog));
  }, [phoneLog]);

  const handleSettingsSave = (url: string) => {
    setScriptUrl(url);
    localStorage.setItem('googleSheetUrl', url);
    setSettingsVisible(false);
    showToast('⚙️ 구글 시트 연동 URL이 저장되었습니다.', 'success');
  };

  // --- Simulation Logic ---
  const handleSimulate = () => {
    const agencies = Object.values(REGION_AGENCY_MAP).flat();

    // Dataset with Gender inference
    const people = [
      { name: '김철수', gender: '남' }, { name: '이영희', gender: '여' }, { name: '박민수', gender: '남' },
      { name: '최자영', gender: '여' }, { name: '정순자', gender: '여' }, { name: '강호동', gender: '남' },
      { name: '유재석', gender: '남' }, { name: '박명수', gender: '남' }, { name: '이효리', gender: '여' },
      { name: '김종국', gender: '남' }, { name: '송지효', gender: '여' }, { name: '하동훈', gender: '남' },
      { name: '양세찬', gender: '남' }, { name: '지석진', gender: '남' }, { name: '전소민', gender: '여' },
      { name: '이미주', gender: '여' }, { name: '신봉선', gender: '여' }, { name: '정준하', gender: '남' },
      { name: '노홍철', gender: '남' }, { name: '정형돈', gender: '남' }, { name: '길성준', gender: '남' },
      { name: '황광희', gender: '남' }, { name: '조세호', gender: '남' }, { name: '남창희', gender: '남' },
      { name: '이용진', gender: '남' }, { name: '이진호', gender: '남' }, { name: '양세형', gender: '남' },
      { name: '문세윤', gender: '남' }, { name: '딘딘', gender: '남' }, { name: '김선호', gender: '남' }
    ];

    // 1. Simulate Phone Monitoring (30 people) -> Generate Risk Targets (8 risks)
    const newPhoneLog: PhoneCallRecord[] = [];
    const newRiskTargets: RiskTarget[] = [];

    people.forEach((person, i) => {
      const isRisk = i < 8; // First 8 are risks
      const agency = agencies[i % agencies.length];
      const serviceType: ServiceType = '일반 서비스';

      // Random Birth Year (1935 ~ 1955)
      const birthYear = String(1935 + Math.floor(Math.random() * 20));

      let log: PhoneCallRecord;

      if (isRisk) {
        const riskDetail = i % 2 === 0 ? '식사 거부 및 영양 불균형 의심' : '최근 낙상 사고 이후 거동 불편 호소';
        // Generate Phone Risk Indicators
        const phoneIndicators = {
          'gen_stability': '불안요소 발견',
          'gen_loneliness': '변화 없음',
          'gen_safety': '여전히 불안'
        };

        log = {
          id: 1000 + i,
          name: person.name,
          gender: person.gender,
          birth_year: birthYear,
          agency,
          service_type: serviceType,
          date: new Date().toISOString().split('T')[0],
          status: 'risk',
          summary: riskDetail,
          satisfaction: '불만족',
          service_items: ['건강지원', '가사지원'],
          visit_count: '주 1회 이상',
          call_count: '주 2회',
          phone_indicators: phoneIndicators,
          safety_trend: riskDetail,
          special_notes: '긴급 방문 요망 및 상태 확인 필요'
        };

        // Generate Detailed Visit Data for the Risk Target
        let env_check: string[] = [];
        let safety_check: string[] = [];
        let visit_indicators: Record<string, string> = {};
        let final_grade = '주의';
        let action_memo = '';
        let body_status = '보조가 필요한 상태';

        if (i % 2 === 0) {
          // Nutrition/Health Risk Case
          env_check = ['영양 불균형', '냉장고 위생 위기'];
          body_status = '보조가 필요한 상태';
          visit_indicators = {
            'gen_1': '자주 (수시로 불안감 느낌)',
            'gen_3': '거의 안 함 (방법 미흡)',
            'gen_9': '거의 안 먹음 (식사 거부/위험)',
            'gen_10': '그만두고 싶음 (중단)'
          };
          final_grade = '주의';
          action_memo = `[자동 생성 리포트]\n식사 거부로 인한 영양 불균형이 심각하며, 냉장고 내 부패한 음식물이 다수 발견됨.\n약물 복용 지도가 시급함.`;
        } else {
          // Falls/Housing Risk Case
          safety_check = ['미끄럼 위험', '이동 장애물'];
          body_status = '거동이 불가능한 위기';
          visit_indicators = {
            'gen_5': '없음 (연락할 곳 취약)',
            'gen_6': '힘들다 (불편/불만)',
            'gen_1': '항상 (극도의 공포/잠 못 둠)'
          };
          final_grade = '위기';
          action_memo = `[자동 생성 리포트]\n주거 환경이 매우 열악하며 낙상 위험이 높음.\n즉각적인 주거 환경 개선 및 병원 동행이 필요함.`;
        }

        newRiskTargets.push({
          id: 1000 + i,
          name: person.name,
          gender: person.gender,
          birth_year: birthYear,
          agency,
          service_type: serviceType,
          riskDetails: riskDetail,
          date: new Date().toISOString().split('T')[0],
          // Pre-filled Visit Data
          env_check,
          safety_check,
          body_status,
          visit_indicators,
          final_grade,
          action_memo
        });
      } else {
        // Generate Safe Indicators
        const phoneIndicators = {
          'gen_stability': '안정',
          'gen_loneliness': '많이 해소됨',
          'gen_safety': '안심'
        };

        log = {
          id: 1000 + i,
          name: person.name,
          gender: person.gender,
          birth_year: birthYear,
          agency,
          service_type: serviceType,
          date: new Date().toISOString().split('T')[0],
          status: 'completed',
          summary: '특이사항 없음 (안전 확인 완료)',
          satisfaction: '만족',
          service_items: ['안전지원(정보제공, 말벗_정서지원)'],
          visit_count: '주 1회 이상',
          call_count: '주 1회',
          phone_indicators: phoneIndicators,
          safety_trend: '건강 상태 양호하며 식사 잘 하심',
          special_notes: '없음'
        };
      }
      newPhoneLog.push(log);
    });

    setPhoneLog(newPhoneLog);
    setRiskTargets(newRiskTargets);

    // 2. Simulate 1st Visit -> Generate Hypotheses (from 8 visits -> 5 hypotheses)
    const newHypotheses: Hypothesis[] = [
      { id: 101, subjectName: '김철수', factor: '미끄러운 바닥', outcome: '낙상 사고', evidence: '장판이 들뜨고 물기가 자주 고임', priority: '높음', sendToStep2: true, status: 'discovered', createdAt: new Date().toISOString(), causeQ: 'Q11', effectQ: 'Q12' },
      { id: 102, subjectName: '이영희', factor: '복약 어려움', outcome: '재입원', evidence: '약 봉투가 쌓여있고 구분 못함', priority: '높음', sendToStep2: true, status: 'discovered', createdAt: new Date().toISOString(), causeQ: 'Q7', effectQ: 'Q12' },
      { id: 103, subjectName: '박민수', factor: '고독감', outcome: '우울감', evidence: '하루 종일 대화 상대 없음', priority: '중간', sendToStep2: true, status: 'discovered', createdAt: new Date().toISOString(), causeQ: 'Q9', effectQ: 'Q10' },
      { id: 104, subjectName: '최자영', factor: '식사 거부', outcome: '건강 악화', evidence: '입맛이 없어 끼니를 자주 거름', priority: '중간', sendToStep2: true, status: 'discovered', createdAt: new Date().toISOString(), causeQ: 'Q8', effectQ: 'Q13' },
      { id: 105, subjectName: '정순자', factor: '난방 미비', outcome: '수면 장애', evidence: '외풍이 심해 잠을 설침', priority: '낮음', sendToStep2: true, status: 'discovered', createdAt: new Date().toISOString(), causeQ: 'Q6', effectQ: 'Q4' }
    ];

    // 3. Simulate Online Survey -> 50 responses per hypothesis
    newHypotheses.forEach(h => {
      const verificationData: VerificationData[] = [];
      for (let i = 0; i < 50; i++) {
        const rand = Math.random();
        let pattern = 'support';
        let factorMatch = '해당함';
        let outcomeMatch = '발생함';

        if (rand > 0.5 && rand <= 0.8) {
          pattern = 'control';
          factorMatch = '해당없음';
          outcomeMatch = '발생안함';
        } else if (rand > 0.8 && rand <= 0.9) {
          pattern = 'mismatch_success';
          factorMatch = '해당함';
          outcomeMatch = '발생안함';
        } else if (rand > 0.9) {
          pattern = 'mismatch_unexpect';
          factorMatch = '해당없음';
          outcomeMatch = '발생함';
        }

        verificationData.push({
          respondentName: `익명_${i + 1}`,
          factorMatch,
          outcomeMatch,
          pattern,
          timestamp: new Date().toISOString()
        });
      }
      h.verificationData = verificationData;
    });
    setHypotheses(newHypotheses);

    // 4. Simulate 2nd Visit Candidates (from Mismatch Success)
    const newCandidates: Candidate[] = [
      {
        id: 201, name: '강호동', gender: '남', birth_year: '1955', agency: '거제노인통합지원센터', service_type: '일반 서비스',
        reason: '미끄러운 바닥이 있으나 낙상 사고 발생 안함 (안전바 설치)', reasonType: '데이터불일치',
        track_stability: '크게 개선', track_emotion: '개선', track_social: '유지', track_health: '개선',
        interview_answers: { 'q1': '예전엔 방바닥이 미끄러워 걷기 무서웠는데, 안전바 잡고 다니니 살 것 같네요.', 'q2': '매일 전화주시고 찾아와주시니 든든합니다.', 'q3': '아마 넘어져서 병원에 있지 않았을까요?', 'q4': '지금처럼만 해주시면 더 바랄 게 없습니다.' },
        interviewer_opinion: '주거 환경 개선(안전바)이 낙상 예방에 결정적 기여를 함. 심리적 안정감도 매우 높음.'
      },
      {
        id: 202, name: '유재석', gender: '남', birth_year: '1952', agency: '김해시종합사회복지관', service_type: '일반 서비스',
        reason: '고독감이 높으나 우울감 낮음 (반려식물 키움)', reasonType: '데이터불일치',
        track_stability: '유지', track_emotion: '크게 개선', track_social: '크게 개선', track_health: '유지',
        interview_answers: { 'q1': '반려식물(콩나물) 키우면서 아침에 일어나는 게 즐거워졌어요.', 'q2': '생활지원사 선생님이 식물 이야기도 들어주셔서 좋아요.', 'q3': '말 한마디 안 하고 하루를 보냈을 겁니다.', 'q4': '친구들을 만날 수 있는 프로그램이 있으면 좋겠어요.' },
        interviewer_opinion: '반려식물 돌봄이 정서적 지지체계 역할을 수행하여 고독감 속에서도 우울감을 방어하는 효과가 입증됨.'
      },
      {
        id: 203, name: '박명수', gender: '남', birth_year: '1949', agency: '진주노인통합지원센터', service_type: '특화서비스',
        reason: '식사 거부가 잦으나 건강 상태 양호 (영양제 섭취)', reasonType: '특이사례',
        track_stability: '악화', track_emotion: '유지', track_social: '악화', track_health: '유지',
        interview_answers: { 'q1': '입맛이 통 없어서 밥은 잘 안 먹혀요.', 'q2': '그래도 약이라도 챙겨주시니 버팁니다.', 'q3': '벌써 쓰러졌겠죠.', 'q4': '부드러운 죽 같은 걸 지원해줬으면 좋겠어요.' },
        interviewer_opinion: '식사 거부에도 불구하고 영양제 및 대체식 섭취로 건강 유지 중이나, 장기적으로는 식생활 개선 개입이 시급함.'
      },
      {
        id: 204, name: '이효리', gender: '여', birth_year: '1945', agency: '통영시종합사회복지관', service_type: '퇴원환자 단기 집중',
        reason: '복약 어려움 있으나 재입원 안함 (이웃 도움)', reasonType: '성과우수군',
        track_stability: '크게 개선', track_emotion: '개선', track_social: '크게 개선', track_health: '크게 개선',
        interview_answers: { 'q1': '퇴원하고 약 챙겨먹는 게 제일 걱정이었는데 옆집 할머니가 도와줘요.', 'q2': '병원에 다시 안 가도 되니 너무 좋습니다.', 'q3': '약 섞어 먹고 다시 응급실 갔을 거예요.', 'q4': '병원 동행 서비스가 더 많았으면 합니다.' },
        interviewer_opinion: '공식적 돌봄 서비스와 비공식적 자원(이웃)의 결합이 퇴원 환자의 지역사회 안착에 성공적인 모델임을 보여줌.'
      }
    ];
    setCandidates(newCandidates);

    showToast(`🧪 데이터 생성 완료!\n1. 유선모니터링: 30건 (위험 8건)\n2. 1차현장점검: 가설 5건\n3. 온라인설문: 250건 (가설당 50명)\n4. 2차심층면접: 대상자 4명`, 'success');
    setSettingsVisible(false);
  };

  // Form State
  const [formData, setFormData] = useState<FormDataState>({
    survey_date: new Date().toISOString().split('T')[0],
    author: '',
    mon_method: '유선(매월)',
    name: '',
    gender: '여',
    birth_year: '1950',
    birth_month: '01',
    birth_day: '01',
    age_group: '',
    region: '',
    agency: '',
    service_type: '일반 서비스',

    satisfaction: '만족',
    service_items: [],
    visit_count: '주 1회 이상',
    call_count: '주 1회',
    safety_trend: '',
    special_notes: '',
    phone_indicators: {},

    env_check: [],
    safety_check: [],
    body_status: '자유로운 보행 가능',
    visit_indicators: {},
    final_grade: '',
    action_memo: '',

    visit2_reason: '성과우수군',
    track_stability: '개선',
    track_emotion: '개선',
    track_social: '개선',
    track_health: '개선',
    interview_answers: {},
    interviewer_opinion: '',

    // Online Mode Updates
    service_duration: '1년~2년',
    service_satisfaction_areas: [],
    outdoor_frequency: '주 1~2회',
    visited_places: [],
    online_opinion: ''
  });

  const updateField = (field: keyof FormDataState, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // --- Theme Logic ---
  const getThemeColor = () => {
    switch (formData.mon_method) {
      case '유선(매월)': return 'from-blue-600 to-blue-800';
      case '온라인설문': return 'from-emerald-600 to-teal-800';
      case '1차 대면': return 'from-rose-600 to-red-800';
      case '2차 대면': return 'from-violet-600 to-purple-800';
      default: return 'from-slate-700 to-slate-900';
    }
  };

  const getThemeText = () => {
    switch (formData.mon_method) {
      case '유선(매월)': return 'text-blue-700';
      case '온라인설문': return 'text-emerald-700';
      case '1차 대면': return 'text-rose-700';
      case '2차 대면': return 'text-violet-700';
      default: return 'text-slate-700';
    }
  };

  const getThemeBorder = () => {
    switch (formData.mon_method) {
      case '유선(매월)': return 'border-blue-200';
      case '온라인설문': return 'border-emerald-200';
      case '1차 대면': return 'border-rose-200';
      case '2차 대면': return 'border-violet-200';
      default: return 'border-slate-200';
    }
  };

  // --- Report Generation Logic ---
  const handleCopy = () => {
    const dateStr = formData.survey_date.replace(/-/g, '');
    const region = formData.region || '미지정';
    const agency = formData.agency || '미지정';
    const name = formData.name || '대상자';
    const dob = `${formData.birth_year}-${formData.birth_month}-${formData.birth_day}`;

    let fileName = '';
    let subject = '';
    let summary = '';

    if (formData.mon_method === '유선(매월)') {
      // 1. Phone Mode Report
      fileName = `(${dateStr})${region}_${agency}`;
      subject = `${name} / ${dob} / ${formData.gender}`;

      // 유선빈도 포맷 변환
      const formatCallCount = (count: string) => {
        if (count === '자주') return '자주 유선전화';
        if (count === '매일') return '매일 유선전화';
        if (count === '미제공') return '전화오지 않음';
        return `${count} 유선`;
      };

      const serviceContent = [
        ...formData.service_items.map(item =>
          item === '기타' && formData.other_service_detail
            ? `기타(${formData.other_service_detail})`
            : item
        ),
        `${formData.visit_count} 방문`,
        formatCallCount(formData.call_count)
      ].join(', ') || '없음';

      summary = `■ 기본 정보
- 서비스 만족: ${formData.satisfaction}
- 서비스 내용: ${serviceContent}
- 안전동향: ${formData.safety_trend || '특이사항 없음'}
- 특이사항 및 민원: ${formData.special_notes || '없음'}`;

    } else if (formData.mon_method === '1차 대면') {
      // 2. 1st Visit Report
      fileName = `[1차대면] ${dateStr}_${name}_리스크점검`;
      subject = `${name} / ${agency} / ${formData.service_type}`;

      const indicators = VISIT_INDICATORS[formData.service_type as ServiceType] || [];
      const indicatorText = indicators.map(ind =>
        `${ind.label}: ${formData.visit_indicators?.[ind.id] || '-'}`
      ).join('\n');

      summary = `■ 환경 및 신체 스크리닝
- 위생/주거 리스크: ${[...formData.env_check, ...formData.safety_check].join(', ') || '발견되지 않음'}
- 신체 기능: ${formData.body_status}

■ 10대 정밀 지표 점검
${indicatorText}

■ 최종 판정: ${formData.final_grade || '판정 미완료'}
■ 조치 계획: ${formData.action_memo || '작성되지 않음'}`;

    } else if (formData.mon_method === '2차 대면') {
      // 3. 2nd Visit Report
      fileName = `[2차대면] ${dateStr}_${name}_심층인터뷰`;
      subject = `${name} / ${formData.visit2_reason} / ${formData.service_type}`;

      const questions = INTERVIEW_QUESTIONS[formData.service_type as ServiceType] || [];
      const interviewText = questions.map(q =>
        `Q. ${q.label}\nA. ${formData.interview_answers?.[q.id] || '(답변 없음)'}`
      ).join('\n\n');

      summary = `■ 선정 사유: ${formData.visit2_reason}

■ 변화 추적 (Before/After)
- 생활 안정성: ${formData.track_stability}
- 정서 상태: ${formData.track_emotion}
- 사회적 교류: ${formData.track_social}
- 건강 관리: ${formData.track_health}

■ 심층 인터뷰 내용
${interviewText}

■ 종합 의견 및 정책 제언
${formData.interviewer_opinion || '(작성되지 않음)'}`;

    } else {
      // 4. Online (Updated) - For Bulk, this is less relevant for individual copy but kept
      fileName = `[온라인] ${dateStr}_${name}_만족도설문`;
      subject = `${name} / ${agency}`;
      summary = `온라인 설문은 대규모 데이터 업로드를 통해 처리됩니다.`;
    }

    setReportModal({
      visible: true,
      data: { fileName, subject, summary }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('📋 클립보드에 복사되었습니다.', 'info');
  };

  // Modified Save Function: Local + Google Sheet
  const handleSave = async () => {
    if (formData.mon_method === '온라인설문') {
      showToast('⚠️ 온라인 설문은 일괄 업로드 기능을 사용해주세요.', 'info');
      return;
    }

    if (!formData.name || !formData.agency) {
      showToast('⚠️ 성명과 기관명은 필수 입력 사항입니다.', 'error');
      return;
    }

    if (!scriptUrl) {
      showToast('⚠️ 구글 시트 연동 URL이 없습니다. 설정창을 엽니다.', 'info');
      setSettingsVisible(true);
      return;
    }

    setIsSyncing(true);

    // 1. Send to Google Sheet
    const result = await sendToGoogleSheet(scriptUrl, formData, { hypotheses });

    setIsSyncing(false);

    if (result.success) {
      showToast(result.message, 'success');

      // Reset form for new entry (keep author and region)
      const savedAuthor = formData.author;
      const savedRegion = formData.region;
      const savedMode = formData.mon_method;

      setFormData({
        survey_date: new Date().toISOString().split('T')[0],
        author: savedAuthor,
        mon_method: savedMode,
        name: '',
        gender: '여',
        birth_year: '1950',
        birth_month: '01',
        birth_day: '01',
        age_group: '',
        region: savedRegion,
        agency: '',
        service_type: '일반 서비스',
        satisfaction: '만족',
        service_items: [],
        visit_count: '주 1회 이상',
        call_count: '주 1회',
        safety_trend: '',
        special_notes: '',
        phone_indicators: {},
        other_service_detail: '',
        env_check: [],
        safety_check: [],
        body_status: '자유로운 보행 가능',
        visit_indicators: {},
        final_grade: '',
        action_memo: '',
        visit2_reason: '성과우수군',
        track_stability: '개선',
        track_emotion: '개선',
        track_social: '개선',
        track_health: '개선',
        interview_answers: {},
        interviewer_opinion: '',
        service_duration: '1년~2년',
        service_satisfaction_areas: [],
        outdoor_frequency: '주 1~2회',
        visited_places: [],
        online_opinion: '',
        is_risk_target: false
      });
    } else {
      showToast(result.message, 'error');
    }
  };

  return (
    <div className="min-h-screen pb-24 text-slate-800">
      {/* Header */}
      <header className={`bg-gradient-to-r ${getThemeColor()} text-white p-4 shadow-lg sticky top-0 z-40 transition-all duration-500`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              {formData.mon_method === '유선(매월)' && <Phone size={24} />}
              {formData.mon_method === '온라인설문' && <Users size={24} />}
              {formData.mon_method === '1차 대면' && <Activity size={24} />}
              {formData.mon_method === '2차 대면' && <ClipboardCheck size={24} />}
              {formData.mon_method === '답변관리' && <MessageSquare size={24} />}
            </div>
            <div>
              <span className="text-blue-100 text-xs font-semibold tracking-wider uppercase">Senior Care 2026</span>
              <h1 className="text-xl font-bold leading-tight">
                {formData.mon_method === '유선(매월)' && '상시 모니터링'}
                {formData.mon_method === '온라인설문' && '만족도 설문'}
                {formData.mon_method === '1차 대면' && '현장 리스크 점검'}
                {formData.mon_method === '2차 대면' && '심층 인터뷰'}
                {formData.mon_method === '답변관리' && '수행기관 답변관리'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <nav className="flex bg-black/20 p-1 rounded-xl overflow-x-auto scrollbar-hide">
              {(['유선(매월)', '1차 대면', '온라인설문', '2차 대면', '답변관리'] as MonitoringMode[]).map((mode) => {
                // Calculate Badge Count
                let count = 0;
                let badgeColor = '';
                if (mode === '1차 대면') { count = riskTargets.length; badgeColor = 'bg-red-500'; }
                if (mode === '온라인설문') { count = hypotheses.length; badgeColor = 'bg-amber-500'; }
                if (mode === '2차 대면') { count = candidates.length; badgeColor = 'bg-violet-500'; }

                return (
                  <button
                    key={mode}
                    onClick={() => updateField('mon_method', mode)}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-all duration-200 flex items-center gap-2 ${formData.mon_method === mode
                      ? 'bg-white text-slate-900 shadow-md transform scale-105'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    {mode}
                    {count > 0 && (
                      <span className={`text-[10px] text-white font-bold px-1.5 py-0.5 rounded-full shadow-sm leading-none ${badgeColor} animate-pulse`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            <button
              onClick={() => window.open('https://docs.google.com/spreadsheets/d/1SKF4zhkkosarkzaWu2idF_qqzZBdG-h47K46OXMBdMo/edit?gid=1522504568#gid=1522504568', '_blank')}
              className="p-2 bg-green-500/80 hover:bg-green-500 rounded-lg transition-colors text-white flex items-center gap-1.5"
              title="구글 시트 열기"
            >
              <ExternalLink size={16} />
              <span className="text-xs font-bold hidden md:inline">시트</span>
            </button>
            <button
              onClick={() => setSettingsVisible(true)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
              title="연동 설정"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

        {/* Basic Info Section - Hide for Online Mode */}
        {formData.mon_method !== '온라인설문' && (
          <BasicInfo
            formData={formData}
            updateField={updateField}
            themeText={getThemeText()}
            themeBorder={getThemeBorder()}
          />
        )}

        {/* Dynamic Content */}
        <div className="transition-all duration-300">
          {formData.mon_method === '유선(매월)' && (
            <PhoneMode
              formData={formData}
              updateField={updateField}
              riskTargets={riskTargets}
              setRiskTargets={setRiskTargets}
              phoneLog={phoneLog} // Pass phone log
              showToast={showToast}
            />
          )}

          {formData.mon_method === '온라인설문' && (
            <OnlineMode
              formData={formData}
              updateField={updateField}
              hypotheses={hypotheses}
              setHypotheses={setHypotheses}
              candidates={candidates}
              setCandidates={setCandidates}
              showToast={showToast}
              scriptUrl={scriptUrl}
            />
          )}

          {formData.mon_method === '1차 대면' && (
            <VisitMode
              formData={formData}
              updateField={updateField}
              hypotheses={hypotheses}
              setHypotheses={setHypotheses}
              riskTargets={riskTargets}
              setRiskTargets={setRiskTargets}
              showToast={showToast}
            />
          )}

          {formData.mon_method === '2차 대면' && (
            <SecondVisitMode
              formData={formData}
              updateField={updateField}
              hypotheses={hypotheses}
              setHypotheses={setHypotheses}
              candidates={candidates}
              setCandidates={setCandidates}
              showToast={showToast}
            />
          )}

          {formData.mon_method === '답변관리' && (
            <AgencyResponseMode
              scriptUrl={scriptUrl}
              showToast={showToast}
            />
          )}
        </div>

      </main>

      {/* Floating Action Buttons - Hide for Online Mode and Agency Response Mode */}
      {formData.mon_method !== '온라인설문' && formData.mon_method !== '답변관리' && (
        <div className="fixed bottom-8 right-6 flex flex-col gap-3 z-30">
          <button
            onClick={handleCopy}
            className="group flex items-center justify-center w-14 h-14 bg-white text-slate-600 rounded-full shadow-lg border border-slate-100 hover:scale-110 transition-all hover:text-blue-600"
            title="리포트 추출 및 복사"
          >
            <Copy size={24} />
            <span className="absolute right-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">복사하기</span>
          </button>
          <button
            onClick={handleSave}
            disabled={isSyncing}
            className={`group flex items-center justify-center w-14 h-14 bg-gradient-to-r ${getThemeColor()} text-white rounded-full shadow-xl shadow-blue-500/30 hover:scale-110 transition-all ${isSyncing ? 'opacity-80 cursor-wait' : ''}`}
            title="데이터 저장 (구글시트 연동)"
          >
            {isSyncing ? <CloudUpload size={24} className="animate-bounce" /> : <Save size={24} />}
            <span className="absolute right-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {isSyncing ? '전송 중...' : '저장하기'}
            </span>
          </button>
        </div>
      )}

      <Toast
        message={toast.msg}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />

      <ReportModal
        isVisible={reportModal.visible}
        data={reportModal.data}
        onClose={() => setReportModal(prev => ({ ...prev, visible: false }))}
        onCopy={copyToClipboard}
      />

      <SettingsModal
        isVisible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        onSave={handleSettingsSave}
        onSimulate={handleSimulate} // Passing the simulation function
        currentUrl={scriptUrl}
      />
    </div>
  );
};

export default App;
