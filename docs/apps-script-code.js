function doPost(e) {
    try {
        var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
        var data = JSON.parse(e.postData.contents);

        // Action 분기 처리
        if (data.action === 'updateResponse') {
            return handleUpdateResponse(spreadsheet, data);
        }

        if (data.action === 'updateRow') {
            return handleUpdateRow(spreadsheet, data);
        }

        // 기본 저장 로직
        // 1. 메인 모드 시트에 저장 (서비스 유형에 따라 시트 분리)
        var mainSheetName = getSheetName(data.Mode, data.Service_Type);
        saveToSheet(spreadsheet, mainSheetName, data, data.Mode);

        // 2. 유선(매월) 모드인 경우 -> 담당자 이름 시트에도 동시 저장
        if (data.Mode === 'phone') {
            var authorSheetName = data.Author;
            if (authorSheetName && authorSheetName.trim() !== '') {
                saveToSheet(spreadsheet, authorSheetName, data, 'phone');
            }
        }

        return ContentService
            .createTextOutput(JSON.stringify({ success: true, sheet: mainSheetName }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService
            .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

// 수행기관 답변 업데이트 핸들러
function handleUpdateResponse(spreadsheet, data) {
    var mainSheet = spreadsheet.getSheetByName('유선(매월)');
    if (!mainSheet) return ErrorResponse('Main sheet not found');

    var row = Number(data.rowNumber);
    var response = data.response;

    // 1. 메인 시트 업데이트
    updateColumn(mainSheet, row, '수행기관답변', response);

    // 2. 담당자 시트 동기화
    // 메인 시트에서 정보 읽기 (3열: 담당자, 8열: 대상자명)
    var author = mainSheet.getRange(row, 3).getValue();
    var targetName = mainSheet.getRange(row, 8).getValue();

    if (author && targetName) {
        var authorSheet = spreadsheet.getSheetByName(author);
        if (authorSheet) {
            // 담당자 시트에서 대상자명으로 행 찾기 (가장 최근 데이터 기준)
            var targetRow = findRowByName(authorSheet, targetName);
            if (targetRow > 0) {
                updateColumn(authorSheet, targetRow, '수행기관답변', response);
            }
        }
    }

    return ContentService
        .createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
}

function updateColumn(sheet, row, headerName, value) {
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var colIndex = headers.indexOf(headerName) + 1;

    if (colIndex > 1) {
        sheet.getRange(row, colIndex).setValue(value);
    }
}

function findRowByName(sheet, name) {
    var data = sheet.getDataRange().getValues();
    // 역순으로 탐색 (가장 최근 데이터 우선)
    for (var i = data.length - 1; i >= 1; i--) {
        if (data[i][7] == name) { // 8번째 열(Index 7)이 대상자명
            return i + 1;
        }
    }
    return -1;
}

function ErrorResponse(msg) {
    return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: msg }))
        .setMimeType(ContentService.MimeType.JSON);
}

// 행 업데이트 핸들러 (기존 데이터 덮어쓰기)
function handleUpdateRow(spreadsheet, data) {
    var row = Number(data.rowNumber);
    if (!row || row < 2) return ErrorResponse('유효하지 않은 행 번호입니다.');

    var mainSheet = spreadsheet.getSheetByName('유선(매월)');
    if (!mainSheet) return ErrorResponse('유선(매월) 시트를 찾을 수 없습니다.');

    // 기존 행 데이터를 새 데이터로 덮어쓰기
    var rowData = buildRowData(data, data.Mode || 'phone');
    var range = mainSheet.getRange(row, 1, 1, rowData.length);
    range.setValues([rowData]);

    // 담당자 시트도 동기화
    if (data.Author) {
        var authorSheet = spreadsheet.getSheetByName(data.Author);
        if (authorSheet) {
            var targetRow = findRowByName(authorSheet, data.Name);
            if (targetRow > 0) {
                var authorRange = authorSheet.getRange(targetRow, 1, 1, rowData.length);
                authorRange.setValues([rowData]);
            }
        }
    }

    return ContentService
        .createTextOutput(JSON.stringify({ success: true, message: '기존 기록이 수정되었습니다.' }))
        .setMimeType(ContentService.MimeType.JSON);
}

function saveToSheet(spreadsheet, sheetName, data, mode) {
    var sheet = spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
        sheet = spreadsheet.insertSheet(sheetName);
        addHeaders(sheet, mode, data.Service_Type); // 서비스 유형 전달
    }

    var row = buildRowData(data, mode);
    sheet.appendRow(row);
}

function getSheetName(mode, serviceType) {
    if (mode === 'visit') {
        if (serviceType === '일반 서비스') return '방문모니터링(일반)';
        if (serviceType === '퇴원환자 단기 집중') return '방문모니터링(퇴원)';
        if (serviceType === '특화서비스') return '방문모니터링(특화)';
        return '방문모니터링(기타)';
    }

    var sheetMap = {
        'online': '온라인설문',
        'phone': '유선(매월)',
        'visit': '방문모니터링', // Fallback
        'second-visit': '2차방문'
    };
    return sheetMap[mode] || '기타';
}

