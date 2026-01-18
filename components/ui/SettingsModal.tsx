
import React, { useState, useEffect } from 'react';
import { X, Save, Link, AlertCircle, CheckCircle2, Beaker } from 'lucide-react';

interface SettingsModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (url: string) => void;
  onSimulate?: () => void; // Optional for backward compatibility, but passed from App
  currentUrl: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isVisible, onClose, onSave, onSimulate, currentUrl }) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (isVisible) setUrl(currentUrl);
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
                    <AlertCircle size={16} className="mt-0.5 shrink-0"/>
                    <span>
                    <b>Apps Script 웹 앱 URL</b>을 입력하세요.<br/>
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
             <div className="text-xs text-slate-400">
               * 브라우저 캐시에 저장됩니다.
            </div>
          </div>

          {/* Section 2: Data Simulation */}
          <div className="space-y-4">
             <h4 className="font-bold text-slate-700 text-sm border-b pb-2 flex items-center gap-2">
                <Beaker size={16} /> 데이터 시뮬레이션 (Test Mode)
            </h4>
            <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                    시스템의 전체 흐름(유선 → 1차 → 온라인 → 2차)을 테스트하기 위해 가상의 데이터를 생성합니다.<br/>
                    <b>주의:</b> 기존의 '리스크 대상자', '가설', '후보군' 목록이 초기화되거나 추가될 수 있습니다.
                </p>
                <button 
                    onClick={onSimulate}
                    className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm"
                >
                    <Beaker size={18} /> 🧪 테스트 데이터 생성 (시뮬레이션)
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
            onClick={() => onSave(url)}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-lg flex items-center gap-2"
          >
            <Save size={16} /> 설정 저장
          </button>
        </div>
      </div>
    </div>
  );
};
