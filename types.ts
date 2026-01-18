
export type MonitoringMode = '유선(매월)' | '온라인설문' | '1차 대면' | '2차 대면' | '답변관리';
export type ServiceType = '일반 서비스' | '퇴원환자 단기 집중' | '특화서비스';

export interface AgencyMap {
  [region: string]: string[];
}

export interface RiskTarget {
  id: number;
  name: string;
  gender: string;
  birth_year: string;
  agency: string;
  service_type?: ServiceType; // Ensure this is available
  riskDetails: string;
  date: string;
  // Pre-filled Visit Data
  env_check?: string[];
  safety_check?: string[];
  body_status?: string;
  visit_indicators?: Record<string, string>;
  final_grade?: string;
  action_memo?: string;
}

export interface PhoneCallRecord {
  id: number;
  name: string;
  gender: string;
  birth_year: string;
  agency: string;
  service_type?: ServiceType;
  date: string;
  status: 'completed' | 'risk';
  summary: string;
  // Details for form population
  satisfaction: string;
  service_items?: string[];
  visit_count?: string;
  call_count?: string;
  phone_indicators?: Record<string, string>;
  safety_trend: string;
  special_notes: string;
}

export interface Hypothesis {
  id: number;
  subjectName: string;
  factor: string;
  outcome: string;
  evidence: string;
  priority: '높음' | '중간' | '낮음';
  sendToStep2: boolean;
  status: 'discovered' | 'verifying' | 'verified' | 'confirmed';
  createdAt: string;
  verifiedAt?: string;
  causeQ?: string;
  effectQ?: string;
  verificationData?: VerificationData[];
}

export interface VerificationData {
  respondentName: string;
  factorMatch: string;
  outcomeMatch: string;
  pattern: string;
  timestamp: string;
}

export interface Candidate {
  id: number;
  name: string;
  gender: string;
  birth_year: string;
  agency: string;
  service_type?: ServiceType; // Added for consistency
  reason: string;
  reasonType: string;
  // Pre-filled Interview Data
  track_stability?: string;
  track_emotion?: string;
  track_social?: string;
  track_health?: string;
  interview_answers?: Record<string, string>;
  interviewer_opinion?: string;
}

// Simplified form state interface (covers core fields)
export interface FormDataState {
  // Basic
  survey_date: string;
  author: string;
  mon_method: MonitoringMode;
  name: string;
  gender: string;
  birth_year: string;
  birth_month: string;
  birth_day: string;
  age_group: string;
  region: string;
  agency: string;
  service_type: ServiceType;

  // Phone Mode
  satisfaction: string;
  service_items: string[];
  visit_count: string;
  call_count: string;
  safety_trend: string;
  special_notes: string;
  phone_indicators: Record<string, string>;

  // 1st Visit Mode (Risk Screening)
  env_check: string[];
  safety_check: string[];
  body_status: string;
  visit_indicators: Record<string, string>;
  final_grade: string;
  action_memo: string;

  // 2nd Visit Mode (Interview)
  visit2_reason: string;
  track_stability: string;
  track_emotion: string;
  track_social: string;
  track_health: string;
  interview_answers: Record<string, string>;
  interviewer_opinion: string;

  // Online Mode Updates
  service_duration: string;
  service_satisfaction_areas: string[];
  outdoor_frequency: string;
  visited_places: string[];
  online_opinion: string;

  // Risk Target Flag (1차 대면 대상자 여부)
  is_risk_target?: boolean;
}
