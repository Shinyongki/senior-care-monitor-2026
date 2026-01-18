
import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { FormDataState, Hypothesis, ServiceType, RiskTarget } from '../../types';
import { RISK_FACTORS, OUTCOMES, VISIT_INDICATORS, REGION_AGENCY_MAP, SERVICE_HYPOTHESIS_MAPPING } from '../../constants';
import { AlertTriangle, Lightbulb, CheckCircle2, Activity, Globe, UserPlus, HelpCircle, ArrowRight } from 'lucide-react';

interface VisitModeProps {
  formData: FormDataState;
  updateField: (field: keyof FormDataState, value: any) => void;
  hypotheses: Hypothesis[];
  setHypotheses: React.Dispatch<React.SetStateAction<Hypothesis[]>>;
  riskTargets?: RiskTarget[]; // Optional for backward compatibility if needed, but App provides it
  showToast: (msg: string, type?: 'success'|'error'|'info') => void;
}

const VisitMode: React.FC<VisitModeProps> = ({ 
  formData, updateField, hypotheses, setHypotheses, riskTargets = [], showToast 
}) => {
  // New state to track selected question from the mapping
  const [selectedMappingId, setSelectedMappingId] = useState<number | null>(null);

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

    Object.values(indicators).forEach(val => {
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

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Target Selection Section */}
      {riskTargets.length > 0 && (
        <div className="bg-red-600 p-4 rounded-xl shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-3">
             <div className="bg-white/20 p-2 rounded-full"><UserPlus size={20}/></div>
             <div>
               <h3 className="font-bold">현장 점검 대상자 불러오기</h3>
               <p className="text-red-100 text-xs">유선 모니터링에서 식별된 리스크 대상자를 선택하세요.</p>
             </div>
           </div>
           <select 
             onChange={handleTargetSelect}
             className="text-slate-800 text-sm p-2 rounded-lg border-none outline-none w-full md:w-64"
           >
             <option value="">대상자 선택...</option>
             {riskTargets.map(t => (
               <option key={t.id} value={t.id}>{t.name} (사유: {t.riskDetails.substring(0, 15)}...)</option>
             ))}
           </select>
        </div>
      )}

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
                          className={`p-2.5 rounded-lg text-xs font-medium border transition-all ${
                          formData.env_check.includes(item.value)
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
                          className={`p-2.5 rounded-lg text-xs font-medium border transition-all ${
                          formData.safety_check.includes(item.value)
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
                        className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                            formData.body_status === status
                            ? 'bg-rose-50 border-rose-500 text-rose-900 ring-1 ring-rose-500'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                        >
                        <span className="text-sm font-medium">{status}</span>
                        {formData.body_status === status && <CheckCircle2 size={16} className="text-rose-600"/>}
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
                        <div className={`text-4xl font-black transition-all duration-300 ${
                        formData.final_grade === '위기' ? 'text-red-600' :
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
                                className={`w-full p-2 text-sm border rounded focus:ring-2 focus:ring-rose-500 outline-none ${
                                    formData.visit_indicators?.[ind.id]?.match(/위기|위험|심각|단절|시급|긴급|발견|거부|고위험|직접적|극심|차단|부재|욕창|붕괴|은둔|적대적|공포|절망|포기/)
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
             <HelpCircle size={16} className="text-emerald-500 mt-0.5 shrink-0"/>
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
                    className={`text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${
                        selectedMappingId === item.id 
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
                    {selectedMappingId === item.id && <CheckCircle2 size={20} className="text-emerald-600 ml-3"/>}
                 </button>
             ))}
          </div>
          
          <div className="flex justify-end">
            <button 
              onClick={addHypothesis}
              disabled={selectedMappingId === null}
              className={`px-8 py-3 rounded-lg font-bold shadow transition-all flex items-center gap-2 ${
                  selectedMappingId !== null 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white transform active:scale-95' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              선택한 가설 등록 <ArrowRight size={16}/>
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
