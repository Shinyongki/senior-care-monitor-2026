
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/Card';
import { FormDataState, Hypothesis, ServiceType, RiskTarget } from '../../types';
import { RISK_FACTORS, OUTCOMES, VISIT_INDICATORS, REGION_AGENCY_MAP, SERVICE_HYPOTHESIS_MAPPING } from '../../constants';
import { AlertTriangle, Lightbulb, CheckCircle2, Activity, Globe, UserPlus, HelpCircle, ArrowRight, Trash2, Edit, PlusCircle, X, Save, Users, Download, Search, Loader2, Eye } from 'lucide-react';
import { fetchSheetData } from '../../utils/googleSheetApi';

interface VisitModeProps {
  formData: FormDataState;
  updateField: (field: keyof FormDataState, value: any) => void;
  hypotheses: Hypothesis[];
  setHypotheses: React.Dispatch<React.SetStateAction<Hypothesis[]>>;
  riskTargets?: RiskTarget[];
  setRiskTargets?: React.Dispatch<React.SetStateAction<RiskTarget[]>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  scriptUrl?: string;
}

const VisitMode: React.FC<VisitModeProps> = ({
  formData, updateField, hypotheses, setHypotheses, riskTargets = [], setRiskTargets, showToast, scriptUrl
}) => {
  // State for CRUD
  const [showTargetList, setShowTargetList] = useState(false);
  const [editingTarget, setEditingTarget] = useState<RiskTarget | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  // New state to track selected question from the mapping
  const [selectedMappingId, setSelectedMappingId] = useState<number | null>(null);

  // Auto-load risk targets from sheet on mount
  const hasAutoLoaded = useRef(false);
  useEffect(() => {
    if (!scriptUrl || !setRiskTargets || hasAutoLoaded.current) return;
    hasAutoLoaded.current = true;

    (async () => {
      try {
        const response = await fetchSheetData(scriptUrl);
        if (!response.success || !response.data) return;

        const flaggedRows = response.data.filter((row: any) =>
          row.Is_RiskTarget && String(row.Is_RiskTarget).trim()
        );
        if (flaggedRows.length === 0) return;

        // Group by name+agency, take latest per person
        const groups: Record<string, any[]> = {};
        flaggedRows.forEach((row: any) => {
          const key = `${row.Name}__${row.Agency}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(row);
        });

        const newTargets: RiskTarget[] = [];
        Object.values(groups).forEach(rows => {
          const sorted = [...rows].sort((a, b) =>
            String(b.Survey_Date || b.Timestamp || '').localeCompare(String(a.Survey_Date || a.Timestamp || ''))
          );
          const latest = sorted[0];
          const alreadyExists = riskTargets.some(t => t.name === latest.Name && t.agency === latest.Agency);
          if (!alreadyExists) {
            newTargets.push({
              id: Date.now() + Math.random(),
              name: latest.Name || '',
              gender: latest.Gender || '여',
              birth_year: latest.Birth_Year || '',
              agency: latest.Agency || '',
              service_type: (latest.Service_Type as ServiceType) || '일반 서비스',
              riskDetails: '시트 1차대면등록 자동 등록',
              date: new Date().toISOString().split('T')[0],
              address: '',
              phone: ''
            });
          }
        });

        if (newTargets.length > 0) {
          setRiskTargets(prev => [...prev, ...newTargets]);
          showToast(`시트에서 리스크 대상자 ${newTargets.length}명이 자동 등록되었습니다.`, 'success');
        }
      } catch (error) {
        console.error('Auto-load risk targets error:', error);
      }
    })();
  }, [scriptUrl]);

  // Google Sheet search & summary states
  const [showSheetSearch, setShowSheetSearch] = useState(false);
  const [sheetSearchQuery, setSheetSearchQuery] = useState('');
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [subjectSummary, setSubjectSummary] = useState<{
    name: string;
    gender: string;
    birthYear: string;
    birthMonth: string;
    birthDay: string;
    ageGroup: string;
    region: string;
    agency: string;
    serviceType: string;
    totalRecords: number;
    latestDate: string;
    latestAuthor: string;
    latestSatisfaction: string;
    serviceItems: string;
    visitFreq: string;
    callFreq: string;
    riskSummaries: string[];
    specialNotes: string[];
    indicators: Record<string, string>;
    agencyResponses: string[];
    isRiskTarget: boolean;
    address: string;
    phone: string;
  } | null>(null);
  const [searchResults, setSearchResults] = useState<{ name: string; agency: string; region: string; count: number }[]>([]);

  const handleSearchSheet = async () => {
    if (!scriptUrl) {
      showToast('구글 시트 연동 URL이 설정되지 않았습니다. 설정에서 URL을 입력해주세요.', 'error');
      return;
    }
    if (!sheetSearchQuery.trim()) {
      showToast('검색어를 입력해주세요.', 'error');
      return;
    }
    setIsLoadingSheet(true);
    setSubjectSummary(null);
    setSearchResults([]);
    try {
      const response = await fetchSheetData(scriptUrl);
      if (response.success && response.data) {
        const q = sheetSearchQuery.trim().toLowerCase();
        const matched = response.data.filter((row: any) =>
          (row.Name || '').toLowerCase().includes(q) ||
          (row.Agency || '').toLowerCase().includes(q)
        );

        if (matched.length === 0) {
          showToast('검색 결과가 없습니다.', 'info');
          return;
        }

        // Group by unique name+agency combinations
        const groups: Record<string, any[]> = {};
        matched.forEach((row: any) => {
          const key = `${row.Name}__${row.Agency}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(row);
        });

        const groupKeys = Object.keys(groups);
        if (groupKeys.length === 1) {
          // Single match -> show summary directly
          buildSummary(groups[groupKeys[0]]);
        } else {
          // Multiple matches -> show selection list
          setSearchResults(groupKeys.map(key => {
            const rows = groups[key];
            return {
              name: rows[0].Name || '-',
              agency: rows[0].Agency || '-',
              region: rows[0].Region || '-',
              count: rows.length
            };
          }));
          showToast(`${groupKeys.length}명의 대상자가 검색되었습니다. 선택해주세요.`, 'info');
        }
      } else {
        showToast(response.message || '데이터를 불러오는데 실패했습니다.', 'error');
      }
    } catch (error) {
      showToast('구글 시트 데이터 로딩 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const handleSelectFromResults = async (name: string, agency: string) => {
    setIsLoadingSheet(true);
    try {
      const response = await fetchSheetData(scriptUrl!);
      if (response.success && response.data) {
        const rows = response.data.filter((row: any) => row.Name === name && row.Agency === agency);
        if (rows.length > 0) {
          buildSummary(rows);
          setSearchResults([]);
        }
      }
    } catch (error) {
      showToast('데이터 로딩 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const buildSummary = (rows: any[]) => {
    // Sort by date descending to get latest first
    const sorted = [...rows].sort((a, b) => {
      const dateA = a.Survey_Date || a.Timestamp || '';
      const dateB = b.Survey_Date || b.Timestamp || '';
      return String(dateB).localeCompare(String(dateA));
    });
    const latest = sorted[0];

    // Collect unique risk summaries and special notes across all records
    const riskSummaries = sorted
      .map(r => r.Phone_Risk_Summary || '')
      .filter(v => v && v.trim())
      .filter((v, i, arr) => arr.indexOf(v) === i);
    const specialNotes = sorted
      .map(r => r.Phone_Notes || '')
      .filter(v => v && v.trim())
      .filter((v, i, arr) => arr.indexOf(v) === i);
    const agencyResponses = sorted
      .map(r => r.Agency_Response || '')
      .filter(v => v && v.trim())
      .filter((v, i, arr) => arr.indexOf(v) === i);

    // Collect latest indicator values
    const indicators: Record<string, string> = {};
    const indicatorKeys = ['Gen_Stability', 'Gen_Loneliness', 'Gen_Safety', 'Hosp_Indep', 'Hosp_Anxiety', 'Hosp_Sat', 'Spec_Emotion', 'Spec_Social', 'Spec_Sat'];
    const indicatorLabels: Record<string, string> = {
      'Gen_Stability': '생활안정성', 'Gen_Loneliness': '고독감해소', 'Gen_Safety': '안전망체감도',
      'Hosp_Indep': '초기안착자립', 'Hosp_Anxiety': '재입원불안해소', 'Hosp_Sat': '가사신체지원만족',
      'Spec_Emotion': '정서적변화', 'Spec_Social': '사회적관계형성', 'Spec_Sat': '프로그램만족도'
    };
    indicatorKeys.forEach(key => {
      const val = latest[key];
      if (val && String(val).trim()) {
        indicators[indicatorLabels[key] || key] = String(val);
      }
    });

    setSubjectSummary({
      name: latest.Name || '',
      gender: latest.Gender || '',
      birthYear: latest.Birth_Year || '',
      birthMonth: latest.Birth_Month || '',
      birthDay: latest.Birth_Day || '',
      ageGroup: latest.Age_Group || '',
      region: latest.Region || '',
      agency: latest.Agency || '',
      serviceType: latest.Service_Type || '',
      totalRecords: rows.length,
      latestDate: latest.Survey_Date || '',
      latestAuthor: latest.Author || '',
      latestSatisfaction: latest.Satisfaction || '',
      serviceItems: latest.Service_Items || '',
      visitFreq: latest.Visit_Freq || '',
      callFreq: latest.Call_Freq || '',
      riskSummaries,
      specialNotes,
      indicators,
      agencyResponses,
      isRiskTarget: !!(latest.Is_RiskTarget && String(latest.Is_RiskTarget).trim()),
      address: '',
      phone: ''
    });

    // Auto-register as risk target if '1차대면등록' has any value
    const hasRiskFlag = !!(latest.Is_RiskTarget && String(latest.Is_RiskTarget).trim());
    if (hasRiskFlag && setRiskTargets) {
      const alreadyExists = riskTargets.some(t => t.name === latest.Name && t.agency === latest.Agency);
      if (!alreadyExists) {
        const newTarget: RiskTarget = {
          id: Date.now(),
          name: latest.Name || '',
          gender: latest.Gender || '여',
          birth_year: latest.Birth_Year || '',
          agency: latest.Agency || '',
          service_type: (latest.Service_Type as ServiceType) || '일반 서비스',
          riskDetails: '시트 1차대면등록 자동 등록',
          date: new Date().toISOString().split('T')[0],
          address: '',
          phone: ''
        };
        setRiskTargets(prev => [...prev, newTarget]);
        showToast(`'${latest.Name}' 어르신이 리스크 대상자로 자동 등록되었습니다.`, 'info');
      }
    }

    // Auto-populate form fields
    updateField('name', latest.Name || '');
    updateField('agency', latest.Agency || '');
    updateField('gender', latest.Gender || '여');
    updateField('birth_year', latest.Birth_Year || '');
    if (latest.Birth_Month) updateField('birth_month', latest.Birth_Month);
    if (latest.Birth_Day) updateField('birth_day', latest.Birth_Day);
    if (latest.Service_Type) updateField('service_type', latest.Service_Type);
    if (latest.Region) {
      updateField('region', latest.Region);
    } else {
      const region = Object.keys(REGION_AGENCY_MAP).find(r =>
        REGION_AGENCY_MAP[r].includes(latest.Agency || '')
      );
      if (region) updateField('region', region);
    }

    showToast(`'${latest.Name}' 어르신의 요약 정보를 불러왔습니다.`, 'success');
  };

  const formatKoreanDate = (dateStr: string): string => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return `${days[d.getDay()]} ${d.getMonth() + 1}월${d.getDate()}일 ${d.getFullYear()}년`;
  };

  const handleTargetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetId = Number(e.target.value);
    if (!targetId) return;

    const selected = riskTargets.find(t => t.id === targetId);
    if (selected) {
      updateField('name', selected.name);
      updateField('agency', selected.agency);
      updateField('gender', selected.gender);
      updateField('birth_year', selected.birth_year);

      // Auto-set region based on agency
      const region = Object.keys(REGION_AGENCY_MAP).find(r =>
        REGION_AGENCY_MAP[r].includes(selected.agency)
      );
      if (region) updateField('region', region);

      // Populate Service Type if available
      if (selected.service_type) updateField('service_type', selected.service_type);

      // Populate Assessment Data (Simulated Data)
      updateField('env_check', selected.env_check || []);
      updateField('safety_check', selected.safety_check || []);
      updateField('body_status', selected.body_status || '자유로운 보행 가능');
      updateField('visit_indicators', selected.visit_indicators || {});
      updateField('final_grade', selected.final_grade || '');
      updateField('action_memo', selected.action_memo || '');

      // Load address/phone into summary if available
      if (selected.address || selected.phone) {
        setSubjectSummary(prev => prev ? { ...prev, address: selected.address || '', phone: selected.phone || '' } : null);
      }

      showToast(`🚩 현장 점검 대상 '${selected.name}' 어르신의 정보를 로드했습니다.`);
    }
  };

  const autoGenerateReport = () => {
    // Basic Validation
    const hasChecks = formData.env_check.length > 0 || formData.safety_check.length > 0;
    const hasIndicators = Object.keys(formData.visit_indicators || {}).length > 0;

    if (!hasChecks && !hasIndicators && formData.body_status === '자유로운 보행 가능') {
      showToast('⚠️ 판정을 위해 위생, 안전 점검 또는 지표를 먼저 입력해주세요.', 'error');
      return;
    }

    // 1. Scoring Logic
    let score = formData.env_check.length + formData.safety_check.length;
    const indicators = formData.visit_indicators || {};
    let highRiskCount = 0;
    let mediumRiskCount = 0;

    // Collect Detailed Findings for the Report
    const criticalFindings: string[] = [];
    const cautionFindings: string[] = [];

    Object.values(indicators).forEach(value => {
      const val = String(value);
      // High Risk Keywords (Red / Crisis)
      if (val.match(/위기|위험|심각|단절|시급|긴급|발견|거부|고위험|직접적|극심|차단|부재|욕창|붕괴|은둔|적대적|공포|절망|포기/)) {
        highRiskCount++;
        criticalFindings.push(val);
      }
      // Medium Risk Keywords (Orange / Caution)
      else if (val.match(/주의|부족|미흡|심화|과잉|필요|갈등|부실|회피|무력함|고립|간접적|미숙지|체납|미비|검토|염려|오남용|불안|무망|저조|불신|이탈/)) {
        mediumRiskCount++;
        cautionFindings.push(val);
      }
    });

    score += (highRiskCount * 2) + mediumRiskCount;

    // 2. Grade Determination
    let grade = '일반관리';
    if (score >= 4 || highRiskCount > 0 || formData.body_status === '거동이 불가능한 위기') {
      grade = '위기';
    } else if (score >= 2 || mediumRiskCount > 0) {
      grade = '주의';
    } else if (Object.keys(indicators).length >= 5 && score === 0) {
      grade = '우수사례';
    }

    // 3. Narrative Generation (The "Rich" Part)
    const allRisks = [...formData.env_check, ...formData.safety_check];
    const today = new Date().toISOString().split('T')[0];

    let memo = `[${today} 현장점검 분석 보고서]\n`;
    memo += `■ 종합 판정: ${grade} 단계\n`;
    memo += `■ 신체/기능 상태: ${formData.body_status}\n\n`;

    // 3.1 Situation Summary
    memo += `1. 현장 상황 요약\n`;
    if (grade === '위기') {
      memo += `대상자는 현재 복합적인 위험 요인에 노출되어 있어 즉각적인 개입이 필요한 '고위험군'으로 분류됩니다. `;
    } else if (grade === '주의') {
      memo += `대상자는 일상생활 유지에 일부 어려움을 겪고 있으며, 방치 시 위험이 심화될 수 있는 '잠재적 위험군'입니다. `;
    } else {
      memo += `대상자는 현재 안정적인 생활을 유지하고 있으며, 자가관리 능력이 양호한 상태입니다. `;
    }

    if (allRisks.length > 0) {
      memo += `특히 주거 및 생활 환경에서 [${allRisks.join(', ')}] 등의 문제가 식별되었습니다.\n`;
    } else {
      memo += `주거 및 위생 환경에서 특이한 위험 요인은 발견되지 않았습니다.\n`;
    }

    // 3.2 Detailed Analysis
    if (criticalFindings.length > 0 || cautionFindings.length > 0) {
      memo += `\n2. 주요 식별 리스크 (정밀지표 기반)\n`;
      if (criticalFindings.length > 0) {
        memo += `- 🚨 위기 요인: ${criticalFindings.join(', ')}\n`;
      }
      if (cautionFindings.length > 0) {
        memo += `- ⚠️ 주의 요인: ${cautionFindings.join(', ')}\n`;
      }
    }

    // 3.3 Customized Recommendations based on findings
    memo += `\n3. 맞춤형 조치 권고\n`;
    const recommendations = [];

    // Logic for recommendations
    if (grade === '위기') recommendations.push('- 지자체 사례회의 긴급 상정 및 통합사례관리 대상자 의뢰');
    if (formData.body_status.includes('불가능') || formData.body_status.includes('보조')) recommendations.push('- 장기요양 등급 신청 안내 및 보조기기(지팡이/보행기) 지원 검토');
    if (JSON.stringify(allRisks).includes('영양') || JSON.stringify(allRisks).includes('식재료') || JSON.stringify(criticalFindings).includes('식사')) recommendations.push('- 결식 예방을 위한 밑반찬 배달 서비스 및 푸드뱅크 연계');
    if (JSON.stringify(allRisks).includes('미끄럼') || JSON.stringify(allRisks).includes('문턱') || JSON.stringify(criticalFindings).includes('낙상')) recommendations.push('- 주거환경개선사업 신청 (안전바 설치, 문턱 제거, 미끄럼방지 매트)');
    if (JSON.stringify(allRisks).includes('위생') || JSON.stringify(allRisks).includes('악취') || JSON.stringify(criticalFindings).includes('쓰레기')) recommendations.push('- 주거 위생 방역 서비스 및 대청소 자원봉사 연계');
    if (criticalFindings.some(f => f.includes('고립') || f.includes('우울') || f.includes('자살'))) recommendations.push('- 정신건강복지센터 상담 의뢰 및 특화서비스(우울예방) 프로그램 연계');
    if (criticalFindings.some(f => f.includes('경제') || f.includes('체납') || f.includes('단전'))) recommendations.push('- 긴급복지생계비 지원 신청 및 공적 부조 상담');

    if (grade === '우수사례') {
      recommendations.push('- 현재 상태 유지를 위한 정기 안부 확인 (주 1회)');
      recommendations.push('- 타 대상자 멘토링 프로그램 참여 권유');
    } else if (recommendations.length === 0) {
      recommendations.push('- 주기적인 생활 실태 점검 및 정서 지원 강화');
      recommendations.push('- 필요시 생활지원사 방문 횟수 증대 검토');
    }

    memo += recommendations.join('\n');

    updateField('final_grade', grade);
    updateField('action_memo', memo);
    showToast('✨ 전문 분석 리포트가 생성되었습니다. 내용을 검토해주세요.', 'success');
  };

  const addHypothesis = () => {
    if (selectedMappingId === null) {
      showToast('⚠️ 목록에서 탐색 질문을 선택해주세요.', 'error');
      return;
    }

    // Find the mapping object
    const serviceType = formData.service_type || '일반 서비스';
    const mappings = SERVICE_HYPOTHESIS_MAPPING[serviceType] || [];
    const selectedItem = mappings.find(m => m.id === selectedMappingId);

    if (!selectedItem) {
      showToast('⚠️ 유효하지 않은 선택입니다.', 'error');
      return;
    }

    const newHypo: Hypothesis = {
      id: Date.now(),
      subjectName: formData.name || '현장 발굴',
      factor: selectedItem.factor,
      outcome: selectedItem.outcome,
      evidence: `[1차 대면] ${selectedItem.visitQ} 질문에 대한 반응`,
      priority: '중간',
      sendToStep2: true,
      status: 'discovered',
      createdAt: new Date().toISOString(),
      causeQ: `Step1_Q${selectedItem.id}`, // Traceability
      effectQ: `Step3_Q${selectedItem.id + 3}` // Mapping logical connection
    };

    setHypotheses([...hypotheses, newHypo]);
    setSelectedMappingId(null);
    showToast(`💡 [${selectedItem.factor} → ${selectedItem.outcome}] 가설이 등록되었습니다.`, 'success');
  };

  const toggleCheck = (field: 'env_check' | 'safety_check', value: string) => {
    const current = formData[field];
    if (current.includes(value)) {
      updateField(field, current.filter(item => item !== value));
    } else {
      updateField(field, [...current, value]);
    }
  };

  const handleIndicatorChange = (id: string, value: string) => {
    updateField('visit_indicators', {
      ...formData.visit_indicators,
      [id]: value
    });
  };

  const currentIndicators = VISIT_INDICATORS[formData.service_type as ServiceType] || VISIT_INDICATORS['일반 서비스'];

  // Get current hypothesis mapping list based on service type
  const currentMappings = SERVICE_HYPOTHESIS_MAPPING[formData.service_type as ServiceType] || SERVICE_HYPOTHESIS_MAPPING['일반 서비스'];

  // Hygiene & Nutrition Risk Items
  const ENV_ITEMS = [
    { label: '의복/위생 불량', value: '위생상태 불량' },
    { label: '집안 내 악취', value: '실내 악취' },
    { label: '냉장고 음식 부패', value: '냉장고 위생 위기' },
    { label: '식재료 전무/부족', value: '영양 불균형' }
  ];

  // Housing Safety Risk Items
  const SAFETY_ITEMS = [
    { label: '바닥 미끄럼', value: '미끄럼 위험' },
    { label: '높은 문턱', value: '이동 장애물' },
    { label: '조명 어두움', value: '조명 시설 불량' },
    { label: '비상연락 미인지', value: '비상연락망 미인지' }
  ];

  // CRUD Handlers
  const handleDeleteTarget = (id: number) => {
    // alert(`Delete requested for ${id}`);
    if (!setRiskTargets) {
      alert('오류: 데이터 저장 기능(setRiskTargets)이 연결되지 않았습니다.');
      console.error('setRiskTargets is missing');
      return;
    }
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setRiskTargets(prev => prev.filter(t => t.id !== id));
      showToast('🗑️ 삭제 완료', 'info');
    }
  };

  const handleAddNewTarget = () => {
    // alert('Add triggered');
    if (!setRiskTargets) {
      alert('오류: 데이터 저장 기능(setRiskTargets)이 연결되지 않았습니다.');
      return;
    }
    if (!formData.name) {
      alert('성명을 입력해주세요.');
      return;
    }
    const newTarget: RiskTarget = {
      id: Date.now(),
      name: formData.name,
      gender: formData.gender,
      birth_year: formData.birth_year,
      agency: formData.agency,
      service_type: formData.service_type,
      riskDetails: formData.action_memo || '현장점검 필요',
      date: new Date().toISOString().split('T')[0],
      address: subjectSummary?.address || '',
      phone: subjectSummary?.phone || '',
      env_check: formData.env_check,
      safety_check: formData.safety_check,
      body_status: formData.body_status,
      visit_indicators: formData.visit_indicators,
      final_grade: formData.final_grade,
      action_memo: formData.action_memo
    };
    setRiskTargets(prev => [...prev, newTarget]);
    showToast('✅ 등록 완료', 'success');
    setIsCreating(false);
  };

  const handleUpdateTarget = () => {
    // alert('Update triggered');
    if (!setRiskTargets) {
      alert('오류: 데이터 저장 기능(setRiskTargets)이 연결되지 않았습니다.');
      return;
    }
    if (!editingTarget) return;

    setRiskTargets(prev => prev.map(t => t.id === editingTarget.id ? {
      ...t, name: formData.name, gender: formData.gender, birth_year: formData.birth_year,
      agency: formData.agency, service_type: formData.service_type, riskDetails: formData.action_memo || t.riskDetails,
      address: subjectSummary?.address || t.address, phone: subjectSummary?.phone || t.phone,
      env_check: formData.env_check, safety_check: formData.safety_check, body_status: formData.body_status,
      visit_indicators: formData.visit_indicators, final_grade: formData.final_grade, action_memo: formData.action_memo
    } : t));
    showToast('✅ 수정 완료', 'success');
    setEditingTarget(null);
  };

  // Lookup a risk target's full info from sheet and show summary
  const handleLookupTarget = async (target: RiskTarget) => {
    if (!scriptUrl) {
      showToast('구글 시트 연동 URL이 설정되지 않았습니다.', 'error');
      return;
    }
    setShowSheetSearch(true);
    setIsLoadingSheet(true);
    setSubjectSummary(null);
    setSearchResults([]);
    try {
      const response = await fetchSheetData(scriptUrl);
      if (response.success && response.data) {
        const rows = response.data.filter((row: any) =>
          row.Name === target.name && row.Agency === target.agency
        );
        if (rows.length > 0) {
          buildSummary(rows);
          // Restore saved address/phone from local risk target
          setSubjectSummary(prev => prev ? {
            ...prev,
            address: target.address || prev.address,
            phone: target.phone || prev.phone
          } : prev);
        } else {
          showToast(`'${target.name}' 어르신의 시트 기록을 찾을 수 없습니다.`, 'info');
        }
      }
    } catch (error) {
      showToast('데이터 조회 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const startEditing = (target: RiskTarget) => {
    setEditingTarget(target);
    updateField('name', target.name);
    updateField('agency', target.agency);
    updateField('gender', target.gender);
    updateField('birth_year', target.birth_year);
    if (target.service_type) updateField('service_type', target.service_type);
    updateField('env_check', target.env_check || []);
    updateField('safety_check', target.safety_check || []);
    updateField('body_status', target.body_status || '자유로운 보행 가능');
    updateField('visit_indicators', target.visit_indicators || {});
    updateField('final_grade', target.final_grade || '');
    updateField('action_memo', target.action_memo || '');
    // showToast(`✏️ ${target.name} 수정모드`);
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Target Management Section */}
      <div className="bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden">
        <div className="bg-red-600 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Users size={20} />
            <h3 className="font-bold">리스크 대상자 ({riskTargets.length}명)</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowTargetList(!showTargetList)} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm">
              {showTargetList ? '접기' : '목록'}
            </button>
            <button
              onClick={() => setShowSheetSearch(!showSheetSearch)}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-amber-900 rounded-lg text-sm font-bold flex items-center gap-1 transition-colors"
            >
              <Search size={14} />
              대상자 조회
            </button>
            {setRiskTargets && (
              <button onClick={() => setIsCreating(true)} className="px-3 py-1.5 bg-white text-red-600 rounded-lg text-sm font-bold flex items-center gap-1">
                <PlusCircle size={14} /> 등록
              </button>
            )}
          </div>
        </div>

        {/* Google Sheet Search & Summary */}
        {showSheetSearch && (
          <div className="p-4 border-t border-amber-200 bg-gradient-to-b from-amber-50 to-white">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                <Search size={16} /> 구글 시트 대상자 조회
              </h4>
              <button onClick={() => { setShowSheetSearch(false); setSheetSearchQuery(''); setSubjectSummary(null); setSearchResults([]); }} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* Search Bar */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="대상자 성명 또는 기관명으로 검색..."
                  value={sheetSearchQuery}
                  onChange={(e) => setSheetSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSheet()}
                  className="w-full pl-9 pr-3 py-2.5 text-sm border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                />
              </div>
              <button
                onClick={handleSearchSheet}
                disabled={isLoadingSheet}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-sm flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                {isLoadingSheet ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                조회
              </button>
            </div>

            {/* Loading */}
            {isLoadingSheet && (
              <div className="text-center py-8 text-slate-400 flex items-center justify-center gap-2">
                <Loader2 size={20} className="animate-spin" /> 구글 시트에서 검색 중...
              </div>
            )}

            {/* Multiple Results List */}
            {searchResults.length > 0 && !isLoadingSheet && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">여러 대상자가 검색되었습니다. 조회할 대상자를 선택하세요.</p>
                <div className="space-y-1">
                  {searchResults.map((r, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectFromResults(r.name, r.agency)}
                      className="w-full text-left p-3 bg-white rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50 transition-all flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-800">{r.name}</span>
                        <span className="text-xs text-slate-500">{r.region} / {r.agency}</span>
                      </div>
                      <span className="text-xs text-amber-600 font-bold">{r.count}건 기록</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Summary Card */}
            {subjectSummary && !isLoadingSheet && (
              <div className="space-y-4 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow">
                      {subjectSummary.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-slate-800">{subjectSummary.name}</span>
                        <span className="text-sm text-slate-500">({subjectSummary.gender}, {subjectSummary.ageGroup || subjectSummary.birthYear + '년생'})</span>
                        {subjectSummary.isRiskTarget && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">리스크 등록</span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 mt-0.5">
                        {subjectSummary.region} · {subjectSummary.agency} · {subjectSummary.serviceType}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 주소 / 전화번호 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">주소</label>
                    <input
                      type="text"
                      placeholder="방문 주소를 입력하세요"
                      value={subjectSummary.address}
                      onChange={(e) => setSubjectSummary(prev => prev ? { ...prev, address: e.target.value } : prev)}
                      className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">전화번호</label>
                    <input
                      type="tel"
                      placeholder="연락처를 입력하세요"
                      value={subjectSummary.phone}
                      onChange={(e) => setSubjectSummary(prev => prev ? { ...prev, phone: e.target.value } : prev)}
                      className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 모니터링 이력 */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">모니터링 이력</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">총 모니터링 횟수</span>
                        <span className="font-bold text-amber-600">{subjectSummary.totalRecords}회</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">최근 조사일</span>
                        <span className="font-medium text-slate-800">{formatKoreanDate(subjectSummary.latestDate)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">담당자</span>
                        <span className="font-medium text-slate-800">{subjectSummary.latestAuthor || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* 서비스 현황 */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">서비스 현황</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">만족도</span>
                        <span className="font-medium text-slate-800">{subjectSummary.latestSatisfaction || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">방문 빈도</span>
                        <span className="font-medium text-slate-800">{subjectSummary.visitFreq || '-'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">전화 빈도</span>
                        <span className="font-medium text-slate-800">{subjectSummary.callFreq || '-'}</span>
                      </div>
                      {subjectSummary.serviceItems && (
                        <div className="pt-1 border-t border-slate-100">
                          <span className="text-xs text-slate-500">서비스 항목: </span>
                          <span className="text-xs text-slate-700">{subjectSummary.serviceItems}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 위험 신호 */}
                  <div className="bg-white rounded-xl p-4 border border-red-100">
                    <h5 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                      <AlertTriangle size={12} /> 위험 신호
                    </h5>
                    {subjectSummary.riskSummaries.length > 0 ? (
                      <div className="space-y-1.5">
                        {subjectSummary.riskSummaries.map((r, i) => (
                          <div key={i} className="text-sm text-red-700 bg-red-50 p-2 rounded-lg border border-red-100">{r}</div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">기록된 위험 신호 없음</p>
                    )}
                    {subjectSummary.specialNotes.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-400">특이사항</span>
                        {subjectSummary.specialNotes.map((n, i) => (
                          <div key={i} className="text-sm text-slate-600 bg-slate-50 p-2 rounded-lg mt-1">{n}</div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 유선 지표 결과 */}
                  <div className="bg-white rounded-xl p-4 border border-slate-200">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">최근 유선 지표</h5>
                    {Object.keys(subjectSummary.indicators).length > 0 ? (
                      <div className="space-y-1.5">
                        {Object.entries(subjectSummary.indicators).map(([label, value]) => (
                          <div key={label} className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">{label}</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              String(value).match(/위기|위험|심각|단절|시급|긴급/) ? 'bg-red-100 text-red-700' :
                              String(value).match(/주의|부족|미흡|심화/) ? 'bg-orange-100 text-orange-700' :
                              'bg-green-50 text-green-700'
                            }`}>{value}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">기록된 지표 없음</p>
                    )}
                  </div>
                </div>

                {/* 기관 소통 이력 */}
                {subjectSummary.agencyResponses.length > 0 && (
                  <div className="bg-white rounded-xl p-4 border border-blue-100">
                    <h5 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">수행기관 답변 이력</h5>
                    {subjectSummary.agencyResponses.map((r, i) => (
                      <div key={i} className="text-sm text-blue-700 bg-blue-50 p-2 rounded-lg border border-blue-100 mb-1">{r}</div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-amber-600 text-center">기본 정보가 자동으로 입력되었습니다. 아래 체크리스트를 진행해주세요.</p>
              </div>
            )}
          </div>
        )}

        {showTargetList && (
          <div className="p-4 overflow-x-auto">
            {riskTargets.length === 0 ? (
              <div className="text-center text-slate-400 py-6">등록된 대상자 없음</div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 text-slate-600">
                  <th className="p-2 text-left">성명</th><th className="p-2 text-left">기관</th><th className="p-2 text-left">판정</th><th className="p-2 text-center">작업</th>
                </tr></thead>
                <tbody>
                  {riskTargets.map(t => (
                    <tr key={t.id} className={`border-b hover:bg-slate-50 ${editingTarget?.id === t.id ? 'bg-amber-50' : ''}`}>
                      <td className="p-2 font-medium">{t.name}</td>
                      <td className="p-2 text-slate-600">{t.agency}</td>
                      <td className="p-2"><span className={`px-2 py-0.5 rounded text-xs font-bold ${t.final_grade === '위기' ? 'bg-red-100 text-red-700' : t.final_grade === '주의' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100'}`}>{t.final_grade || '-'}</span></td>
                      <td className="p-2 flex justify-center gap-1">
                        <button onClick={() => handleLookupTarget(t)} className="p-1 bg-amber-100 text-amber-600 rounded" title="조회"><Eye size={14} /></button>
                        <button onClick={() => startEditing(t)} className="p-1 bg-blue-100 text-blue-600 rounded" title="수정"><Edit size={14} /></button>
                        {setRiskTargets && <button onClick={() => handleDeleteTarget(t.id)} className="p-1 bg-red-100 text-red-600 rounded" title="삭제"><Trash2 size={14} /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {(editingTarget || isCreating) && (
          <div className="p-4 bg-amber-50 border-t border-amber-200 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-amber-800 text-sm font-bold flex items-center gap-2">
                {isCreating ? '🆕 신규 대상자 등록' : `✏️ '${editingTarget?.name}' 정보 수정`}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (isCreating) handleAddNewTarget();
                    else handleUpdateTarget();
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Save size={16} /> {isCreating ? '등록 완료' : '수정 저장'}
                </button>
                <button
                  onClick={() => { setEditingTarget(null); setIsCreating(false); }}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-600 font-bold rounded-lg flex items-center gap-1 hover:bg-slate-50 transition-colors"
                >
                  <X size={16} /> 취소
                </button>
              </div>
            </div>

            {/* Inline Editor for Core Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-3 rounded-lg border border-amber-100">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">성명 (필수)</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full border-slate-300 rounded-md text-sm p-2 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="대상자 성명 입력"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">수행기관</label>
                <input
                  type="text"
                  value={formData.agency || ''}
                  onChange={(e) => updateField('agency', e.target.value)}
                  className="w-full border-slate-300 rounded-md text-sm p-2 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="수행기관명"
                />
              </div>
            </div>
            <p className="text-xs text-amber-600">* 하단의 체크리스트와 상세 내용을 모두 작성한 후 '저장'을 눌러주세요.</p>
          </div>
        )}

        {!editingTarget && !isCreating && riskTargets.length > 0 && (
          <div className="p-3 border-t flex items-center gap-2">
            <span className="text-xs text-slate-500">불러오기:</span>
            <select onChange={handleTargetSelect} className="text-sm p-1.5 border rounded flex-1">
              <option value="">선택...</option>
              {riskTargets.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column: Screening & Result (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card title="🏠 환경 및 신체 스크리닝" color="red">
            <div className="space-y-6">
              {/* 1. Hygiene & Nutrition */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-rose-800 mb-3 bg-rose-50 p-2 rounded-lg">
                  <AlertTriangle size={16} /> 위생 및 영양 리스크
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ENV_ITEMS.map(item => (
                    <button
                      key={item.value}
                      onClick={() => toggleCheck('env_check', item.value)}
                      className={`p-2.5 rounded-lg text-xs font-medium border transition-all ${formData.env_check.includes(item.value)
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Housing Safety */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-rose-800 mb-3 bg-rose-50 p-2 rounded-lg">
                  <AlertTriangle size={16} /> 주거 안전 리스크
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SAFETY_ITEMS.map(item => (
                    <button
                      key={item.value}
                      onClick={() => toggleCheck('safety_check', item.value)}
                      className={`p-2.5 rounded-lg text-xs font-medium border transition-all ${formData.safety_check.includes(item.value)
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Physical Function */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">신체 기능 수준</label>
                <div className="space-y-2">
                  {['자유로운 보행 가능', '보조가 필요한 상태', '거동이 불가능한 위기'].map((status) => (
                    <div
                      key={status}
                      onClick={() => updateField('body_status', status)}
                      className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${formData.body_status === status
                        ? 'bg-rose-50 border-rose-500 text-rose-900 ring-1 ring-rose-500'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                      <span className="text-sm font-medium">{status}</span>
                      {formData.body_status === status && <CheckCircle2 size={16} className="text-rose-600" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card title="🚩 자동 판정 결과" color="red">
            <div className="flex flex-col gap-6">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-center">
                <div className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">시스템 분석 판정</div>
                <div className={`text-4xl font-black transition-all duration-300 ${formData.final_grade === '위기' ? 'text-red-600' :
                  formData.final_grade === '주의' ? 'text-orange-500' :
                    formData.final_grade === '우수사례' ? 'text-blue-600' :
                      formData.final_grade ? 'text-green-600' : 'text-slate-300'
                  }`}>
                  {formData.final_grade || '판정 대기'}
                </div>
              </div>

              <div className="flex-grow">
                <label className="block text-sm font-bold text-slate-700 mb-2">조치 계획 (AI 자동 생성)</label>
                <textarea
                  value={formData.action_memo}
                  onChange={(e) => updateField('action_memo', e.target.value)}
                  className="w-full text-sm border-slate-200 rounded-lg bg-white p-3 focus:ring-2 focus:ring-rose-500 outline-none resize-none h-40 leading-relaxed shadow-inner"
                  placeholder="분석 리포트 생성 시 전문가 수준의 소견이 자동 작성됩니다."
                />
              </div>

              <button
                onClick={autoGenerateReport}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Activity size={18} /> 정밀 분석 리포트 자동 생성
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column: 10 Precision Indicators (5 Cols) */}
        <div className="lg:col-span-5 h-full">
          <Card title={`🔍 [${formData.service_type}] 10대 정밀 지표 점검`} color="red" className="h-full border-rose-200 bg-rose-50/30">
            <div className="space-y-4">
              {currentIndicators.map((ind) => (
                <div key={ind.id} className="bg-white p-3 rounded-lg border border-rose-100 shadow-sm">
                  <label className="block text-xs font-bold text-rose-900 mb-2">{ind.label}</label>
                  <select
                    value={formData.visit_indicators?.[ind.id] || ''}
                    onChange={(e) => handleIndicatorChange(ind.id, e.target.value)}
                    className={`w-full p-2 text-sm border rounded focus:ring-2 focus:ring-rose-500 outline-none ${formData.visit_indicators?.[ind.id]?.match(/위기|위험|심각|단절|시급|긴급|발견|거부|고위험|직접적|극심|차단|부재|욕창|붕괴|은둔|적대적|공포|절망|포기/)
                      ? 'bg-red-50 border-red-300 text-red-700 font-bold'
                      : formData.visit_indicators?.[ind.id]?.match(/주의|부족|미흡|심화|과잉|필요|갈등|부실|회피|무력함|고립|간접적|미숙지|체납|미비|검토|염려|오남용|불안|무망|저조|불신|이탈/)
                        ? 'bg-orange-50 border-orange-300 text-orange-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-700'
                      }`}
                  >
                    <option value="">상태 선택...</option>
                    {ind.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Improved Hypothesis Discovery Section using Mapping */}
      <div className="bg-white rounded-xl shadow-lg border border-emerald-100 overflow-hidden mt-8 relative z-10">
        <div className="bg-emerald-600 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Lightbulb className="text-yellow-300" />
            <h3 className="font-bold text-lg">Step 1: 리스크 가설 발굴 (표준 인터뷰 가이드)</h3>
          </div>
          <span className="text-emerald-100 text-xs bg-emerald-700 px-2 py-1 rounded">서비스 유형별 질문 매핑</span>
        </div>

        <div className="p-6">
          <div className="mb-4 text-sm text-slate-500 bg-slate-50 p-3 rounded border border-slate-200 flex items-start gap-2">
            <HelpCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            <span>
              어르신께 아래의 <b>탐색 질문(Step 1)</b>을 건네보세요. 질문을 클릭하면 관련된 가설이 자동으로 수립됩니다.
              이 가설은 추후 온라인 설문을 통해 통계적으로 검증됩니다.
            </span>
          </div>

          {/* Question Selection Grid */}
          <div className="grid grid-cols-1 gap-3 mb-6">
            {currentMappings.map(item => (
              <button
                key={item.id}
                onClick={() => setSelectedMappingId(item.id)}
                className={`text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${selectedMappingId === item.id
                  ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-md'
                  : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-sm'
                  }`}
              >
                <div className="flex-1">
                  <span className="text-xs font-bold text-emerald-600 mb-1 block">탐색 질문 {item.id}</span>
                  <p className="font-medium text-slate-800 text-sm">"{item.visitQ}"</p>
                  {selectedMappingId === item.id && (
                    <div className="mt-3 pt-3 border-t border-emerald-200 text-xs text-emerald-800 animate-fade-in">
                      <span className="font-bold mr-1">↳ 수립 가설:</span> {item.hypothesis}
                    </div>
                  )}
                </div>
                {selectedMappingId === item.id && <CheckCircle2 size={20} className="text-emerald-600 ml-3" />}
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={addHypothesis}
              disabled={selectedMappingId === null}
              className={`px-8 py-3 rounded-lg font-bold shadow transition-all flex items-center gap-2 ${selectedMappingId !== null
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white transform active:scale-95'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
            >
              선택한 가설 등록 <ArrowRight size={16} />
            </button>
          </div>

          {/* List of Discovered Hypotheses */}
          <div className="mt-6 space-y-3 pt-6 border-t border-slate-100">
            <h4 className="text-sm font-bold text-slate-700 mb-2">등록된 검증용 가설 목록</h4>
            {hypotheses.filter(h => h.status === 'discovered').map(h => (
              <div key={h.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-emerald-50 p-4 rounded-lg border border-emerald-100 group hover:border-emerald-300 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">{h.factor} → {h.outcome}</span>
                    <span className="text-xs text-slate-500">출처: {h.subjectName} / 근거: {h.evidence}</span>
                  </div>
                </div>
                <span className="mt-2 sm:mt-0 text-xs font-bold text-emerald-600 bg-white px-2 py-1 rounded border border-emerald-200 self-start sm:self-auto">검증 대기</span>
              </div>
            ))}
            {hypotheses.filter(h => h.status === 'discovered').length === 0 && (
              <div className="text-center text-sm text-slate-400 py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                아직 등록된 가설이 없습니다. 위 목록에서 질문을 선택하세요.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitMode;
