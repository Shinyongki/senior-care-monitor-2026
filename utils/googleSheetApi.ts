import { FormDataState, Hypothesis } from '../types';

export const sendToGoogleSheet = async (scriptUrl: string, data: FormDataState, extraData?: { hypotheses?: Hypothesis[] }) => {
  if (!scriptUrl) return { success: false, message: 'API URL이 설정되지 않았습니다.' };

  try {
    const isPhoneMode = data.mon_method === '유선(매월)';
    const isVisitMode = data.mon_method === '1차 대면';

    // Map Korean Mode to Apps Script English Codes
    const modeMap: Record<string, string> = {
      '온라인설문': 'online',
      '유선(매월)': 'phone',
      '1차 대면': 'visit',
      '2차 대면': 'second-visit'
    };
    const mappedMode = modeMap[data.mon_method] || 'other';

    // 1. Flatten and Format Data for Spreadsheet
    const payload = {
      // Meta Data
      Timestamp: new Date().toLocaleString('ko-KR'),

      // Basic Info
      Survey_Date: data.survey_date,
      Author: data.author,
      Region: data.region,
      Agency: data.agency,
      Mode: mappedMode, // Send the mapped English code
      Service_Type: data.service_type,

      // Target Info
      Name: data.name,
      Gender: data.gender,
      Birth_Year: data.birth_year,
      Birth_Month: data.birth_month,
      Birth_Day: data.birth_day,
      Age_Group: data.age_group,

      // Phone Mode Data (Sent ONLY in Phone Mode)
      Satisfaction: isPhoneMode ? data.satisfaction : '',
      Service_Items: isPhoneMode ? data.service_items.join(', ') : '',
      Visit_Freq: isPhoneMode ? data.visit_count : '',
      Call_Freq: isPhoneMode ? data.call_count : '',

      // Individual Phone Indicators
      Gen_Stability: isPhoneMode ? (data.phone_indicators?.['gen_stability'] || '') : '',
      Gen_Loneliness: isPhoneMode ? (data.phone_indicators?.['gen_loneliness'] || '') : '',
      Gen_Safety: isPhoneMode ? (data.phone_indicators?.['gen_safety'] || '') : '',
      Hosp_Indep: isPhoneMode ? (data.phone_indicators?.['hosp_indep'] || '') : '',
      Hosp_Anxiety: isPhoneMode ? (data.phone_indicators?.['hosp_anxiety'] || '') : '',
      Hosp_Sat: isPhoneMode ? (data.phone_indicators?.['hosp_sat'] || '') : '',
      Spec_Emotion: isPhoneMode ? (data.phone_indicators?.['spec_emotion'] || '') : '',
      Spec_Social: isPhoneMode ? (data.phone_indicators?.['spec_social'] || '') : '',
      Spec_Sat: isPhoneMode ? (data.phone_indicators?.['spec_sat'] || '') : '',

      Phone_Risk_Summary: isPhoneMode ? data.safety_trend : '',
      Phone_Notes: isPhoneMode ? data.special_notes : '',
      Phone_Indicators_Json: isPhoneMode ? JSON.stringify(data.phone_indicators) : '',

      // Visit Mode Data
      Env_Risks: data.env_check.join(', '),
      Safety_Risks: data.safety_check.join(', '),
      Body_Status: data.body_status,
      Visit_Grade: data.final_grade,
      Visit_Action_Memo: data.action_memo,
      // Include Hypotheses in Visit Indicators JSON if available
      Visit_Indicators_Json: JSON.stringify({
        indicators: data.visit_indicators,
        hypotheses: extraData?.hypotheses || []
      }),

      // 2nd Visit Data
      Visit2_Reason: data.visit2_reason,
      Track_Stability: data.track_stability,
      Track_Emotion: data.track_emotion,
      Track_Social: data.track_social,
      Track_Health: data.track_health,
      Interview_Answers_Json: JSON.stringify(data.interview_answers),
      Interviewer_Opinion: data.interviewer_opinion,

      // Online Mode Data
      Service_Duration: data.service_duration,
      Satisfied_Areas: data.service_satisfaction_areas.join(', '),
      Outdoor_Freq: data.outdoor_frequency,
      Visited_Places: data.visited_places.join(', '),
      Elder_Opinion: data.online_opinion,

      // Risk Target Flag
      Is_RiskTarget: data.is_risk_target ? '예' : '',
    };

    // 2. Send Request
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return { success: true, message: '구글 시트에 성공적으로 저장되었습니다.' };

  } catch (error) {
    console.error('Sheet Sync Error:', error);
    return { success: false, message: '데이터 전송 중 오류가 발생했습니다.' };
  }
};

