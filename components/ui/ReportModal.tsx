import React from 'react';
import { Copy, X, FileText, User, ClipboardList } from 'lucide-react';

interface ReportModalProps {
  isVisible: boolean;
  onClose: () => void;
  data: {
    fileName: string;
    subject: string;
    summary: string;
  };
  onCopy: (text: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isVisible, onClose, data, onCopy }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col transform transition-all scale-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <ClipboardList size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">리포트 추출 및 복사</h3>
              <p className="text-xs text-slate-500">생성된 데이터를 클립보드에 복사하여 사용하세요.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* File Name */}
          <div className="group">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <FileText size={12}/> 파일명 (File Name)
              </label>
              <button 
                onClick={() => onCopy(data.fileName)}
                className="text-xs flex items-center gap-1.5 bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-600 px-3 py-1.5 rounded-full transition-all font-bold active:scale-95"
              >
                <Copy size={12}/> 복사
              </button>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm font-mono text-slate-700 break-all group-hover:border-blue-300 transition-colors">
              {data.fileName}
            </div>
          </div>

          {/* Subject */}
          <div className="group">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <User size={12}/> 대상 정보 (Subject)
              </label>
              <button 
                onClick={() => onCopy(data.subject)}
                className="text-xs flex items-center gap-1.5 bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-600 px-3 py-1.5 rounded-full transition-all font-bold active:scale-95"
              >
                <Copy size={12}/> 복사
              </button>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm font-mono text-slate-700 break-all group-hover:border-blue-300 transition-colors">
              {data.subject}
            </div>
          </div>

          {/* Summary */}
          <div className="flex-1 group">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                <ClipboardList size={12}/> 전체 요약 (Full Report)
              </label>
              <button 
                onClick={() => onCopy(data.summary)}
                className="text-xs flex items-center gap-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 px-3 py-1.5 rounded-full transition-all font-bold active:scale-95"
              >
                <Copy size={12}/> 복사
              </button>
            </div>
            <textarea 
              readOnly 
              value={data.summary}
              className="w-full h-64 p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono focus:outline-none resize-none text-slate-700 leading-relaxed group-hover:border-blue-300 transition-colors"
            />
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-colors font-bold shadow-lg hover:shadow-xl transform active:scale-95"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
