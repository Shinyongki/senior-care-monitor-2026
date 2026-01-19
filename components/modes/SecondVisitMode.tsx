
import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { FormDataState, Hypothesis, Candidate } from '../../types';
import { INTERVIEW_QUESTIONS, REGION_AGENCY_MAP } from '../../constants';
import { UserCheck, MessageCircle, TrendingUp, AlertCircle, Star, GitCompare, Users, PlusCircle, Edit, Trash2, Save, X } from 'lucide-react';

interface SecondVisitModeProps {
  formData: FormDataState;
  updateField: (field: keyof FormDataState, value: any) => void;
  hypotheses: Hypothesis[];
  setHypotheses: React.Dispatch<React.SetStateAction<Hypothesis[]>>;
  candidates: Candidate[];
  setCandidates?: React.Dispatch<React.SetStateAction<Candidate[]>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const SecondVisitMode: React.FC<SecondVisitModeProps> = ({
  formData, updateField, hypotheses, setHypotheses, candidates, setCandidates, showToast
}) => {

  // CRUD State
  const [showCandidateList, setShowCandidateList] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // When a candidate is selected, populate the form
  const handleCandidateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const candidateId = Number(e.target.value);
    if (!candidateId) return;

    const selected = candidates.find(c => c.id === candidateId);
    if (selected) {
      populateFormFromCandidate(selected);
      showToast(`🎯 '${selected.name}' 대상자 정보 및 심층 면접 결과를 불러왔습니다.`, 'success');
    }
  };

  const populateFormFromCandidate = (selected: Candidate) => {
    updateField('name', selected.name);
    updateField('agency', selected.agency);
    updateField('gender', selected.gender);
    updateField('birth_year', selected.birth_year);
    updateField('visit2_reason', selected.reasonType || '데이터불일치');

    // Auto-set region based on agency
    const region = Object.keys(REGION_AGENCY_MAP).find(r =>
      REGION_AGENCY_MAP[r].includes(selected.agency)
    );
    if (region) updateField('region', region);

    // Populate Service Type (Critical for Dynamic Questions)
    if (selected.service_type) updateField('service_type', selected.service_type);

    // Populate Interview Data
    updateField('track_stability', selected.track_stability || '개선');
    updateField('track_emotion', selected.track_emotion || '개선');
    updateField('track_social', selected.track_social || '개선');
    updateField('track_health', selected.track_health || '개선');
    updateField('interview_answers', selected.interview_answers || {});
    updateField('interviewer_opinion', selected.interviewer_opinion || '');
  };

  const handleAnswerChange = (id: string, value: string) => {
    updateField('interview_answers', {
      ...formData.interview_answers,
      [id]: value
    });
  };

  // CRUD Handlers
  const handleDeleteCandidate = (id: number) => {
    if (!setCandidates) {
      showToast('⚠️ 데이터 저장 기능이 연결되지 않았습니다.', 'error');
      return;
    }
    if (window.confirm('정말 삭제하시겠습니까?')) {
      setCandidates(prev => prev.filter(c => c.id !== id));
      showToast('🗑️ 삭제 완료', 'info');
    }
  };

  const handleAddNewCandidate = () => {
    if (!setCandidates) {
      showToast('⚠️ 데이터 저장 기능이 연결되지 않았습니다.', 'error');
      return;
    }
    if (!formData.name) {
      showToast('⚠️ 성명을 입력해주세요.', 'error');
      return;
    }
    const newCandidate: Candidate = {
      id: Date.now(),
      name: formData.name,
      gender: formData.gender,
      birth_year: formData.birth_year,
      agency: formData.agency,
      service_type: formData.service_type,
      reason: formData.interviewer_opinion || '심층면접 대상',
      reasonType: formData.visit2_reason as '성과우수군' | '데이터불일치' | '특이사례' || '데이터불일치',
      track_stability: formData.track_stability as string,
      track_emotion: formData.track_emotion as string,
      track_social: formData.track_social as string,
      track_health: formData.track_health as string,
      interview_answers: formData.interview_answers,
      interviewer_opinion: formData.interviewer_opinion
    };
    setCandidates(prev => [...prev, newCandidate]);
    showToast('✅ 등록 완료', 'success');
    setIsCreating(false);
  };

