
import { FormDataState } from '../types';

export const sendToGoogleSheet = async (scriptUrl: string, data: FormDataState) => {
  if (!scriptUrl) return { success: false, message: 'API URL이 설정되지 않았습니다.' };

  try {
    // 1. Flatten and Format Data for Spreadsheet
    // We convert complex objects/arrays into strings for cleaner sheet cells
    const payload = {
      // Meta Data
      Timestamp: new Date().toLocaleString('ko-KR'),
      
      // Basic Info
      Survey_Date: data.survey_date,
      Author: data.author,
      Region: data.region,
      Agency: data.agency,
      Mode: data.mon_method,
      Service_Type: data.service_type,
      
      // Target Info
      Name: data.name,
      Gender: data.gender,
      Birth_Year: data.birth_year,
      Age_Group: data.age_group,

      // Phone Mode Data
      Satisfaction: data.satisfaction,
      Service_Items: data.service_items.join(', '), // Array -> String
      Visit_Freq: data.visit_count,
      Call_Freq: data.call_count,
      Phone_Risk_Summary: data.safety_trend, // Rename for clarity
      Phone_Notes: data.special_notes,
      Phone_Indicators_Json: JSON.stringify(data.phone_indicators), // Keep raw data just in case

      // Visit Mode Data
      Env_Risks: data.env_check.join(', '),
      Safety_Risks: data.safety_check.join(', '),
      Body_Status: data.body_status,
      Visit_Grade: data.final_grade,
      Visit_Action_Memo: data.action_memo,
      Visit_Indicators_Json: JSON.stringify(data.visit_indicators),

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
    };

    // 2. Send Request
    // Note: mode 'no-cors' is used because GAS web apps don't return standard CORS headers easily
    // We assume success if the request is sent without network error.
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
