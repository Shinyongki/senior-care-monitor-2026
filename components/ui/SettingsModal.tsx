
import React, { useState, useEffect } from 'react';
import { X, Save, Link, AlertCircle, CheckCircle2, Beaker, ExternalLink } from 'lucide-react';

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
  onSimulate?: () => void; // Optional for backward compatibility, but passed from App
  currentUrl: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isVisible, onClose, onSave, onSimulate, currentUrl }) => {
  const [url, setUrl] = useState('');
  const [sheetUrl, setSheetUrl] = useState(() => localStorage.getItem('googleSheetDirectUrl') || '');

  useEffect(() => {
    if (isVisible) {
      setUrl(currentUrl);
      setSheetUrl(localStorage.getItem('googleSheetDirectUrl') || '');
    }
  }, [isVisible, currentUrl]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">

        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="bg-slate-200 p-2 rounded-lg text-slate-700">
              <Link size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">시스템 설정</h3>
              <p className="text-xs text-slate-500">데이터 연동 및 테스트 관리</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">

          {/* Section 1: Google Sheet Link */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-700 text-sm border-b pb-2 flex items-center gap-2">
              <Link size={16} /> 구글 시트 연동 (Google Sheet)
            </h4>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800 leading-relaxed">
              <div className="flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>
                  <b>Apps Script 웹 앱 URL</b>을 입력하세요.<br />
                  배포된 스크립트 URL을 통해 데이터가 중앙 시트로 전송됩니다.
                </span>
              </div>
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />

            {/* Sheet URL Input */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">📊 구글 시트 직접 URL (선택)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="flex-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none transition-all"
                />
                <button
                  onClick={() => {
                    if (sheetUrl) {
                      window.open(sheetUrl, '_blank');
                    } else {
                      alert('구글 시트 URL을 먼저 입력해주세요.');
                    }
                  }}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm whitespace-nowrap flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink size={14} />
                  시트 열기
                </button>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                * 시트 URL을 입력하면 버튼으로 바로 열 수 있습니다.
              </div>
            </div>
          </div>

          {/* Section 2: Simulation */}
          {onSimulate && (
            <div className="space-y-4">
              <h4 className="font-bold text-emerald-700 text-sm border-b border-emerald-200 pb-2 flex items-center gap-2">
                <Beaker size={16} /> 시뮬레이션 데이터 생성
              </h4>
              <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  테스트용 더미 데이터를 생성합니다:<br />
                  • 유선 모니터링 30건 (위험 8건)<br />
                  • 1차 대면 리스크 대상자 8명<br />
                  • 가설 5건 (각 50개 검증데이터)<br />
                  • 2차 심층면접 후보 4명
                </p>
                <button
                  onClick={onSimulate}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                >
                  🧪 시뮬레이션 데이터 생성
                </button>
              </div>
            </div>
          )}

          {/* Section 3: Data Reset */}
          <div className="space-y-4">
            <h4 className="font-bold text-red-600 text-sm border-b border-red-200 pb-2 flex items-center gap-2">
              🗑️ 데이터 초기화
            </h4>
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                시뮬레이션으로 생성된 <b>테스트 데이터</b>(1차 대면 대상자, 가설, 후보군 등)를 모두 삭제합니다.<br />
                <span className="text-red-500 font-bold">⚠️ 이 작업은 되돌릴 수 없습니다.</span>
              </p>
              <button
                onClick={() => {
                  if (confirm('정말 모든 테스트 데이터를 삭제하시겠습니까?')) {
                    localStorage.removeItem('riskTargets');
                    localStorage.removeItem('phoneLog');
                    localStorage.removeItem('hypotheses');
                    localStorage.removeItem('candidates');
                    location.reload();
                  }
                }}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
              >
                🗑️ 테스트 데이터 삭제 후 새로고침
              </button>
            </div>
          </div>

        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors font-bold"
          >
            닫기
          </button>
          <button
            onClick={() => {
              localStorage.setItem('googleSheetDirectUrl', sheetUrl);
              onSave(url);
            }}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg flex items-center gap-2"
          >
            <Save size={16} /> 설정 저장
          </button>
        </div>
      </div>
    </div>
  );
};