  const handleUpdateCandidate = () => {
    if (!setCandidates) {
      showToast('⚠️ 데이터 저장 기능이 연결되지 않았습니다.', 'error');
      return;
    }
    if (!editingCandidate) return;

    setCandidates(prev => prev.map(c => c.id === editingCandidate.id ? {
      ...c,
      name: formData.name,
      gender: formData.gender,
      birth_year: formData.birth_year,
      agency: formData.agency,
      service_type: formData.service_type,
      reason: formData.interviewer_opinion || c.reason,
      reasonType: formData.visit2_reason as '성과우수군' | '데이터불일치' | '특이사례' || c.reasonType,
      track_stability: formData.track_stability as string,
      track_emotion: formData.track_emotion as string,
      track_social: formData.track_social as string,
      track_health: formData.track_health as string,
      interview_answers: formData.interview_answers,
      interviewer_opinion: formData.interviewer_opinion
    } : c));
    showToast('✅ 수정 완료', 'success');
    setEditingCandidate(null);
  };

  const startEditing = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    populateFormFromCandidate(candidate);
  };

  const currentQuestions = INTERVIEW_QUESTIONS[formData.visit2_reason as keyof typeof INTERVIEW_QUESTIONS] || INTERVIEW_QUESTIONS['성과우수군'];

  const TRACKING_ITEMS = [
    {
      key: 'track_stability',
      label: '생활 안정성 (Living Stability)',
      desc: '규칙적 식사, 주거 청결, 경제적 불안 해소 등 일상 유지 능력',
      icon: '🏠'
    },
    {
      key: 'track_emotion',
      label: '정서 상태 (Emotional State)',
      desc: '우울/고독감 감소, 표정 밝아짐, 삶의 의욕 표현',
      icon: '😊'
    },
    {
      key: 'track_social',
      label: '사회적 교류 (Social Interaction)',
      desc: '이웃 대화, 경로당/복지관 방문, 자녀 연락 빈도 증가',
      icon: '🤝'
    },
    {
      key: 'track_health',
      label: '건강/자기관리 (Health)',
      desc: '복약 순응도 향상, 통증 자가관리, 병원 정기 방문',
      icon: '💊'
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Candidate Management Section */}
      <div className="bg-white rounded-xl shadow-lg border border-violet-200 overflow-hidden">
        <div className="bg-violet-600 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Users size={20} />
            <h3 className="font-bold">심층면접 대상자 ({candidates.length}명)</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCandidateList(!showCandidateList)} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm">
              {showCandidateList ? '접기' : '목록'}
            </button>
            {setCandidates && (
              <button onClick={() => setIsCreating(true)} className="px-3 py-1.5 bg-white text-violet-600 rounded-lg text-sm font-bold flex items-center gap-1">
                <PlusCircle size={14} /> 등록
              </button>
            )}
          </div>
        </div>

        {showCandidateList && (
          <div className="p-4 overflow-x-auto">
            {candidates.length === 0 ? (
              <div className="text-center text-slate-400 py-6">등록된 대상자 없음</div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="bg-slate-50 text-slate-600">
                  <th className="p-2 text-left">성명</th><th className="p-2 text-left">기관</th><th className="p-2 text-left">유형</th><th className="p-2 text-center">작업</th>
                </tr></thead>
                <tbody>
                  {candidates.map(c => (
                    <tr key={c.id} className={`border-b hover:bg-slate-50 ${editingCandidate?.id === c.id ? 'bg-amber-50' : ''}`}>
                      <td className="p-2 font-medium">{c.name}</td>
                      <td className="p-2 text-slate-600">{c.agency}</td>
                      <td className="p-2"><span className={`px-2 py-0.5 rounded text-xs font-bold ${c.reasonType === '성과우수군' ? 'bg-yellow-100 text-yellow-700' :
                          c.reasonType === '데이터불일치' ? 'bg-blue-100 text-blue-700' :
                            c.reasonType === '특이사례' ? 'bg-red-100 text-red-700' : 'bg-slate-100'
                        }`}>{c.reasonType || '-'}</span></td>
                      <td className="p-2 flex justify-center gap-1">
                        <button onClick={() => startEditing(c)} className="p-1 bg-blue-100 text-blue-600 rounded"><Edit size={14} /></button>
                        {setCandidates && <button onClick={() => handleDeleteCandidate(c.id)} className="p-1 bg-red-100 text-red-600 rounded"><Trash2 size={14} /></button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {(editingCandidate || isCreating) && (
          <div className="p-4 bg-amber-50 border-t border-amber-200 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-amber-800 text-sm font-bold flex items-center gap-2">
                {isCreating ? '🆕 신규 대상자 등록' : `✏️ '${editingCandidate?.name}' 정보 수정`}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (isCreating) handleAddNewCandidate();
                    else handleUpdateCandidate();
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex items-center gap-1 shadow-sm transition-colors"
                >
                  <Save size={16} /> {isCreating ? '등록 완료' : '수정 저장'}
                </button>
                <button
                  onClick={() => { setEditingCandidate(null); setIsCreating(false); }}
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
            <p className="text-xs text-amber-600">* 하단의 면접 내용을 모두 작성한 후 '저장'을 눌러주세요.</p>
          </div>
        )}

        {!editingCandidate && !isCreating && candidates.length > 0 && (
          <div className="p-3 border-t flex items-center gap-2">
            <span className="text-xs text-slate-500">불러오기:</span>
            <select onChange={handleCandidateSelect} className="text-sm p-1.5 border rounded flex-1">
              <option value="">선택...</option>
              {candidates.map(c => <option key={c.id} value={c.id}>[{c.reasonType || '미지정'}] {c.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <Card title="🎯 임팩트 추적 심층 면접" color="violet">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          {/* Left: Reason (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <label className="block text-sm font-bold text-violet-900 mb-2">방문 선정 사유 (자동 분류)</label>
            <div className="flex flex-col gap-2">
              {['성과우수군', '데이터불일치', '특이사례'].map(r => {
                let Icon = GitCompare;
                let colorClass = 'text-slate-500';
                if (r === '성과우수군') { Icon = Star; colorClass = 'text-yellow-500'; }
                if (r === '데이터불일치') { Icon = TrendingUp; colorClass = 'text-blue-500'; }
                if (r === '특이사례') { Icon = AlertCircle; colorClass = 'text-red-500'; }

                const isSelected = formData.visit2_reason === r;
                return (
                  <label key={r} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                    ? 'bg-violet-50 border-violet-500 ring-1 ring-violet-500 shadow-sm'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}>
                    <input
                      type="radio"
                      name="visit2_reason"
                      value={r}
                      checked={isSelected}
                      onChange={() => updateField('visit2_reason', r)}
                      className="text-violet-600 focus:ring-violet-500 h-4 w-4"
                    />
                    <Icon size={16} className={isSelected ? 'text-violet-700' : colorClass} />
                    <div className="flex flex-col">
                      <span className={`text-sm font-bold ${isSelected ? 'text-violet-900' : 'text-slate-700'}`}>{r}</span>
                      <span className="text-[10px] text-slate-400">
                        {r === '성과우수군' && '만족도 최상위'}
                        {r === '데이터불일치' && '위험군이나 결과 좋음'}
                        {r === '특이사례' && '복합 위험 및 민원'}
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Right: Tracking (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <label className="block text-sm font-bold text-violet-900 mb-2 flex items-center gap-2">
              <TrendingUp size={16} /> Before/After 변화 추적 (서비스 이용 전 대비)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TRACKING_ITEMS.map(item => (
                <div key={item.key} className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-violet-300 transition-colors">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">{item.icon}</span>
                    <div>
                      <span className="text-xs font-bold text-slate-700 block">{item.label}</span>
                      <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">{item.desc}</span>
                    </div>
                  </div>
                  <select
                    value={formData[item.key as keyof FormDataState] as string}
                    onChange={(e) => updateField(item.key as keyof FormDataState, e.target.value)}
                    className="w-full text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500 outline-none p-2 font-medium"
                  >
                    <option value="개선">선택하세요</option>
                    <option value="크게 개선">↑↑ 크게 개선 (매우 좋아짐)</option>
                    <option value="개선">↑ 개선 (조금 나아짐)</option>
                    <option value="유지">- 유지 (변화 없음)</option>
                    <option value="악화">↓ 악화 (나빠짐)</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Structured Interview Section */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h4 className="flex items-center gap-2 font-bold text-violet-800 mb-4 bg-violet-50 p-2 rounded-lg inline-block">
            <MessageCircle size={18} /> [{formData.visit2_reason}] 심층 면접 질문
          </h4>
          <div className="space-y-6">
            {currentQuestions.map((q) => (
              <div key={q.id}>
                <label className="block text-sm font-bold text-slate-700 mb-1">{q.label}</label>
                <p className="text-xs text-slate-500 mb-2">{q.text}</p>
                <textarea
                  value={formData.interview_answers?.[q.id] || ''}
                  onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                  rows={3}
                  placeholder={q.placeholder}
                  className="w-full text-sm border-slate-200 rounded-lg p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-inner"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <label className="block text-sm font-bold text-slate-700 mb-3">면접자 종합 의견</label>
          <textarea
            className="w-full text-sm border-slate-200 rounded-xl p-4 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-violet-500 outline-none transition-all shadow-inner"
            rows={4}
            placeholder="위 인터뷰 내용을 바탕으로 종합적인 의견을 기술하세요."
            value={formData.interviewer_opinion}
            onChange={(e) => updateField('interviewer_opinion', e.target.value)}
          />
        </div>
      </Card>
    </div>
  );
};

export default SecondVisitMode;
