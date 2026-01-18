
import React, { useState, useEffect } from 'react';
import { Search, Save, RefreshCw, Users, Building, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { fetchSheetData, updateAgencyResponse, SheetRow } from '../../utils/googleSheetApi';
import { REGION_AGENCY_MAP } from '../../constants';

interface AgencyResponseModeProps {
    scriptUrl: string;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const AgencyResponseMode: React.FC<AgencyResponseModeProps> = ({ scriptUrl, showToast }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [allData, setAllData] = useState<SheetRow[]>([]);
    const [filteredData, setFilteredData] = useState<SheetRow[]>([]);

    // 필터 상태
    const [selectedRegion, setSelectedRegion] = useState<string>('');
    const [selectedAgency, setSelectedAgency] = useState<string>('');

    // 선택된 대상자 및 답변
    const [selectedRow, setSelectedRow] = useState<SheetRow | null>(null);
    const [responseText, setResponseText] = useState<string>('');

    const regions = Object.keys(REGION_AGENCY_MAP);
    const agencies = selectedRegion ? REGION_AGENCY_MAP[selectedRegion] || [] : [];

    // 데이터 조회
    const handleFetchData = async () => {
        if (!scriptUrl) {
            showToast('⚠️ 구글 시트 연동 URL이 설정되지 않았습니다. 설정을 확인해주세요.', 'error');
            return;
        }

        setIsLoading(true);
        const result = await fetchSheetData(scriptUrl);
        setIsLoading(false);

        if (result.success && result.data) {
            setAllData(result.data);
            showToast(`✅ ${result.data.length}건의 데이터를 불러왔습니다.`, 'success');
        } else {
            showToast(result.message || '데이터 조회 실패', 'error');
        }
    };

    // 필터 적용
    useEffect(() => {
        let filtered = allData;

        if (selectedRegion) {
            filtered = filtered.filter(row => row['시군'] === selectedRegion);
        }
        if (selectedAgency) {
            filtered = filtered.filter(row => row['수행기관'] === selectedAgency);
        }

        setFilteredData(filtered);
        setSelectedRow(null);
        setResponseText('');
    }, [allData, selectedRegion, selectedAgency]);

    // 대상자 선택
    const handleSelectRow = (row: SheetRow) => {
        setSelectedRow(row);
        setResponseText(row['수행기관답변'] || '');
    };

    // 답변 저장
    const handleSaveResponse = async () => {
        if (!selectedRow) {
            showToast('⚠️ 대상자를 먼저 선택해주세요.', 'info');
            return;
        }

        setIsSaving(true);
        const result = await updateAgencyResponse(scriptUrl, selectedRow.rowNumber, responseText);
        setIsSaving(false);

        if (result.success) {
            showToast('✅ ' + result.message, 'success');
            // 로컬 데이터 업데이트
            setAllData(prev => prev.map(row =>
                row.rowNumber === selectedRow.rowNumber
                    ? { ...row, '수행기관답변': responseText }
                    : row
            ));
        } else {
            showToast('❌ ' + result.message, 'error');
        }
    };

    return (
        <div className="space-y-6">
            {/* 필터링 영역 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Search size={20} className="text-indigo-600" />
                    <h3 className="font-bold text-lg text-slate-800">대상자 검색</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* 시군 선택 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">시군</label>
                        <select
                            value={selectedRegion}
                            onChange={(e) => {
                                setSelectedRegion(e.target.value);
                                setSelectedAgency('');
                            }}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">전체</option>
                            {regions.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    {/* 수행기관 선택 */}
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">수행기관</label>
                        <select
                            value={selectedAgency}
                            onChange={(e) => setSelectedAgency(e.target.value)}
                            disabled={!selectedRegion}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-100"
                        >
                            <option value="">전체</option>
                            {agencies.map(a => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>

                    {/* 조회 버튼 */}
                    <div className="flex items-end">
                        <button
                            onClick={handleFetchData}
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <RefreshCw size={18} className="animate-spin" />
                            ) : (
                                <Search size={18} />
                            )}
                            {isLoading ? '조회 중...' : '데이터 조회'}
                        </button>
                    </div>

                    {/* 결과 수 표시 */}
                    <div className="flex items-end">
                        <div className="w-full py-3 px-4 bg-slate-100 text-slate-700 font-medium rounded-lg text-center">
                            <span className="text-indigo-600 font-bold">{filteredData.length}</span>건
                        </div>
                    </div>
                </div>
            </div>

            {/* 대상자 목록 */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Users size={20} className="text-indigo-600" />
                    <h3 className="font-bold text-lg text-slate-800">대상자 목록</h3>
                </div>

                {filteredData.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                        <p>조회된 데이터가 없습니다.</p>
                        <p className="text-sm mt-2">위에서 조건을 선택하고 '데이터 조회' 버튼을 클릭하세요.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-slate-50 text-slate-600">
                                    <th className="p-3 text-left rounded-tl-lg">선택</th>
                                    <th className="p-3 text-left">조사일자</th>
                                    <th className="p-3 text-left">대상자명</th>
                                    <th className="p-3 text-left">수행기관</th>
                                    <th className="p-3 text-left">만족도</th>
                                    <th className="p-3 text-left">안전동향</th>
                                    <th className="p-3 text-left rounded-tr-lg">답변상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((row) => (
                                    <tr
                                        key={row.rowNumber}
                                        onClick={() => handleSelectRow(row)}
                                        className={`border-b border-slate-100 cursor-pointer transition-colors ${selectedRow?.rowNumber === row.rowNumber
                                                ? 'bg-indigo-50'
                                                : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <td className="p-3">
                                            <input
                                                type="radio"
                                                checked={selectedRow?.rowNumber === row.rowNumber}
                                                onChange={() => handleSelectRow(row)}
                                                className="w-4 h-4 text-indigo-600"
                                            />
                                        </td>
                                        <td className="p-3 text-slate-600">{row['조사일자'] || '-'}</td>
                                        <td className="p-3 font-medium text-slate-800">{row['대상자명'] || '-'}</td>
                                        <td className="p-3 text-slate-600">{row['수행기관'] || '-'}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${row['만족도'] === '만족' ? 'bg-green-100 text-green-700' :
                                                    row['만족도'] === '불만족' ? 'bg-red-100 text-red-700' :
                                                        'bg-slate-100 text-slate-600'
                                                }`}>
                                                {row['만족도'] || '-'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-slate-600 max-w-[200px] truncate">{row['안전동향'] || '-'}</td>
                                        <td className="p-3">
                                            {row['수행기관답변'] ? (
                                                <span className="text-green-600 flex items-center gap-1">
                                                    <CheckCircle2 size={16} /> 완료
                                                </span>
                                            ) : (
                                                <span className="text-amber-600 flex items-center gap-1">
                                                    <AlertCircle size={16} /> 미입력
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 수행기관 답변 입력 */}
            {selectedRow && (
                <div className="bg-white rounded-2xl shadow-lg border border-indigo-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <MessageSquare size={20} className="text-indigo-600" />
                        <h3 className="font-bold text-lg text-slate-800">수행기관 답변 입력</h3>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-xl mb-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-slate-500">대상자:</span>
                                <span className="ml-2 font-bold text-slate-800">{selectedRow['대상자명']}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">수행기관:</span>
                                <span className="ml-2 font-medium text-slate-700">{selectedRow['수행기관']}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">조사일자:</span>
                                <span className="ml-2 text-slate-700">{selectedRow['조사일자']}</span>
                            </div>
                            <div>
                                <span className="text-slate-500">만족도:</span>
                                <span className="ml-2 text-slate-700">{selectedRow['만족도']}</span>
                            </div>
                        </div>
                    </div>

                    {/* 안전동향/특이사항 표시 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-slate-50 p-4 rounded-xl">
                            <label className="block text-sm font-medium text-slate-600 mb-2">📋 안전동향</label>
                            <p className="text-slate-800">{selectedRow['안전동향'] || '(내용 없음)'}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl">
                            <label className="block text-sm font-medium text-slate-600 mb-2">📝 특이사항</label>
                            <p className="text-slate-800">{selectedRow['특이사항'] || '(내용 없음)'}</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            ✍️ 수행기관 답변 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="수행기관의 답변 내용을 입력하세요..."
                            rows={4}
                            className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        />
                    </div>

                    <button
                        onClick={handleSaveResponse}
                        disabled={isSaving || !responseText.trim()}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <RefreshCw size={20} className="animate-spin" />
                        ) : (
                            <Save size={20} />
                        )}
                        {isSaving ? '저장 중...' : '💾 답변 저장'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AgencyResponseMode;
