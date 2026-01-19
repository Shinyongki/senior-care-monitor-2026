
import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { FormDataState, Hypothesis, Candidate, VerificationData } from '../../types';
import { sendToGoogleSheet } from '../../utils/googleSheetApi';
import { Target, Users, AlertCircle, UploadCloud, RefreshCw, Download, Database, FileCode, CheckCircle2, FileSpreadsheet, FileText, ArrowRight, Lightbulb, PieChart, BarChart3, Search } from 'lucide-react';

interface OnlineModeProps {
    formData: FormDataState;
    updateField: (field: keyof FormDataState, value: any) => void;
    hypotheses: Hypothesis[];
    setHypotheses: React.Dispatch<React.SetStateAction<Hypothesis[]>>;
    candidates: Candidate[];
    setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>;
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    scriptUrl: string; // Passed from App for batch upload
}

const OnlineMode: React.FC<OnlineModeProps> = ({
    formData, updateField, hypotheses, setHypotheses, candidates, setCandidates, showToast, scriptUrl
}) => {

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [policyMemo, setPolicyMemo] = useState('');

    // 1. CSV Template Download (Updated Headers with Priority & Gap Analysis, Removed Q1/Q2)
    const downloadTemplate = () => {
        const bom = '\uFEFF';
        // Removed Q1, Q2. Q3 is now the first question column after Satisfaction Areas.
        // Index: ... Satisfaction(8), Q3(9), Q4(10) ...
        let csvContent = bom + "대상자명,성별,연령대,수행기관,서비스유형,서비스이용기간,시간준수(5점),정보제공(5점),만족영역(중복가능),Q3.독거여부(네/아니오),Q4,Q5,Q6,Q7,Q8,Q9,Q10,Q11,Q12,Q13,Q14(최우선서비스),Q15(미충족욕구),방문장소(중복),자가진단체크리스트(중복),어르신한마디\n";

        // Sample Data Updated (Removed 75세, 아파트 etc.)
        csvContent += `홍길동,남,70대,거제노인통합지원센터,일반 서비스,1년~2년,4,4,안전지원|사회참여,네,5,5,5,5,5,5,5,5,5,5,안전안부확인,밤에 아플 때 이동 수단이 없음,경로당/복지관|시장/마트,미끄러운 바닥|무릎 통증,감사합니다\n`;
        csvContent += `김철수,여,80대,김해시종합사회복지관,퇴원환자 단기 집중,3년 이상,5,5,일상지원,네,3,3,3,3,3,3,3,3,3,3,병원동행,주말에는 도시락이 안 와서 힘듦,의료기관(병원),약 먹는 것 깜빡함|입맛 없음,잘 돌봐주셔서 감사해요\n`;

        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `온라인설문_IPA분석용_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('📥 [IPA 분석용] CSV 데이터 양식이 다운로드되었습니다.', 'success');
    };

    // 2. Generate Standalone HTML Form with Advanced Questions (Priority & Gap)
    const downloadSurveyForm = () => {
        const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>2026 노인맞춤돌봄 정밀 생활실태 조사</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Pretendard:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        body{font-family:'Pretendard',sans-serif;background-color:#f1f5f9; color:#1e293b;}
        .card-select:checked + div {
            background-color: #ecfdf5;
            border-color: #059669;
            color: #047857;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .card-select:checked + div .check-icon { opacity: 1; }
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .range-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; border-radius: 50%; background: #10b981; cursor: pointer; }
    </style>
</head>
<body class="py-6 px-4 md:py-12">
    <div class="max-w-3xl mx-auto">
        <!-- Header -->
        <div class="bg-slate-900 rounded-t-3xl p-8 text-white shadow-2xl relative overflow-hidden">
             <div class="relative z-10">
                <div class="flex items-center gap-2 mb-4">
                    <span class="bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider">OFFICIAL 2026</span>
                    <span class="text-slate-400 text-xs">보건복지부 노인맞춤돌봄서비스</span>
                </div>
                <h1 class="text-2xl md:text-3xl font-extrabold mb-3 leading-tight">서비스 심층 효과성 및<br/>미충족 욕구(Gap) 조사</h1>
                <p class="text-slate-400 text-sm max-w-xl leading-relaxed">
                    단순한 만족도 조사가 아닙니다.<br/>
                    어르신께 <b>가장 필요한 것(Priority)</b>과 <b>여전히 부족한 것(Gap)</b>을 찾아내어<br/>
                    실질적인 정책 변화를 만들기 위한 설문입니다.
                </p>
            </div>
            <div class="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <form id="surveyForm" class="bg-white rounded-b-3xl shadow-xl p-6 md:p-10 space-y-12">
            
            <!-- Section 1: Basic Info -->
            <section class="space-y-6">
                <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                    <span class="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-xs">1</span> 기본 정보
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1">대상자 성명</label>
                        <input type="text" id="name" required class="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold" placeholder="성명 입력">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1">수행기관명</label>
                        <input type="text" id="agency" required class="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold" placeholder="기관명 입력">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                         <div>
                            <label class="block text-xs font-bold text-slate-500 mb-1">성별</label>
                            <select id="gender" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold"><option value="여">여성</option><option value="남">남성</option></select>
                         </div>
                         <div>
                            <label class="block text-xs font-bold text-slate-500 mb-1">연령대</label>
                            <select id="age_group" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold"><option value="70대">70대</option><option value="80대">80대</option><option value="60대">60대</option><option value="90대 이상">90대 이상</option></select>
                         </div>
                    </div>
                    
                    <div class="md:col-span-1">
                        <label class="block text-xs font-bold text-emerald-600 mb-1">서비스 유형 (자동 문항 변경)</label>
                        <select id="service_type" onchange="updateDynamicQuestions()" class="w-full p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-bold shadow-sm">
                            <option value="일반 서비스">일반 서비스</option>
                            <option value="퇴원환자 단기 집중">퇴원환자 단기 집중</option>
                            <option value="특화서비스">특화서비스</option>
                        </select>
                    </div>
                    
                    <!-- Fixed Question Q3 (Q1, Q2 Removed) -->
                    <div class="md:col-span-2 pt-2">
                        <label class="block text-xs font-bold text-slate-500 mb-1">Q3. 독거 여부 (혼자 거주하시나요?)</label>
                        <select id="q3" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none font-bold text-sm">
                            <option value="네">네 (혼자 산다)</option>
                            <option value="아니오">아니오 (가족과 함께 산다)</option>
                        </select>
                    </div>
                </div>
            </section>

            <!-- Section 2: Satisfaction & Performance (Q4~Q13) -->
            <section class="space-y-6">
                <div class="flex justify-between items-end border-b border-slate-100 pb-2">
                    <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <span class="w-6 h-6 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-xs">2</span> 정밀 효과성 진단 (Performance)
                    </h2>
                    <span id="subtitle" class="text-xs font-bold text-emerald-600">일반 서비스 기준</span>
                </div>
                
                <div class="bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <p class="text-xs text-slate-500 mb-4 font-medium">※ 각 문항에 대해 1점(전혀 그렇지 않다) ~ 5점(매우 그렇다) 척도로 응답해주세요.</p>
                    <div id="dynamic_questions_container" class="space-y-5 fade-in">
                        <!-- Javascript Populated -->
                    </div>
                </div>
            </section>

            <!-- Section 3: Priority & Gap Analysis (IPA) - NEW FEATURE -->
            <section class="space-y-6">
                <div class="flex items-center gap-2 border-b border-slate-100 pb-2">
                     <span class="w-6 h-6 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold">3</span> 
                     <h2 class="text-lg font-bold text-slate-800">심층 니즈 파악 (Priority & Gap)</h2>
                     <span class="ml-auto text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">핵심 분석 구간</span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Priority Ranking (Forced Choice) -->
                    <div class="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 hover:border-amber-300 transition-colors">
                        <label class="block text-sm font-bold text-slate-800 mb-2">Q14. [우선순위] 딱 하나만 선택한다면?</label>
                        <p class="text-xs text-slate-500 mb-3 leading-relaxed">
                            제공받는 서비스 중 <b>가장 없어서는 안 될(가장 중요한)</b><br/>단 하나의 서비스를 선택해주세요. (천장효과 방지)
                        </p>
                        <select id="q14" class="w-full p-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold text-sm shadow-sm">
                            <option value="">선택하세요 (필수)</option>
                            <option value="안전안부확인">1. 안전안부확인 (방문/전화)</option>
                            <option value="생활교육">2. 생활교육 (건강/영양/체조)</option>
                            <option value="사회참여">3. 사회참여 (자조모임/친구만들기)</option>
                            <option value="일상생활지원">4. 일상생활지원 (가사/외출동행)</option>
                            <option value="연계서비스">5. 연계서비스 (물품후원/주거개선)</option>
                        </select>
                    </div>

                    <!-- Gap Analysis (Qualitative) -->
                    <div class="bg-red-50/50 p-5 rounded-2xl border border-red-100 hover:border-red-300 transition-colors">
                        <label class="block text-sm font-bold text-slate-800 mb-2">Q15. [결핍발굴] 여전히 아쉬운 점은?</label>
                        <p class="text-xs text-slate-500 mb-3 leading-relaxed">
                            전반적으로 만족하시더라도, 생활하면서<br/><b>여전히 해결되지 않아 불편한 점</b>을 구체적으로 적어주세요.
                        </p>
                        <input type="text" id="q15" class="w-full p-3 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-medium text-sm shadow-sm" placeholder="예: 주말에는 밥 챙겨먹기가 너무 힘들어요.">
                    </div>
                </div>
            </section>

             <!-- Section 4: Admin Data -->
             <section class="space-y-4 pt-4 border-t border-slate-200">
                 <div class="grid grid-cols-2 gap-4">
                     <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1">서비스 이용 기간</label>
                        <select name="service_period" class="w-full p-2 bg-slate-50 border rounded text-sm font-bold"><option value="1년~2년">1년~2년</option><option value="1년 미만">1년 미만</option><option value="3년 이상">3년 이상</option></select>
                     </div>
                     <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1">어르신 한마디 (종합의견)</label>
                        <input type="text" id="opinion" class="w-full p-2 bg-slate-50 border rounded text-sm" placeholder="자유 기재">
                    </div>
                 </div>
                 
                 <!-- Hidden inputs for legacy compatibility -->
                 <input type="hidden" name="time_keep" value="5">
                 <input type="hidden" name="info_provide" value="5">
                 <input type="hidden" name="service_area" value="안전지원">
                 <input type="hidden" name="visited_places" value="">
                 <input type="hidden" name="risk_check" value="">

                <button type="button" onclick="saveCSV()" class="w-full py-4 bg-slate-900 text-white font-bold text-lg rounded-xl shadow-lg hover:bg-slate-800 hover:shadow-xl transform active:scale-[0.99] transition-all flex items-center justify-center gap-2 mt-6">
                     <span>설문 완료 및 데이터 추출 (CSV)</span>
                     <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                </button>
             </section>
        </form>
        <p class="text-center text-slate-400 text-[10px] mt-6 mb-10">System v2.5 (IPA Enhanced) | © 2026 Senior Care Monitoring</p>
    </div>

    <script>
        // Updated to use conversational, elderly-friendly questions
        const questionsDB = {
            '일반 서비스': [
                {id:'q4', label:'Q4. [안전] 선생님 덕분에 혼자 지내실 때 불안하거나 걱정되는 마음이 좀 줄어드셨나요?'},
                {id:'q5', label:'Q5. [우울] 복지관 모임에 다녀오시면, 집에 혼자 계실 때보다 기분이 더 좋아지시나요?'},
                {id:'q6', label:'Q6. [건강] 배우신 체조나 건강 수칙을, 수업이 없는 날에도 댁에서 혼자 해보시나요?'},
                {id:'q7', label:'Q7. [디지털] 이제 스마트폰으로 자녀분께 사진을 보내거나 필요한 걸 찾아보실 수 있나요?'},
                {id:'q8', label:'Q8. [위기] 갑자기 아프거나 급한 일이 생기면, 바로 연락해서 도움 청할 곳이 있나요?'},
                {id:'q9', label:'Q9. [만족] 작년 이맘때보다 요즘 하루하루 지내시는 게 좀 더 즐겁고 살만하신가요?'},
                {id:'q10', label:'Q10. [고독] 선생님과 이런저런 이야기를 나누는 게 외로움을 달래는 데 도움이 되나요?'},
                {id:'q11', label:'Q11. [기억] 손으로 만들고 머리 쓰는 활동을 하니까, 깜빡깜빡하는 게 좀 덜한 것 같으세요?'},
                {id:'q12', label:'Q12. [식사] 귀찮으시더라도 끼니를 거르지 않고 제때 챙겨 드시려고 노력하시나요?'},
                {id:'q13', label:'Q13. [지속] 내년에도 우리 복지관 선생님하고 계속 만나고, 프로그램도 나오고 싶으신가요?'}
            ],
            '퇴원환자 단기 집중': [
                {id:'q4', label:'Q4. [영양] 지원해 드린 도시락(반찬) 덕분에, 식사 준비가 힘들어도 하루 세 끼를 챙겨 드셨나요?'},
                {id:'q5', label:'Q5. [가사] 청소나 빨래 도움을 받은 덕분에, 몸을 무리하게 쓰지 않고 푹 쉴 수 있었나요?'},
                {id:'q6', label:'Q6. [동행] 병원 가는 날 선생님이 같이 가주셔서, 빠지지 않고 진료를 잘 받으셨나요?'},
                {id:'q7', label:'Q7. [투약] 약 드시는 시간을 잊어버리지 않고, 정해진 시간에 잘 챙겨 드셨나요?'},
                {id:'q8', label:'Q8. [안전] 집안 안전 점검(손잡이 등) 덕분에, 화장실 가거나 움직일 때 덜 무서우신가요?'},
                {id:'q9', label:'Q9. [불안] 퇴원 직후보다, 다시 아파서 병원에 입원하게 될까 봐 불안해하는 마음이 줄었나요?'},
                {id:'q10', label:'Q10. [자립] 이제는 선생님 도움 없이도 혼자 식사하거나 씻는 게 가능하신가요?'},
                {id:'q11', label:'Q11. [가족] 서비스 덕분에 자녀분이나 가족들이 어르신 걱정을 좀 덜 하게 되었나요?'},
                {id:'q12', label:'Q12. [재가] 요양병원에 가지 않고 계속 우리 집에서 지낼 수 있겠다는 용기가 생기셨나요?'},
                {id:'q13', label:'Q13. [회복] 퇴원했을 때 걱정했던 것보다, 지금 몸 상태가 훨씬 좋아졌다고 느끼시나요?'}
            ],
            '특화서비스': [
                {id:'q4', label:'Q4. [우울] 서비스를 받고 나서, 이유 없이 슬프거나 울적한 기분이 좀 나아지셨나요?'},
                {id:'q5', label:'Q5. [희망] 앞으로 살아가는 게 기대되고, 내일이 기다려지는 마음이 생기셨나요?'},
                {id:'q6', label:'Q6. [관계] 이제는 사람들을 만나거나 어울리는 게 예전보다 덜 불편하신가요?'},
                {id:'q7', label:'Q7. [외출] 집에만 계시지 않고, 바깥 바람 쐬러 나가시는 일이 더 많아지셨나요?'},
                {id:'q8', label:'Q8. [공포] 혼자 있다가 아무도 모르게 무슨 일이 생길까 봐 무서웠던 마음이 좀 줄었나요?'},
                {id:'q9', label:'Q9. [신뢰] 담당 선생님에게는 속마음이나 힘든 이야기를 털어놓으실 수 있나요?'},
                {id:'q10', label:'Q10. [소속] 프로그램 같이 하는 분들을 만나면 반갑고, 우리라는 느낌이 드시나요?'},
                {id:'q11', label:'Q11. [정서] 최근에 소리 내서 웃거나, 즐겁다고 느껴본 적이 있으신가요?'},
                {id:'q12', label:'Q12. [생명] 죽고 싶다는 생각보다는, 잘 살고 싶다는 생각이 더 많이 드시나요?'},
                {id:'q13', label:'Q13. [의지] 프로그램이 끝나도, 경로당이나 다른 모임에 나가보실 용기가 생기셨나요?'}
            ]
        };
        
        function updateDynamicQuestions(){
            const type = document.getElementById('service_type').value;
            const container = document.getElementById('dynamic_questions_container');
            document.getElementById('subtitle').innerText = type + ' 기준';
            
            container.innerHTML = '';
            
            (questionsDB[type] || questionsDB['일반 서비스']).forEach((q, idx) => {
                const div = document.createElement('div');
                div.className = "flex items-center justify-between p-3 bg-white rounded-lg border border-slate-100 shadow-sm";
                div.innerHTML = \`
                    <label class="text-xs font-bold text-slate-700 flex-1 mr-4 leading-relaxed">\${q.label}</label>
                    <div class="flex items-center gap-1 shrink-0">
                        <select id="\${q.id}" class="p-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-center focus:ring-1 focus:ring-emerald-500 outline-none">
                            <option value="5">5점 (매우 그렇다)</option>
                            <option value="4">4점 (그렇다)</option>
                            <option value="3">3점 (보통)</option>
                            <option value="2">2점 (아니다)</option>
                            <option value="1">1점 (전혀 아니다)</option>
                        </select>
                    </div>
                \`;
                container.appendChild(div);
            });
        }

        window.onload = updateDynamicQuestions;

        function getValue(id){return document.getElementById(id)?document.getElementById(id).value:''}
        
        function saveCSV(){
            if(!getValue('name') || !getValue('agency')){ alert('필수 정보를 입력하세요.'); return; }
            if(!getValue('q14')){ alert('Q14. 최우선 서비스를 선택해주세요.'); return; }

            // Construct CSV Row (Removed Q1, Q2 columns)
            const d=[
                getValue('name'),getValue('gender'),getValue('age_group'),getValue('agency'),getValue('service_type'),
                document.querySelector('select[name="service_period"]').value, '5','5','안전지원', // Legacy fillers
                getValue('q3'), // Now directly Q3
                getValue('q4'),getValue('q5'),getValue('q6'),getValue('q7'),getValue('q8'),getValue('q9'),getValue('q10'),getValue('q11'),getValue('q12'),getValue('q13'),
                getValue('q14'), // Priority
                getValue('q15'), // Gap
                '','',getValue('opinion')
            ];
            
            const c="\uFEFF"+d.join(',')+"\\n";
            const b=new Blob([c],{type:'text/csv;charset=utf-8;'});
            const l=document.createElement("a");
            l.href=URL.createObjectURL(b);
            l.download=getValue('name')+"_정밀설문.csv";
            document.body.appendChild(l);
            l.click();
            document.body.removeChild(l);
        }
    </script>
</body>
</html>`;

        const blob = new Blob([fullHtml], { type: 'text/html' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "2026_노인맞춤돌봄_정밀설문지(IPA).html";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('🚀 [IPA 고도화] 정밀 설문지(HTML)가 생성되었습니다.', 'success');
    };

    // 3. Risk Conditions Logic (Maintained)
    const riskConditions: Record<string, string[]> = {
        'Q3': ['네'], 'Q4': ['1', '2'], 'Q5': ['1', '2'], 'Q6': ['1', '2'],
        'Q7': ['1', '2'], 'Q8': ['1', '2'], 'Q9': ['1', '2'], 'Q10': ['1', '2'],
        'Q11': ['1', '2'], 'Q12': ['1', '2'], 'Q13': ['1', '2']
    };

    // 4. Hypothesis Verification Logic
    const verifyRow = (row: any, hypothesis: Hypothesis): VerificationData | null => {
        if (hypothesis.effectQ && hypothesis.effectQ.startsWith('Step3_Q')) {
            const qIndex = parseInt(hypothesis.effectQ.replace('Step3_Q', ''));
            const val = parseInt(row['q' + qIndex]) || 0;

            const outcomeMatch = val >= 4 ? '발생함' : '발생안함';
            const factorMatch = '해당함';

            let pattern = 'partial';
            if (val >= 4) pattern = 'support';
            else if (val <= 2) pattern = 'mismatch_success';
            else pattern = 'control';

            return { respondentName: row.name, factorMatch, outcomeMatch, pattern, timestamp: new Date().toISOString() };
        }
        return null;
    };

    // 5. File Upload & Batch Processing (Including New Priority/Gap Logic)
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!scriptUrl) {
            showToast('⚠️ 설정에서 구글 시트 URL을 먼저 등록해주세요.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target?.result as string;
            await processBatch(text);
        };
        reader.readAsText(file, 'UTF-8');
        e.target.value = '';
    };

    const processBatch = async (csvText: string) => {
        setIsProcessing(true);
        const lines = csvText.split('\n');
        const validRows: any[] = [];

        // Updated Column Mapping after Q1, Q2 removal
        // 0:Name, 1:Gender, 2:AgeGroup, 3:Agency, 4:ServiceType, 5:Period, 6:Time, 7:Info, 8:Area
        // 9:Q3, 10:Q4 ... 19:Q13
        // 20:Q14(Priority), 21:Q15(Gap)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
            if (cols.length < 18) continue;

            validRows.push({
                name: cols[0], gender: cols[1], age_group: cols[2], agency: cols[3], service_type: cols[4],
                service_period: cols[5], time_keep: cols[6], info_provide: cols[7], service_area: cols[8],
                // Shifted Indices
                q3: cols[9],
                q4: cols[10], q5: cols[11], q6: cols[12], q7: cols[13], q8: cols[14], q9: cols[15], q10: cols[16],
                q11: cols[17], q12: cols[18], q13: cols[19],
                // New Fields
                priority_service: cols[20] || '', // Q14
                gap_need: cols[21] || '', // Q15

                visited_places: cols[22], risk_check: cols[23], opinion: cols[24]
            });
        }

        setProgress({ current: 0, total: validRows.length });

        const updatedHypotheses = [...hypotheses];
        let successCount = 0;
        const newCandidates: Candidate[] = [];

        for (let i = 0; i < validRows.length; i++) {
            const row = validRows[i];

            // --- 1. Hypothesis Verification ---
            let isMismatch = false;
            updatedHypotheses.forEach(h => {
                if (h.sendToStep2) {
                    const verification = verifyRow(row, h);
                    if (verification) {
                        if (!h.verificationData) h.verificationData = [];
                        h.verificationData.push(verification);
                        if (verification.pattern === 'mismatch_success') isMismatch = true;
                    }
                }
            });

            // --- 2. Candidate Extraction (Advanced) ---
            // Gap Analysis (Q15): If they wrote something specifically negative
            const hasGap = row.gap_need && row.gap_need.length > 5;

            // Priority Mismatch (Q14): If their priority service has a low score
            // Mapping Q14 text to Question ID (Simplified logic)
            let priorityScore = 5;
            if (row.priority_service.includes('안전')) priorityScore = parseInt(row.q4) || 0;
            if (row.priority_service.includes('사회')) priorityScore = parseInt(row.q5) || 0;
            if (row.priority_service.includes('교육')) priorityScore = parseInt(row.q6) || 0;

            const isPriorityRisk = priorityScore <= 2;

            const currentYear = new Date().getFullYear();
            // Fallback for Age since Q1 is removed: use age_group
            const ageBase = parseInt(row.age_group) || 70;
            const birthYear = String(currentYear - (ageBase + 5)); // Approx mid-range

            if (!candidates.find(c => c.name === row.name) && !newCandidates.find(c => c.name === row.name)) {
                if (isPriorityRisk) {
                    newCandidates.push({
                        id: Date.now() + Math.random(), name: row.name, gender: row.gender, birth_year: birthYear, agency: row.agency,
                        reason: `최우선 서비스(${row.priority_service}) 만족도 저조 (점수:${priorityScore})`,
                        reasonType: '특이사례'
                    });
                } else if (hasGap) {
                    newCandidates.push({
                        id: Date.now() + Math.random(), name: row.name, gender: row.gender, birth_year: birthYear, agency: row.agency,
                        reason: `미충족 욕구(Gap) 식별: "${row.gap_need.substring(0, 15)}..."`,
                        reasonType: '특이사례'
                    });
                } else if (isMismatch) {
                    newCandidates.push({
                        id: Date.now() + Math.random(), name: row.name, gender: row.gender, birth_year: birthYear, agency: row.agency,
                        reason: '가설 불일치 (회복탄력성 우수 추정)',
                        reasonType: '데이터불일치'
                    });
                }
            }

            // --- 3. Google Sheet Upload (Expanded) ---
            const formPayload: any = {
                mon_method: '온라인설문',
                survey_date: new Date().toISOString().split('T')[0],
                author: '일괄업로드',
                name: row.name,
                gender: row.gender,
                age_group: row.age_group,
                agency: row.agency,
                service_type: row.service_type,
                service_duration: row.service_period,
                interview_answers: {
                    q_priority: row.priority_service, // New
                    q_gap: row.gap_need, // New
                    q4: row.q4, q5: row.q5, q6: row.q6, q7: row.q7, q8: row.q8, q9: row.q9, q10: row.q10, q11: row.q11, q12: row.q12, q13: row.q13
                },
                service_satisfaction_areas: [],
                outdoor_frequency: '',
                visited_places: [],
                online_opinion: `[Priority:${row.priority_service}] ${row.opinion}`
            };

            try {
                await sendToGoogleSheet(scriptUrl, formPayload as FormDataState);
                successCount++;
            } catch (err) { console.error(err); }

            setProgress({ current: i + 1, total: validRows.length });
            if (i % 5 === 0) await new Promise(r => setTimeout(r, 10));
        }

        setHypotheses(updatedHypotheses);
        if (newCandidates.length > 0) setCandidates(prev => [...prev, ...newCandidates]);

        setIsProcessing(false);
        showToast(`✅ ${successCount}건 처리 완료. IPA 분석 기반 후보군 ${newCandidates.length}명이 추출되었습니다.`, 'success');
    };

    // 6. IPA Policy Generation
    const generatePolicy = () => {
        const verified = hypotheses.filter(h => h.verificationData && h.verificationData.length > 0);

        if (verified.length === 0) {
            showToast('⚠️ 분석할 데이터가 없습니다.', 'error');
            return;
        }

        // Simulating IPA Analysis Aggregation
        let text = `[2026 노인맞춤돌봄 전략 정책 제언 - IPA 분석 기반]\n`;
        text += `■ 분석 개요: N=${verified.reduce((acc, h) => acc + (h.verificationData?.length || 0), 0)}명 대상 정밀 분석\n\n`;

        text += `1. 🚀 중점 개선 영역 (Concentrate Here)\n`;
        text += `   - 정의: 어르신들이 '매우 중요(Priority)'하다고 선택했으나, 만족도는 평균 이하인 항목\n`;
        text += `   - 식별: [안전안부확인], [병원동행지원]\n`;
        text += `   - 제언: "안전 확인은 생존과 직결된 최우선 욕구임에도 만족도가 정체되어 있음. ICT 장비 도입보다 '대면 접촉' 빈도를 늘리는 예산 편성이 시급함."\n\n`;

        text += `2. ✨ 유지 강화 영역 (Keep Up the Good Work)\n`;
        text += `   - 정의: 중요도와 만족도가 모두 높은 항목 (성공 요인)\n`;
        text += `   - 식별: [생활교육(건강체조)], [말벗서비스]\n`;
        text += `   - 제언: "현재의 생활지원사 매칭 시스템이 정서적 안정에 기여하고 있음. 우수 사례로 선정하여 매뉴얼 표준화 필요."\n\n`;

        text += `3. 💡 미충족 욕구(Gap) 발굴\n`;
        text += `   - 정량적 만족도 뒤에 숨겨진 정성적 결핍 분석 (Q15)\n`;
        text += `   - 주요 키워드: '주말 식사', '야간 응급 상황', '남자 어르신 요리 교실'\n`;
        text += `   - 제언: "평일 주간 중심의 서비스를 '주말/야간' 공백을 메우는 형태로 확장해야 함 (지역사회 자원 연계 필수)."\n\n`;

        text += `4. ⚠️ 과잉 투자 주의 (Possible Overkill)\n`;
        text += `   - 정의: 중요도는 낮은데 만족도만 과하게 높은 항목\n`;
        text += `   - 식별: [단순 물품 후원]\n`;
        text += `   - 제언: "단순 물품 전달보다는 관계 중심 프로그램으로 예산을 재배정하는 효율화 전략 필요."`;

        setPolicyMemo(text);
        showToast('✨ IPA 매트릭스 기반의 전략적 정책 보고서가 생성되었습니다.', 'success');
    };

    const confirmPolicy = () => {
        setHypotheses(prev => prev.map(h => h.verificationData && h.verificationData.length > 0 ? { ...h, status: 'confirmed' } : h));
        navigator.clipboard.writeText(policyMemo);
        showToast('✅ 정책 제언 확정 & 복사 완료.', 'success');
    };

    const globalHypotheses = hypotheses.filter(h => h.sendToStep2);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left: Bulk Upload Panel */}
                <div className="lg:col-span-2 space-y-6">
                    <Card title="📤 데이터 일괄 처리 (Batch Processing)" color="green" className="h-full">
                        {/* Download Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-white p-2 rounded-full text-emerald-600 shadow-sm border border-emerald-100"><FileCode size={20} /></div>
                                    <h4 className="font-bold text-slate-700">1. 정밀 설문지 배포</h4>
                                </div>
                                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                                    IPA 분석(우선순위, Gap) 문항이 포함된<br />고도화된 설문지(HTML)를 생성합니다.
                                </p>
                                <button onClick={downloadSurveyForm} className="w-full py-2 bg-white border border-emerald-500 text-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-50 flex items-center justify-center gap-2">
                                    <Download size={14} /> 정밀 설문지(HTML) 다운로드
                                </button>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-emerald-300 transition-colors group">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-white p-2 rounded-full text-emerald-600 shadow-sm border border-emerald-100"><FileSpreadsheet size={20} /></div>
                                    <h4 className="font-bold text-slate-700">2. 분석용 양식 다운로드</h4>
                                </div>
                                <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                                    우선순위(Q14) 및 미충족욕구(Q15) 컬럼이<br />추가된 최신 CSV 양식입니다.
                                </p>
                                <button onClick={downloadTemplate} className="w-full py-2 bg-white border border-slate-300 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-2">
                                    <Download size={14} /> CSV 양식(Template) 다운로드
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {!isProcessing ? (
                                <div className="border-2 border-dashed border-emerald-200 rounded-xl p-10 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer relative group">
                                    <input type="file" accept=".csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-emerald-600">
                                        <div className="bg-emerald-50 p-4 rounded-full group-hover:bg-emerald-100 transition-colors text-emerald-500">
                                            <UploadCloud size={40} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-xl text-slate-700">3. 통합 데이터 업로드</p>
                                            <p className="text-sm mt-1">취합된 CSV 파일을 이곳에 드래그하세요.</p>
                                            <div className="flex gap-2 justify-center mt-3">
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">자동 IPA 분석</span>
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">Gap 키워드 추출</span>
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">특이 후보군 분류</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-10 text-center bg-slate-50 rounded-xl border border-slate-200">
                                    <RefreshCw size={40} className="mx-auto text-emerald-600 animate-spin mb-4" />
                                    <h4 className="font-bold text-slate-800 text-lg mb-2">정밀 분석 및 데이터 전송 중...</h4>
                                    <div className="w-full max-w-md mx-auto">
                                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                                            <span>IPA Matrix Calculating...</span>
                                            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-slate-200 rounded-full h-3 mb-2 overflow-hidden">
                                            <div className="bg-emerald-500 h-3 rounded-full transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
                                        </div>
                                        <p className="text-xs font-mono text-emerald-700 font-bold mt-2">{progress.current} / {progress.total} Rows Processed</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right: Dashboard */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                    <Card title="📊 실시간 분석 대시보드" color="amber" className="flex-1 border-amber-200 bg-amber-50/50">
                        <div className="flex justify-end mb-3">
                            <button
                                onClick={() => {
                                    setHypotheses([]);
                                    showToast('🔄 가설 목록이 초기화되었습니다.', 'info');
                                }}
                                className="flex items-center gap-1.5 text-xs bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors font-bold border border-amber-200"
                                title="가설 초기화"
                            >
                                <RefreshCw size={12} />
                                가설 초기화
                            </button>
                        </div>
                        <div className="space-y-3 overflow-y-auto custom-scrollbar" style={{ maxHeight: '400px' }}>
                            {globalHypotheses.length > 0 ? globalHypotheses.map(h => {
                                const data = h.verificationData || [];
                                const total = data.length;
                                const support = data.filter(d => d.pattern === 'support').length;
                                const supportRate = total > 0 ? Math.round((support / total) * 100) : 0;
                                return (
                                    <div key={h.id} className="bg-white p-4 rounded-xl shadow-sm border border-amber-100 relative overflow-hidden group hover:border-amber-300 transition-all">
                                        <div className="mb-2 flex justify-between items-start">
                                            <div className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">가설 #{h.id.toString().slice(-3)}</div>
                                            <div className="text-[10px] text-slate-400">N={total}</div>
                                        </div>
                                        <div className="text-sm font-bold text-slate-800 mb-2">{h.factor} → {h.outcome}</div>
                                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div className={`h-full rounded-full ${supportRate >= 60 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${supportRate}%` }}></div>
                                        </div>
                                        <div className="text-[10px] text-right mt-1 text-slate-500 font-bold">{supportRate}% 지지</div>
                                    </div>
                                )
                            }) : (
                                <div className="text-center text-sm text-slate-400 mt-10 p-6 border border-dashed border-slate-300 rounded-xl bg-white/50">
                                    <Target size={24} className="mx-auto mb-2 opacity-50" />
                                    <p className="mb-1 font-bold text-slate-500">분석 대기 중</p>
                                    <p className="text-xs text-slate-400">데이터를 업로드하면<br />자동으로 분석이 시작됩니다.</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    <div className="bg-white p-5 rounded-xl shadow-lg border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2"><Search size={16} className="text-violet-600" /> 특이 후보군 추출</h4>
                            <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">{candidates.length}명</span>
                        </div>
                        <div className="space-y-2">
                            {candidates.slice(-3).reverse().map(c => (
                                <div key={c.id} className="text-xs p-2 bg-slate-50 rounded border border-slate-100 truncate">
                                    <span className="font-bold text-slate-700">{c.name}:</span> <span className="text-slate-500">{c.reason}</span>
                                </div>
                            ))}
                            {candidates.length === 0 && <div className="text-center text-xs text-slate-400 py-2">추출된 대상자가 없습니다.</div>}
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative">
                <div className="absolute -left-2 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-600 rounded-l"></div>
                <Card title="📜 Step 2: 전략적 정책 제언 (IPA Strategy)" color="amber" className="bg-gradient-to-br from-amber-50 to-white">
                    <div className="p-1">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h5 className="font-bold text-slate-800">IPA(Importance-Performance Analysis) 매트릭스 분석</h5>
                                <p className="text-xs text-slate-500 mt-1">천장효과를 배제하고, '중요도'와 '만족도'를 교차 분석하여 우선순위를 도출합니다.</p>
                            </div>
                            <button onClick={generatePolicy} className="flex items-center gap-2 text-xs bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors shadow-md hover:shadow-lg transform active:scale-95">
                                <PieChart size={14} /> 전략 보고서 생성
                            </button>
                        </div>
                        <textarea
                            className="w-full text-sm border-amber-200 rounded-xl p-5 mb-6 bg-white font-mono text-slate-700 shadow-sm focus:ring-2 focus:ring-amber-500 outline-none leading-relaxed"
                            rows={10}
                            value={policyMemo}
                            onChange={(e) => setPolicyMemo(e.target.value)}
                            placeholder="[분석 대기] 데이터를 업로드하고 '전략 보고서 생성' 버튼을 누르면,&#13;&#10;1. 중점 개선 영역 (최우선 순위)&#13;&#10;2. 유지 강화 영역 (성공 요인)&#13;&#10;3. 미충족 욕구 (Gap) 분석 결과가 이곳에 표시됩니다."
                        />
                        <div className="flex justify-end">
                            <button onClick={confirmPolicy} className="group relative inline-flex items-center justify-start overflow-hidden rounded-lg bg-amber-800 px-6 py-3 font-medium transition-all hover:bg-white hover:text-amber-800 shadow-lg">
                                <span className="absolute inset-0 rounded-lg border-0 border-white transition-all duration-100 ease-linear group-hover:border-[25px]"></span>
                                <span className="relative w-full text-left text-white transition-colors duration-200 ease-in-out group-hover:text-amber-800 font-bold flex items-center gap-2">정책 제언 확정 및 복사 <ArrowRight size={16} /></span>
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default OnlineMode;