function buildRowData(data, mode) {
    var common = [
        data.Timestamp || '',
        data.Survey_Date || '',
        data.Author || '',
        data.Region || '',
        data.Agency || '',
        data.Mode || '',
        data.Service_Type || '',
        data.Name || '',
        data.Gender || '',
        data.Birth_Year || '',
        data.Birth_Month || '',
        data.Birth_Day || '',
        data.Age_Group || ''
    ];

    var specific = [];

    if (mode === 'phone') {
        specific = [
            data.Satisfaction || '',
            data.Service_Items || '',
            data.Visit_Freq || '',
            data.Call_Freq || '',
            // 일반 서비스 지표
            data.Gen_Stability || '',      // 생활 안정성
            data.Gen_Loneliness || '',     // 고독감 해소
            data.Gen_Safety || '',         // 안전망 체감도
            // 퇴원환자 단기 집중 지표
            data.Hosp_Indep || '',         // 초기 안착 및 자립
            data.Hosp_Anxiety || '',       // 재입원 불안 해소
            data.Hosp_Sat || '',           // 가사/신체지원 만족
            // 특화서비스 지표
            data.Spec_Emotion || '',       // 정서적 변화
            data.Spec_Social || '',        // 사회적 관계 형성
            data.Spec_Sat || '',           // 프로그램 만족도
            // 공통 필드
            data.Phone_Risk_Summary || '', // 안전동향
            data.Phone_Notes || '',        // 특이사항
            data.Is_RiskTarget || '',      // 1차대면 등록
            ''                             // 수행기관답변 초기값 (빈칸)
        ];
    } else if (mode === 'visit') {
        // JSON 파싱 및 데이터 추출
        var indicators = {};
        var hypotheses = [];
        try {
            if (data.Visit_Indicators_Json) {
                var parsed = JSON.parse(data.Visit_Indicators_Json);
                indicators = parsed.indicators || {};
                hypotheses = parsed.hypotheses || [];
            }
        } catch (e) {
            // JSON 파싱 실패 시 무시
        }

        // 가설 데이터 병합 (여러 개일 경우 줄바꿈으로 구분)
        var h_factors = hypotheses.map(function (h) { return h.factor; }).join('\n');
        var h_outcomes = hypotheses.map(function (h) { return h.outcome; }).join('\n');
        var h_evidence = hypotheses.map(function (h) { return h.evidence; }).join('\n');
        var h_status = hypotheses.map(function (h) { return h.status; }).join('\n');

        // 서비스 유형별 키 접두사 결정
        var p = 'gen'; // default
        if (data.Service_Type === '퇴원환자 단기 집중') p = 'hosp';
        else if (data.Service_Type === '특화서비스') p = 'spec';

        specific = [
            data.Env_Risks || '',
            data.Safety_Risks || '',
            data.Body_Status || '',
            data.Visit_Grade || '',
            data.Visit_Action_Memo || '',
            // 지표 1~10 분리 (동적 키 사용)
            indicators[p + '_1'] || '',
            indicators[p + '_2'] || '',
            indicators[p + '_3'] || '',
            indicators[p + '_4'] || '',
            indicators[p + '_5'] || '',
            indicators[p + '_6'] || '',
            indicators[p + '_7'] || '',
            indicators[p + '_8'] || '',
            indicators[p + '_9'] || '',
            indicators[p + '_10'] || '',
            // 가설 분리
            h_factors,
            h_outcomes,
            h_evidence,
            h_status
        ];
    } else if (mode === 'second-visit') {
        specific = [
            data.Visit2_Reason || '',
            data.Track_Stability || '',
            data.Track_Emotion || '',
            data.Track_Social || '',
            data.Track_Health || '',
            data.Interview_Answers_Json || '',
            data.Interviewer_Opinion || ''
        ];
    } else if (mode === 'online') {
        specific = [
            data.Service_Duration || '',
            data.Satisfied_Areas || '',
            data.Outdoor_Freq || '',
            data.Visited_Places || '',
            data.Elder_Opinion || ''
        ];
    }

    return common.concat(specific);
}

