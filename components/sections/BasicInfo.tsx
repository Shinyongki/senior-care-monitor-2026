import React, { useEffect, useState } from 'react';
import { FormDataState } from '../../types';
import { REGION_AGENCY_MAP, AUTHORS, AUTHOR_REGION_MAP } from '../../constants';
import { User, Calendar, MapPin, Briefcase } from 'lucide-react';

interface BasicInfoProps {
  formData: FormDataState;
  updateField: (field: keyof FormDataState, value: any) => void;
  themeText: string;
  themeBorder: string;
}

const BasicInfo: React.FC<BasicInfoProps> = ({ formData, updateField, themeText, themeBorder }) => {
  const [agencyList, setAgencyList] = useState<string[]>([]);

  // Agency Update Logic & Auto Select
  useEffect(() => {
    if (formData.region && REGION_AGENCY_MAP[formData.region]) {
      const newAgencies = REGION_AGENCY_MAP[formData.region];
      setAgencyList(newAgencies);
      
      // Automatically select the first agency if the current one is invalid for the new region
      if (!newAgencies.includes(formData.agency)) {
        updateField('agency', newAgencies[0]);
      }
    } else {
      setAgencyList([]);
      updateField('agency', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.region]);

  // Handle Author Change -> Auto-set Region
  const handleAuthorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedAuthor = e.target.value;
    updateField('author', selectedAuthor);

    // Auto-link logic
    if (AUTHOR_REGION_MAP[selectedAuthor]) {
      const linkedRegion = AUTHOR_REGION_MAP[selectedAuthor];
      updateField('region', linkedRegion);
      // Note: The useEffect above will handle setting the default agency for this region
    }
  };

  // Auto-calculate Age Group based on Decade/Year
  useEffect(() => {
    if (formData.birth_year) {
      const year = parseInt(formData.birth_year);
      const currentYear = new Date().getFullYear(); // 2026 roughly
      const age = currentYear - year;
      
      let group = '60대';
      if (age < 60) group = '60대 미만';
      else if (age >= 60 && age < 70) group = '60대';
      else if (age >= 70 && age < 80) group = '70대';
      else if (age >= 80 && age < 90) group = '80대';
      else if (age >= 90) group = '90대 이상';

      if (formData.age_group !== group) {
        updateField('age_group', group);
      }
    }
  }, [formData.birth_year]);

  const decades = [
    { label: '30년대', value: '1930' },
    { label: '40년대', value: '1940' },
    { label: '50년대', value: '1950' },
    { label: '60년대', value: '1960' },
  ];

  // Generate years from 1900 to current year
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => String(1900 + i)).reverse(); // 2026 down to 1900

  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${themeBorder} p-6 relative overflow-hidden transition-all duration-300 hover:shadow-md`}>
      <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${themeText.replace('text-', 'from-').replace('700', '600')} to-slate-200`}></div>
      
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-slate-100 p-2 rounded-lg text-slate-600"><User size={20} /></span>
        <h3 className="text-lg font-bold text-slate-800">기본 정보</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        
        {/* Date & Author (lg: col 3) */}
        <div className="lg:col-span-3 space-y-1">
          <label className="text-xs font-semibold text-slate-500 ml-1 flex items-center gap-1"><Calendar size={12}/> 조사일 및 담당자</label>
          <div className="grid grid-cols-2 gap-2">
            <input 
              type="date" 
              value={formData.survey_date}
              onChange={(e) => updateField('survey_date', e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none input-transition"
            />
            <select 
              value={formData.author}
              onChange={handleAuthorChange}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none input-transition font-bold text-slate-700"
            >
              <option value="">담당자 선택</option>
              {AUTHORS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* Region & Agency (lg: col 4) */}
        <div className="lg:col-span-4 space-y-1">
          <label className="text-xs font-semibold text-slate-500 ml-1 flex items-center gap-1"><MapPin size={12}/> 수행기관 (자동연동)</label>
          <div className="flex gap-2">
            <select 
              value={formData.region}
              onChange={(e) => updateField('region', e.target.value)}
              className="w-1/3 p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none input-transition"
            >
              <option value="">지역</option>
              {Object.keys(REGION_AGENCY_MAP).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select 
              value={formData.agency}
              onChange={(e) => updateField('agency', e.target.value)}
              className="w-2/3 p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none input-transition"
              disabled={!formData.region}
            >
              <option value="">기관 (자동선택)</option>
              {agencyList.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* User Info & Decade Selection (lg: col 5) */}
        <div className="lg:col-span-5 space-y-2">
           <label className="text-xs font-semibold text-slate-500 ml-1 flex items-center gap-1"><User size={12}/> 대상자 정보</label>
           
           {/* Name & Gender & Age Group */}
           <div className="flex gap-2">
             <input 
               type="text" 
               placeholder="성명"
               value={formData.name}
               onChange={(e) => updateField('name', e.target.value)}
               className="flex-1 p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none input-transition font-medium"
             />
             <select 
               value={formData.gender}
               onChange={(e) => updateField('gender', e.target.value)}
               className="w-20 p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
             >
                <option value="여">여</option>
                <option value="남">남</option>
             </select>
             <div className="w-24 flex items-center justify-center bg-slate-100 rounded-lg text-xs font-bold text-slate-600 border border-slate-200">
                {formData.age_group || '연령대'}
             </div>
           </div>

           {/* DOB Inputs - Modified: Year is now a Select */}
           <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                 <select 
                    value={formData.birth_year} 
                    onChange={(e) => updateField('birth_year', e.target.value)}
                    className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-center appearance-none"
                 >
                    <option value="">연도 선택</option>
                    {years.map(y => <option key={y} value={y}>{y}년</option>)}
                 </select>
                 <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                 </div>
              </div>
              
              <select 
                value={formData.birth_month} 
                onChange={(e) => updateField('birth_month', e.target.value)}
                className="w-20 p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {months.map(m => <option key={m} value={m}>{Number(m)}월</option>)}
              </select>
              
              <select 
                value={formData.birth_day} 
                onChange={(e) => updateField('birth_day', e.target.value)}
                className="w-20 p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {days.map(d => <option key={d} value={d}>{Number(d)}일</option>)}
              </select>
           </div>
           
           {/* Decade Selection Buttons */}
           <div className="flex gap-1">
             {decades.map((d) => {
               // Highlight logic: checks if the selected year starts with the decade prefix (e.g. 193)
               const isSelected = formData.birth_year && formData.birth_year.startsWith(d.value.substring(0,3));
               return (
                 <button
                   key={d.value}
                   onClick={() => updateField('birth_year', d.value)}
                   className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${
                     isSelected
                     ? 'bg-slate-700 text-white shadow-md transform scale-105'
                     : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
                   }`}
                   title={`${d.label}를 선택하면 목록이 ${d.value}년으로 이동합니다.`}
                 >
                   {d.label}
                 </button>
               );
             })}
           </div>
        </div>

        {/* Service Type - Full Width */}
        <div className="md:col-span-2 lg:col-span-12 pt-2 border-t border-slate-100 mt-2">
           <div className="flex flex-wrap gap-4 items-center">
             <label className="text-xs font-bold text-slate-500 flex items-center gap-1"><Briefcase size={12}/> 서비스 유형</label>
             <div className="flex gap-2">
               {['일반 서비스', '퇴원환자 단기 집중', '특화서비스'].map((type) => (
                 <button
                   key={type}
                   onClick={() => updateField('service_type', type)}
                   className={`px-4 py-1.5 rounded-full text-sm transition-all border ${
                     formData.service_type === type
                     ? 'bg-slate-800 text-white border-slate-800 shadow-md transform scale-105'
                     : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                   }`}
                 >
                   {type}
                 </button>
               ))}
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default BasicInfo;