// 시트 데이터 조회 (GET 요청)
export interface SheetRow {
  rowNumber: number;
  저장시각?: string;
  조사일자?: string;
  담당자?: string;
  시군?: string;
  수행기관?: string;
  모니터링방법?: string;
  서비스유형?: string;
  대상자명?: string;
  성별?: string;
  만족도?: string;
  안전동향?: string;
  특이사항?: string;
  수행기관답변?: string;
  [key: string]: string | number | undefined;
}

// 시트 데이터 삭제 (GET 요청 우회)
export const deleteRowFromSheet = async (scriptUrl: string, rowNumber: number, author: string): Promise<{ success: boolean; message?: string }> => {
  if (!scriptUrl) return { success: false, message: 'API URL이 설정되지 않았습니다.' };

  try {
    const url = new URL(scriptUrl);
    url.searchParams.append('action', 'delete');
    url.searchParams.append('rowNumber', String(rowNumber));
    url.searchParams.append('author', author);

    const response = await fetch(url.toString(), {
      method: 'GET',
    });

    if (response.type === 'opaque') {
      // no-cors returns opaque, but our script is returning JSON with CORS headers usually so it shouldn't hit this if deployed as Web App returning ContentService properly, but let's be safe.
      return { success: true, message: '삭제 요청이 전송되었습니다.' };
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Delete Sheet Data Error:', error);
    return { success: false, message: '데이터 삭제 중 오류가 발생했습니다.' };
  }
};

export const fetchSheetData = async (scriptUrl: string): Promise<{ success: boolean; data?: SheetRow[]; message?: string }> => {
  if (!scriptUrl) return { success: false, message: 'API URL이 설정되지 않았습니다.' };

  try {
    // Removed incorrect POST request that was triggering doPost save logic

    // no-cors mode returns opaque response, so we cannot read the body directly.
    // Instead, use a redirect-based approach with GET + query parameter
    // Fallback: try GET with action parameter
    const getResponse = await fetch(`${scriptUrl}?action=getData`, {
      method: 'GET',
      redirect: 'follow',
    });

    const text = await getResponse.text();
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error('JSON Parse Error:', text.substring(0, 100));
      return {
        success: false,
        message: '구글 시트에서 데이터를 불러올 수 없습니다.\n\n앱스 스크립트의 doGet 함수에 getData 액션 처리가 필요합니다.\n\n현재 응답: ' + text.substring(0, 50)
      };
    }

    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, message: result.error || '데이터 조회 실패' };
    }
  } catch (error) {
    console.error('Sheet Fetch Error:', error);
    return { success: false, message: '데이터 조회 중 오류가 발생했습니다.' };
  }
};

// 수행기관 답변 업데이트 (POST 요청)
export const updateAgencyResponse = async (
  scriptUrl: string,
  rowNumber: number,
  response: string
): Promise<{ success: boolean; message: string }> => {
  if (!scriptUrl) return { success: false, message: 'API URL이 설정되지 않았습니다.' };

  try {
    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'updateResponse',
        rowNumber: rowNumber,
        response: response,
      }),
    });

    return { success: true, message: '수행기관 답변이 저장되었습니다.' };

  } catch (error) {
    console.error('Response Update Error:', error);
    return { success: false, message: '답변 저장 중 오류가 발생했습니다.' };
  }
};