function addHeaders(sheet, mode, serviceType) {
    var commonHeaders = [
        '저장시각', '조사일자', '담당자', '시군', '수행기관', '모니터링방법',
        '서비스유형', '대상자명', '성별', '출생연도', '출생월', '출생일', '연령대'
    ];

    var specificHeaders = [];

    if (mode === 'phone') {
        specificHeaders = [
            '만족도', '서비스항목', '방문빈도', '전화빈도',
            // 일반 서비스 지표
            '(일반)생활안정성', '(일반)고독감해소', '(일반)안전망체감도',
            // 퇴원환자 단기 집중 지표
            '(퇴원)초기안착자립', '(퇴원)재입원불안해소', '(퇴원)가사신체지원만족',
            // 특화서비스 지표
            '(특화)정서적변화', '(특화)사회적관계형성', '(특화)프로그램만족도',
            // 공통 필드
            '안전동향', '특이사항', '1차대면등록', '수행기관답변'
        ];
    } else if (mode === 'visit') {
        // 공통 방문 헤더
        var visitCommon = ['환경위험', '안전위험', '신체상태', '방문등급', '방문_조치사항'];

        // 서비스 유형별 지표 헤더
        var indicatorHeaders = [];
        if (serviceType === '일반 서비스') {
            indicatorHeaders = [
                '지표1_불안_걱정_순간', '지표2_친구_만남_기분', '지표3_건강_체조_실천', '지표4_스마트폰_사용', '지표5_비상_연락처',
                '지표6_생활_즐거움', '지표7_말벗_도움_여부', '지표8_기억력_저하_걱정', '지표9_식사_규칙성', '지표10_서비스_지속_의향'
            ];
        } else if (serviceType === '퇴원환자 단기 집중') {
            indicatorHeaders = [
                '지표1_퇴원후_식사_준비', '지표2_가사지원_회복_도움', '지표3_병원_동행_필요성', '지표4_약물_복용_관리', '지표5_낙상_두려움',
                '지표6_재입원_불안', '지표7_일상생활_자립도', '지표8_보호자_부담_경감', '지표9_요양병원_입소_고려', '지표10_건강_회복_체감'
            ];
        } else if (serviceType === '특화서비스') {
            indicatorHeaders = [
                '지표1_우울감_정도', '지표2_삶의_기대감', '지표3_대인관계_불편함', '지표4_외출_빈도', '지표5_고독사_불안',
                '지표6_담당자_신뢰도', '지표7_동료_유대감', '지표8_웃음_빈도', '지표9_자살_생각_여부', '지표10_외부_활동_의지'
            ];
        } else {
            indicatorHeaders = ['지표1', '지표2', '지표3', '지표4', '지표5', '지표6', '지표7', '지표8', '지표9', '지표10'];
        }

        var hypothesisHeaders = ['가설_요인', '가설_결과', '가설_증거', '가설_상태'];
        specificHeaders = visitCommon.concat(indicatorHeaders).concat(hypothesisHeaders);

    } else if (mode === 'second-visit') {
        specificHeaders = ['2차방문_사유', '추적_안정성', '추적_정서', '추적_사회성', '추적_건강', '심층면접_응답JSON', '면접자의견'];
    } else if (mode === 'online') {
        specificHeaders = ['서비스기간', '만족분야', '외출빈도', '방문장소', '어르신의견'];
    }

    var fullHeaders = commonHeaders.concat(specificHeaders);
    sheet.appendRow(fullHeaders);
    sheet.getRange(1, 1, 1, fullHeaders.length).setFontWeight('bold').setBackground('#4A90D9').setFontColor('white');
    sheet.setFrozenRows(1);
}

function doGet(e) {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';

    if (action === 'getData') {
        try {
            var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
            var sheet = spreadsheet.getSheetByName('유선(매월)');

            if (!sheet) {
                return ContentService
                    .createTextOutput(JSON.stringify({ success: false, error: '유선(매월) 시트를 찾을 수 없습니다.' }))
                    .setMimeType(ContentService.MimeType.JSON);
            }

            var data = sheet.getDataRange().getValues();
            if (data.length < 2) {
                return ContentService
                    .createTextOutput(JSON.stringify({ success: true, data: [] }))
                    .setMimeType(ContentService.MimeType.JSON);
            }

            var headers = data[0];
            // 헤더를 영문 키로 매핑 (프론트엔드와 일치)
            var headerMap = {
                '저장시각': 'Timestamp',
                '조사일자': 'Survey_Date',
                '담당자': 'Author',
                '시군': 'Region',
                '수행기관': 'Agency',
                '모니터링방법': 'Mode',
                '서비스유형': 'Service_Type',
                '대상자명': 'Name',
                '성별': 'Gender',
                '출생연도': 'Birth_Year',
                '출생월': 'Birth_Month',
                '출생일': 'Birth_Day',
                '연령대': 'Age_Group',
                '만족도': 'Satisfaction',
                '서비스항목': 'Service_Items',
                '방문빈도': 'Visit_Freq',
                '전화빈도': 'Call_Freq',
                '안전동향': 'Phone_Risk_Summary',
                '특이사항': 'Phone_Notes',
                '1차대면등록': 'Is_RiskTarget',
                '수행기관답변': 'Agency_Response'
            };

            var rows = [];
            for (var i = 1; i < data.length; i++) {
                var obj = { rowNumber: i + 1 }; // 실제 시트 행 번호 (1-indexed, 헤더 건너뜀)
                for (var j = 0; j < headers.length; j++) {
                    var key = headerMap[headers[j]] || headers[j];
                    obj[key] = data[i][j] !== undefined ? String(data[i][j]) : '';
                }
                rows.push(obj);
            }

            return ContentService
                .createTextOutput(JSON.stringify({ success: true, data: rows }))
                .setMimeType(ContentService.MimeType.JSON);

        } catch (error) {
            return ContentService
                .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
                .setMimeType(ContentService.MimeType.JSON);
        }
    }

    // 기본 헬스체크
    return ContentService.createTextOutput('노인돌봄 모니터링 시스템 API가 작동 중입니다.');
}
