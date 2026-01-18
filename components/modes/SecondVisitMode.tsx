
import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { FormDataState, Hypothesis, Candidate } from '../../types';
import { INTERVIEW_QUESTIONS, REGION_AGENCY_MAP } from '../../constants';
import { UserCheck, MessageCircle, TrendingUp, AlertCircle, Star, GitCompare } from 'lucide-react';

interface SecondVisitModeProps {
  formData: FormDataState;
  updateField: (field: keyof FormDataState, value: any) => void;
  hypotheses: Hypothesis[];
  setHypotheses: React.Dispatch<React.SetStateAction<Hypothesis[]>>;
  candidates: Candidate[];
  showToast: (msg: string) => void;
}

const SecondVisitMode: React.FC<SecondVisitModeProps> = ({
  formData, updateField, hypotheses, setHypotheses, candidates, showToast
}) => {

  // When a candidate is selected, populate the form
  const handleCandidateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const candidateId = Number(e.target.value);
    if (!candidateId) return;

    const selected = candidates.find(c => c.id === candidateId);
    if (selected) {
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

      showToast(`🎯 '${selected.name}' 대상자 정보 및 심층 면접 결과를 불러왔습니다.`);
    }
  };

  const handleAnswerChange = (id: string, value: string) => {
    updateField('interview_answers', {
      ...formData.interview_answers,
      [id]: value
    });
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

      {/* Candidate Selection */}
      {candidates.length > 0 && (
        <div className="bg-violet-600 p-4 rounded-xl shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full"><UserCheck size={20} /></div>
            <div>
              <h3 className="font-bold">면접 대상자 불러오기</h3>
              <p className="text-violet-200 text-xs">온라인 설문 분석(가설 검증) 단계에서 식별된 심층 인터뷰 대상자입니다.</p>
            </div>
          </div>
          <select
            onChange={handleCandidateSelect}
            className="text-slate-800 text-sm p-2 rounded-lg border-none outline-none w-full md:w-80 font-medium"
          >
            <option value="">대상자 선택...</option>
            {candidates.map(c => (
              <option key={c.id} value={c.id}>
                [{c.reasonType || '미지정'}] {c.name} ({c.agency})
              </option>
            ))}
          </select>
        </div>
      )}

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