// 행 업데이트 (덮어쓰기)
export const updateSheetRow = async (
  scriptUrl: string,
  rowNumber: number,
  data: FormDataState,
  extraData?: { hypotheses?: Hypothesis[] }
): Promise<{ success: boolean; message: string }> => {
  if (!scriptUrl) return { success: false, message: 'API URL이 설정되지 않았습니다.' };

  try {
    const isPhoneMode = data.mon_method === '유선(매월)';

    // Map Korean Mode to Apps Script English Codes
    const modeMap: Record<string, string> = {
      '온라인설문': 'online',
      '유선(매월)': 'phone',
      '1차 대면': 'visit',
      '2차 대면': 'second-visit'
    };
    const mappedMode = modeMap[data.mon_method] || 'other';

    // Construct Payload (Same as sendToGoogleSheet but with 'updateRow' action)
    const payload = {
      action: 'updateRow',
      rowNumber: rowNumber,

      // Meta Data
      Timestamp: new Date().toLocaleString('ko-KR'),

      // Basic Info
      Survey_Date: data.survey_date,
      Author: data.author,
      Region: data.region,
      Agency: data.agency,
      Mode: mappedMode,
      Service_Type: data.service_type,

      // Target Info
      Name: data.name,
      Gender: data.gender,
      Birth_Year: data.birth_year,
      Birth_Month: data.birth_month,
      Birth_Day: data.birth_day,
      Age_Group: data.age_group,

      // Phone Mode Data
      Satisfaction: isPhoneMode ? data.satisfaction : '',
      Service_Items: isPhoneMode ? data.service_items.join(', ') : '',
      Visit_Freq: isPhoneMode ? data.visit_count : '',
      Call_Freq: isPhoneMode ? data.call_count : '',

      // Individual Phone Indicators
      Gen_Stability: isPhoneMode ? (data.phone_indicators?.['gen_stability'] || '') : '',
      Gen_Loneliness: isPhoneMode ? (data.phone_indicators?.['gen_loneliness'] || '') : '',
      Gen_Safety: isPhoneMode ? (data.phone_indicators?.['gen_safety'] || '') : '',
      Hosp_Indep: isPhoneMode ? (data.phone_indicators?.['hosp_indep'] || '') : '',
      Hosp_Anxiety: isPhoneMode ? (data.phone_indicators?.['hosp_anxiety'] || '') : '',
      Hosp_Sat: isPhoneMode ? (data.phone_indicators?.['hosp_sat'] || '') : '',
      Spec_Emotion: isPhoneMode ? (data.phone_indicators?.['spec_emotion'] || '') : '',
      Spec_Social: isPhoneMode ? (data.phone_indicators?.['spec_social'] || '') : '',
      Spec_Sat: isPhoneMode ? (data.phone_indicators?.['spec_sat'] || '') : '',

      Phone_Risk_Summary: isPhoneMode ? data.safety_trend : '',
      Phone_Notes: isPhoneMode ? data.special_notes : '',
      Phone_Indicators_Json: isPhoneMode ? JSON.stringify(data.phone_indicators) : '',

      // Visit Mode Data
      Env_Risks: data.env_check.join(', '),
      Safety_Risks: data.safety_check.join(', '),
      Body_Status: data.body_status,
      Visit_Grade: data.final_grade,
      Visit_Action_Memo: data.action_memo,
      Visit_Indicators_Json: JSON.stringify({
        indicators: data.visit_indicators,
        hypotheses: extraData?.hypotheses || []
      }),

      // 2nd Visit Data
      Visit2_Reason: data.visit2_reason,
      Track_Stability: data.track_stability,
      Track_Emotion: data.track_emotion,
      Track_Social: data.track_social,
      Track_Health: data.track_health,
      Interview_Answers_Json: JSON.stringify(data.interview_answers),
      Interviewer_Opinion: data.interviewer_opinion,

      // Online Mode Data
      Service_Duration: data.service_duration,
      Satisfied_Areas: data.service_satisfaction_areas.join(', '),
      Outdoor_Freq: data.outdoor_frequency,
      Visited_Places: data.visited_places.join(', '),
      Elder_Opinion: data.online_opinion,

      // Risk Target Flag
      Is_RiskTarget: data.is_risk_target ? '예' : '',
    };

    await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return { success: true, message: '기존 기록이 성공적으로 수정되었습니다.' };

  } catch (error) {
    console.error('Sheet Update Error:', error);
    return { success: false, message: '데이터 수정 중 오류가 발생했습니다.' };
  }
};
