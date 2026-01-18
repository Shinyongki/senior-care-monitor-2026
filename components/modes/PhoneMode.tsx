
import React from 'react';
import { Card } from '../ui/Card';
import { FormDataState, ServiceType, RiskTarget, PhoneCallRecord } from '../../types';
import { PHONE_INDICATORS } from '../../constants';
import { Zap, AlertTriangle, ArrowRight, CheckCircle2, PhoneIncoming, AlertCircle } from 'lucide-react';

interface PhoneModeProps {
  formData: FormDataState;
  updateField: (field: keyof FormDataState, value: any) => void;
  riskTargets: RiskTarget[];
  setRiskTargets: React.Dispatch<React.SetStateAction<RiskTarget[]>>;
  phoneLog?: PhoneCallRecord[]; // Optional for backward compatibility
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const PhoneMode: React.FC<PhoneModeProps> = ({
  formData, updateField, riskTargets, setRiskTargets, phoneLog = [], showToast
}) => {

  const handleCheck = (val: string) => {
    const current = formData.service_items || [];
    if (current.includes(val)) {
      updateField('service_items', current.filter(item => item !== val));
    } else {
      updateField('service_items', [...current, val]);
    }
  };

  const handleIndicatorChange = (id: string, value: string) => {
    updateField('phone_indicators', {
      ...formData.phone_indicators,
      [id]: value
    });
  };

  const loadRecord = (record: PhoneCallRecord) => {
    updateField('name', record.name);
    updateField('agency', record.agency);
    updateField('gender', record.gender);
    updateField('birth_year', record.birth_year);

    if (record.service_type) updateField('service_type', record.service_type);

    updateField('satisfaction', record.satisfaction || '만족');
    updateField('service_items', record.service_items || []);
    updateField('visit_count', record.visit_count || '주 1회 이상');
    updateField('call_count', record.call_count || '주 1회');
    updateField('phone_indicators', record.phone_indicators || {});

    updateField('safety_trend', record.safety_trend || '');
    updateField('special_notes', record.special_notes || '');

    showToast(`📞 '${record.name}' 어르신의 통화 기록을 불러왔습니다.`);
  };

  const registerRiskTarget = () => {
    if (!formData.name) {
      showToast('⚠️ 대상자 성명을 먼저 입력해주세요.', 'error');
      return;
    }

    // Check duplicates
    if (riskTargets.some(t => t.name === formData.name)) {
      showToast('⚠️ 이미 1차 대면 대상자로 등록된 어르신입니다.', 'info');
      return;
    }

    // Calculate Risk Details
    let risks = [];
    if (formData.satisfaction === '불만족') risks.push('만족도 저하');
    if (formData.safety_trend && formData.safety_trend.length > 5) risks.push('안전 동향 특이사항');

    // Analyze Indicators
    const indicators = PHONE_INDICATORS[formData.service_type as ServiceType] || [];
    indicators.forEach(ind => {
      const val = formData.phone_indicators?.[ind.id];
      if (val && (val.includes('불안') || val.includes('고립') || val.includes('어려움') || val.includes('불만족') || val.includes('발견'))) {
        risks.push(val);
      }
    });

    const riskSummary = risks.length > 0 ? risks.join(', ') : '예방적 차원의 점검 필요';

    const newTarget: RiskTarget = {
      id: Date.now(),
      name: formData.name,
      gender: formData.gender,
      birth_year: formData.birth_year,
      agency: formData.agency,
      riskDetails: riskSummary,
      date: new Date().toISOString().split('T')[0]
    };

    setRiskTargets([...riskTargets, newTarget]);

    // Set flag to mark this person as a risk target in forms/sheets
    updateField('is_risk_target', true);

    showToast(`🚩 '${formData.name}' 어르신을 1차 대면 대상자로 등록했습니다. (사유: ${riskSummary})`, 'success');
  };

  // Get current indicators based on service type
  const currentIndicators = PHONE_INDICATORS[formData.service_type as ServiceType] || PHONE_INDICATORS['일반 서비스'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">

      {/* Sidebar: Monitoring List */}
      <div className="lg:col-span-1 order-2 lg:order-1">
        <Card title={`대상자 모니터링 목록 (${phoneLog.length}명)`} color="blue" className="h-full max-h-[800px] flex flex-col">
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
            {phoneLog.length > 0 ? phoneLog.map(record => (
              <div
                key={record.id}
                onClick={() => loadRecord(record)}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${record.status === 'risk'
                  ? 'bg-red-50 border-red-200 hover:bg-red-100'
                  : 'bg-white border-slate-100 hover:bg-blue-50 hover:border-blue-200'
                  }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800 text-sm">{record.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${record.status === 'risk'
                    ? 'bg-white text-red-600 border-red-200'
                    : 'bg-green-100 text-green-700 border-green-200'
                    }`}>
                    {record.status === 'risk' ? '위험 감지' : '완료'}
                  </span>
                </div>
                <div className="text-xs text-slate-500 truncate mb-1">{record.agency}</div>
                {record.status === 'risk' && (
                  <div className="text-[10px] text-red-500 flex items-center gap-1">
                    <AlertCircle size={10} /> {record.summary}
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-10 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                <PhoneIncoming size={32} className="mx-auto mb-2 opacity-50" />
                <p>생성된 목록이 없습니다.</p>
                <p className="text-xs mt-1">설정 {'>'} 시뮬레이션을 실행하세요.</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Main Form Area */}
      <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
        {/* Service Status Check */}
        <Card title="📊 서비스 실태 점검" color="blue">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">서비스 만족도</label>
              <div className="flex flex-wrap gap-2">
                {['매우만족', '만족', '보통', '불만족'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => updateField('satisfaction', opt)}
                    className={`px-3 py-1.5 rounded text-sm border ${formData.satisfaction === opt ? 'bg-blue-100 border-blue-500 text-blue-800 font-bold' : 'bg-white border-slate-300 text-slate-600'
                      }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">주요 제공 서비스</label>
              <div className="grid grid-cols-2 gap-2">
                {['안전지원(안전안부확인, 생활안전점검)', '안전지원(정보제공, 말벗_정서지원)', '사회참여(문화여가 활동, 자조모임)', '생활교육(건강/영양보건교육, 우울예방, 인지활동/치매예방)', '일상생활지원(가사지원_식사 청소관리, 이동활동지원)', '연계서비스(건강지원,주거개선,생활지원 연계)'].map(item => (
                  <label key={item} className="flex items-center gap-2 text-sm bg-slate-50 p-2 rounded border hover:bg-slate-100 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.service_items || []).includes(item)}
                      onChange={() => handleCheck(item)}
                      className="rounded text-blue-600"
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">방문 빈도</label>
                <select
                  value={formData.visit_count}
                  onChange={(e) => updateField('visit_count', e.target.value)}
                  className="w-full text-sm border-slate-300 rounded"
                >
                  <option value="주 1회">주 1회</option>
                  <option value="주 2회">주 2회</option>
                  <option value="주 3회">주 3회</option>
                  <option value="자주">자주</option>
                  <option value="매일">매일</option>
                  <option value="미제공">미제공</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">유선 빈도</label>
                <select
                  value={formData.call_count}
                  onChange={(e) => updateField('call_count', e.target.value)}
                  className="w-full text-sm border-slate-300 rounded"
                >
                  <option value="주 1회">주 1회</option>
                  <option value="주 2회">주 2회</option>
                  <option value="주 3회">주 3회</option>
                  <option value="자주">자주</option>
                  <option value="매일">매일</option>
                  <option value="미제공">미제공</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Dynamic Key Performance Indicators */}
        <Card title={`💡 [${formData.service_type}] 핵심 성과 점검`} color="blue" className="bg-blue-50/50">
          <div className="space-y-4">
            {currentIndicators.map((ind) => (
              <div key={ind.id}>
                <label className="block text-xs font-bold text-blue-800 mb-1.5 flex items-center gap-1">
                  <Zap size={12} className="text-amber-500" /> {ind.label}
                </label>
                <select
                  value={formData.phone_indicators?.[ind.id] || ''}
                  onChange={(e) => handleIndicatorChange(ind.id, e.target.value)}
                  className="w-full p-2 text-sm bg-white border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">선택하세요</option>
                  {ind.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            ))}
          </div>
        </Card>

        {/* Safety & Notes */}
        <Card title="🏥 안전 동향 및 특이사항" color="blue">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">안전/건강/주거 동향</label>
              <textarea
                value={formData.safety_trend}
                onChange={(e) => updateField('safety_trend', e.target.value)}
                rows={3}
                className="w-full text-sm border-slate-300 rounded focus:ring-blue-500"
                placeholder="예: 최근 허리 통증으로 거동 불편 호소, 보일러 소음 발생 등"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">민원 및 특이사항</label>
              <textarea
                value={formData.special_notes}
                onChange={(e) => updateField('special_notes', e.target.value)}
                rows={3}
                className="w-full text-sm border-slate-300 rounded focus:ring-blue-500"
                placeholder="예: 병원 동행(내과) 일정 조율 필요, 김치/쌀 후원 요청 등"
              />
            </div>
          </div>
        </Card>

        {/* Risk Assessment & Escalation */}
        <Card title="🚨 후속 조치 판정" color="red" className="border-red-200 bg-red-50/30">
          <div className="flex flex-col gap-3">
            <div className="text-xs text-red-800 leading-relaxed">
              <AlertTriangle size={14} className="inline mr-1 mb-0.5" />
              위 상담 내용을 바탕으로 <b>추가적인 위험이 감지되거나 심층 점검이 필요한 경우</b>, 1차 대면(현장 점검) 대상자로 등록하십시오.
            </div>
            <button
              onClick={registerRiskTarget}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
            >
              1차 대면(현장 점검) 대상자로 등록 <ArrowRight size={16} />
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PhoneMode;
