'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, ImagePlus, Loader2, Sparkles, UserRound } from 'lucide-react';
import { gsap } from 'gsap';

const PRICE_PER_USE_KRW = 1000;

const SIMULATION_TEMPLATES = [
  {
    id: 'acne',
    label: '여드름 완화',
    preview:
      '붉은 트러블이 줄어들고 피부 톤이 고르게 보이는 인상. 피부 표면이 조금 더 매끈해 보임.',
    routine: ['저자극 클렌저 사용', '논코메도제닉 보습제', '주 2-3회 각질 케어'],
    metricKeys: ['acne_score', 'redness_score'],
  },
  {
    id: 'darkCircle',
    label: '다크서클 완화',
    preview: '눈 밑 음영이 옅어져 피곤한 인상이 완화되고 얼굴 전체가 밝고 또렷해 보임.',
    routine: ['눈가 보습 강화', '수면 루틴 고정', '자외선 차단 + 아이크림 사용'],
    metricKeys: ['dark_circle_score', 'wrinkle_eye'],
  },
  {
    id: 'texture',
    label: '피부결 개선',
    preview: '모공 표현이 완만해지고 결이 정돈되어 메이크업 없이도 균일한 피부 표현에 유리함.',
    routine: ['세안 후 진정 토너', '나이아신아마이드 계열 사용', '수분 마스크 주 2회'],
    metricKeys: ['pore_score', 'asymmetry_score'],
  },
];

const detailedCareCatalog = {
  acne: [
    {
      id: 'home',
      title: '추천 홈케어',
      summary: '트러블 진정 + 피지 밸런스',
      period: '예상 기간: 2~4주',
      expected: '기대 개선: 트러블/붉은기 약 10~20%',
      focus_ingredients: ['나이아신아마이드', '판테놀', '시카'],
      avoid_ingredients: ['고농도 알코올', '강한 스크럽'],
      lifestyle_tip: '세안 후 3분 이내 보습을 완료하면 자극 반응을 줄이는 데 도움이 됩니다.',
      video_links: [
        { title: '민감 피부 저자극 세안 루틴', url: 'https://www.youtube.com/results?search_query=%EC%A0%80%EC%9E%90%EA%B7%B9+%EC%84%B8%EC%95%88+%EB%A3%A8%ED%8B%B4' },
        { title: '트러블 피부 보습 가이드', url: 'https://www.youtube.com/results?search_query=%ED%8A%B8%EB%9F%AC%EB%B8%94+%ED%94%BC%EB%B6%80+%EB%B3%B4%EC%8A%B5+%EB%A3%A8%ED%8B%B4' },
      ],
      details: [
        '저자극 클렌저로 아침/저녁 세안',
        'BHA 또는 약한 각질 케어를 주 2회로 시작',
        '논코메도제닉 보습제와 자외선 차단 필수',
      ],
    },
    {
      id: 'massage',
      title: '마사지',
      summary: '자극 없는 림프 순환 위주',
      period: '예상 기간: 2~3주',
      expected: '기대 개선: 붓기/붉은 인상 약 5~12%',
      details: [
        '트러블 부위 압박 금지, 턱선-귀밑 방향으로 가볍게 롤링',
        '냉감 도구로 3~5분 진정 마사지',
      ],
    },
    {
      id: 'procedure',
      title: '시술',
      summary: '피부과 상담 후 맞춤 진행',
      period: '예상 기간: 4~8주',
      expected: '기대 개선: 상태에 따라 약 20~35%',
      details: ['압출/스케일링/진정관리 등은 피부 상태 확인 후 단계적으로 진행'],
    },
  ],
  darkCircle: [
    {
      id: 'home',
      title: '추천 홈케어',
      summary: '눈가 보습 + 색소 완화',
      period: '예상 기간: 3~6주',
      expected: '기대 개선: 다크서클 인상 약 8~18%',
      focus_ingredients: ['카페인', '비타민C 저농도', '히알루론산'],
      avoid_ingredients: ['강한 향료', '과도한 레티놀 중복'],
      lifestyle_tip: '취침 1시간 전 블루라이트 노출을 줄이면 눈가 컨디션 관리에 유리합니다.',
      video_links: [
        { title: '눈가 보습 루틴 가이드', url: 'https://www.youtube.com/results?search_query=%EB%88%88%EA%B0%80+%EB%B3%B4%EC%8A%B5+%EB%A3%A8%ED%8B%B4' },
        { title: '다크서클 완화 생활 습관', url: 'https://www.youtube.com/results?search_query=%EB%8B%A4%ED%81%AC%EC%84%9C%ED%81%B4+%EC%83%9D%ED%99%9C+%EC%8A%B5%EA%B4%80' },
      ],
      details: [
        '아이크림/보습제는 문지르지 말고 톡톡 흡수',
        '비타민C/나이아신아마이드 계열을 저농도로 시작',
        '수면 루틴 고정(취침/기상 시간 일정화)',
      ],
    },
    {
      id: 'massage',
      title: '마사지',
      summary: '눈가 림프 순환',
      period: '예상 기간: 2~4주',
      expected: '기대 개선: 부기/피로 인상 약 5~10%',
      details: [
        '눈 밑 안쪽에서 바깥쪽으로 약한 압력으로 1~2분',
        '눈가 피부가 얇아 강한 마찰은 금지',
      ],
    },
    {
      id: 'procedure',
      title: '시술',
      summary: '다크서클 원인형 접근',
      period: '예상 기간: 4~10주',
      expected: '기대 개선: 유형별 약 15~35%',
      details: ['혈관형/색소형/구조형 구분 후 레이저·주사·필러 등 상담 권장'],
    },
  ],
  texture: [
    {
      id: 'home',
      title: '추천 홈케어',
      summary: '결 정돈 + 수분 유지',
      period: '예상 기간: 2~5주',
      expected: '기대 개선: 피부결 균일감 약 10~22%',
      focus_ingredients: ['판테놀', '세라마이드', '나이아신아마이드'],
      avoid_ingredients: ['과도한 각질제거 성분 중복'],
      lifestyle_tip: '각질 케어를 한 날은 진정·보습 단계에 집중해 장벽 회복을 우선하세요.',
      video_links: [
        { title: '피부결 개선 기초 루틴', url: 'https://www.youtube.com/results?search_query=%ED%94%BC%EB%B6%80%EA%B2%B0+%EA%B0%9C%EC%84%A0+%EB%A3%A8%ED%8B%B4' },
        { title: '각질 케어 빈도 설정법', url: 'https://www.youtube.com/results?search_query=%EA%B0%81%EC%A7%88+%EC%BC%80%EC%96%B4+%EB%B9%88%EB%8F%84' },
      ],
      details: [
        '세안 후 수분 토너-세럼-크림 순서 고정',
        '나이아신아마이드/판테놀 위주로 장벽 강화',
        '주 1~2회 각질 케어로 표면 정돈',
      ],
    },
    {
      id: 'massage',
      title: '마사지',
      summary: '결 방향 정돈',
      period: '예상 기간: 2~4주',
      expected: '기대 개선: 표면 결 정돈 약 6~12%',
      details: [
        '볼 중앙에서 바깥 방향으로 부드럽게 마사지',
        '오일 사용 시 모공 막힘 여부 체크 후 즉시 세안',
      ],
    },
    {
      id: 'procedure',
      title: '시술',
      summary: '모공/결 집중 관리',
      period: '예상 기간: 4~8주',
      expected: '기대 개선: 결/모공 체감 약 18~35%',
      details: ['프락셔널/스킨부스터 등은 피부 타입에 맞춰 단계적으로 진행'],
    },
  ],
};

const MAIN_SUMMARY_HIGH_LINE1 = '점수 시스템이 당신한텐 실례네요.';
const MAIN_SUMMARY_HIGH_LINE2 = '미모 과몰입 유발, 경고.';
const MAIN_SUMMARY_LOW_LINE1 = '와 당신의 미모는 인재인데요?';
const MAIN_SUMMARY_LOW_LINE2 = '우리와 함께할 인재..ㅎ 개선하러갈까요?';
const OPERATOR_UNLIMITED_MODE = true;

function toRangeScore(value, fallback = 0) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  if (value <= 1 && value >= 0) return Math.round(value * 100);
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

function normalizeReasonMap(reason) {
  if (!reason || typeof reason !== 'object') return {};
  return {
    acne: typeof reason.acne === 'string' ? reason.acne.trim() : '',
    pores: typeof reason.pores === 'string' ? reason.pores.trim() : '',
    redness: typeof reason.redness === 'string' ? reason.redness.trim() : '',
    dark_circle: typeof reason.dark_circle === 'string' ? reason.dark_circle.trim() : '',
    wrinkle_eye: typeof reason.wrinkle_eye === 'string' ? reason.wrinkle_eye.trim() : '',
    symmetry: typeof reason.symmetry === 'string' ? reason.symmetry.trim() : '',
  };
}

function mapApiToUi(data) {
  const acneScore = toRangeScore(data?.acne_score, 50);
  const poreScore = toRangeScore(data?.pore_score, 50);
  const rednessScore = toRangeScore(data?.redness_score, 50);
  const darkCircleScore = toRangeScore(data?.dark_circle_score, 50);
  const wrinkleScore = toRangeScore(data?.wrinkle_eye_score, null);
  const symmetryScore = toRangeScore(data?.symmetry_score, 50);
  const asymmetryScore = Math.max(0, 100 - symmetryScore);
  const focusPriority = Array.isArray(data?.focus_priority)
    ? data.focus_priority
        .map((id) => String(id || '').trim())
        .filter((id) => ['acne', 'darkCircle', 'texture'].includes(id))
    : [];
  const progressTimeline = Array.isArray(data?.progress_timeline)
    ? data.progress_timeline
        .map((item) => ({
          phase: String(item?.phase || '').trim(),
          expectation: String(item?.expectation || '').trim(),
          focus: String(item?.focus || '').trim(),
        }))
        .filter((item) => item.phase && item.expectation)
    : [];
  const ingredientGuide =
    data?.ingredient_guide && typeof data.ingredient_guide === 'object'
      ? {
          recommended: Array.isArray(data.ingredient_guide.recommended)
            ? data.ingredient_guide.recommended.map((item) => String(item)).filter(Boolean)
            : [],
          avoid: Array.isArray(data.ingredient_guide.avoid)
            ? data.ingredient_guide.avoid.map((item) => String(item)).filter(Boolean)
            : [],
          note: String(data.ingredient_guide.note || '').trim(),
        }
      : { recommended: [], avoid: [], note: '' };

  return {
    acne_score: acneScore,
    pore_score: poreScore,
    wrinkle_eye: typeof wrinkleScore === 'number' ? wrinkleScore : null,
    dark_circle_score: darkCircleScore,
    redness_score: rednessScore,
    asymmetry_score: asymmetryScore,
    skin_type: data?.skin_type || '중성',
    skin_type_description: typeof data?.skin_type_description === 'string' ? data.skin_type_description.trim() : '',
    analysis_summary: typeof data?.analysis_summary === 'string' ? data.analysis_summary.trim() : '',
    focus_priority: focusPriority,
    progress_timeline: progressTimeline,
    ingredient_guide: ingredientGuide,
    reason: normalizeReasonMap(data?.reason),
    care_plan: data?.care_plan && typeof data.care_plan === 'object' ? data.care_plan : null,
    procedure_recommendations:
      data?.procedure_recommendations && typeof data.procedure_recommendations === 'object'
        ? data.procedure_recommendations
        : null,
  };
}

function getSummaryText(analysis) {
  if (!analysis) return '아직 분석 결과가 없습니다. 사진 업로드 후 분석을 진행해 주세요.';
  const pairs = [
    ['홍조', analysis.redness_score],
    ['모공', analysis.pore_score],
    ['다크서클', analysis.dark_circle_score],
    ['트러블', analysis.acne_score],
  ].sort((a, b) => a[1] - b[1]);
  if (pairs[0][1] >= 60) return '전체적으로 양호한 상태입니다. 현재 루틴 유지가 좋습니다.';
  return `${pairs[0][0]}와 ${pairs[1][0]} 점수가 상대적으로 낮습니다. 우선 관리 항목으로 권장합니다.`;
}

function scoreToRisk(score) {
  if (score >= 90) return '우수';
  if (score >= 60) return '관리 유지 권장';
  return '집중 관리 권장';
}

function scoreToStatus(score) {
  if (typeof score !== 'number') return '측정불가';
  if (score >= 90) return '우수';
  if (score >= 60) return '관리 유지 권장';
  return '집중 관리 권장';
}

function riskStyle(risk) {
  if (risk === '집중 관리 권장') return 'bg-rose-100 text-rose-700';
  if (risk === '관리 유지 권장') return 'bg-amber-100 text-amber-700';
  if (risk === '우수') return 'bg-emerald-100 text-emerald-700';
  return 'bg-slate-200 text-slate-700';
}

function skinTypeDescription(type) {
  const map = {
    건성: '수분/유분이 모두 부족해 당김이 쉽게 생길 수 있습니다. 보습과 장벽 케어가 중요합니다.',
    지성: '피지 분비가 활발한 타입입니다. 모공/트러블 관리 중심의 루틴이 유리합니다.',
    복합성: '부위별 특성이 다른 타입입니다. T존/볼 부위를 나눠 관리하는 방식이 효과적입니다.',
    민감성: '자극 반응이 쉽게 나타날 수 있습니다. 저자극 성분과 진정 루틴이 우선입니다.',
    중성: '전반적으로 균형이 좋은 타입입니다. 무리한 액티브보다 유지 관리가 적합합니다.',
  };
  return map[type] || '피부 타입 정보가 제한적이므로 보수적으로 관리 계획을 세우는 것이 좋습니다.';
}

function scoreBand(score) {
  if (typeof score !== 'number') return '측정불가';
  if (score >= 90) return '매우 높음';
  if (score >= 60) return '양호';
  return '개선 필요';
}

function displayCareTitle(section) {
  if (!section || typeof section !== 'object') return '';
  if (section.id === 'home') return '추천 홈케어';
  const title = String(section.title || '').trim();
  if (title === '홈케어') return '추천 홈케어';
  return title;
}

function estimateChange(score, scale = 0.45, min = 8, max = 35) {
  if (typeof score !== 'number') return 12;
  const needed = 100 - score;
  return Math.max(min, Math.min(max, Math.round(needed * scale)));
}

function formatKrwRange(min, max) {
  if (typeof min !== 'number' || typeof max !== 'number') return '가격은 상담 후 확정';
  return `약 ${min.toLocaleString('ko-KR')}원 ~ ${max.toLocaleString('ko-KR')}원 (1회)`;
}


const PROCEDURE_FALLBACK = {
  acne: [
    {
      name: 'LDM 물방울 리프팅',
      target: '트러블성 홍조/피부 진정',
      reason: '자극 부담이 낮아 초기 진정 루틴과 병행하기 쉬움',
      sessions: '주 1회, 3~5회',
      interval: '1주 간격',
      downtime: '거의 없음',
      price_krw_min: 60000,
      price_krw_max: 150000,
      price_note: '지역/병원/패키지 구성에 따라 변동',
    },
    {
      name: '아쿠아필',
      target: '피지·각질·모공 정리',
      reason: '트러블 구간의 각질/피지 정리에 도움',
      sessions: '2~4주 간격, 3회 이상',
      interval: '2~4주 간격',
      downtime: '거의 없음',
      price_krw_min: 50000,
      price_krw_max: 120000,
      price_note: '민감 피부는 강도 조절 필요',
    },
  ],
  darkCircle: [
    {
      name: '눈가 토닝 레이저',
      target: '다크서클 색소/톤 보정',
      reason: '색소형 다크서클 완화에 사용되는 대표 옵션',
      sessions: '2~4주 간격, 5회 내외',
      interval: '2~4주 간격',
      downtime: '1~3일 홍조 가능',
      price_krw_min: 80000,
      price_krw_max: 250000,
      price_note: '기기 종류에 따라 편차 큼',
    },
  ],
  texture: [
    {
      name: '프락셀 계열 레이저',
      target: '피부결/모공',
      reason: '거친 피부결과 모공 개선 목적으로 자주 사용',
      sessions: '4~6주 간격, 3회 이상',
      interval: '4~6주 간격',
      downtime: '2~5일 붉음/각질',
      price_krw_min: 150000,
      price_krw_max: 450000,
      price_note: '부위/강도/마취 여부에 따라 변동',
    },
  ],
};

function buildSimulationMock(analysis, tabId, routine) {
  const apiCare = analysis?.care_plan?.[tabId];
  const apiProcedures = analysis?.procedure_recommendations?.[tabId];
  const procedureRecommendations =
    Array.isArray(apiProcedures) && apiProcedures.length
      ? apiProcedures
      : PROCEDURE_FALLBACK[tabId] || [];
  const careDetails =
    Array.isArray(apiCare?.care_details) && apiCare.care_details.length
      ? apiCare.care_details
      : detailedCareCatalog[tabId] || [];
  const finalRoutine =
    Array.isArray(apiCare?.routine) && apiCare.routine.length ? apiCare.routine : routine;
  const timeline =
    Array.isArray(analysis?.progress_timeline) && analysis.progress_timeline.length
      ? analysis.progress_timeline
      : [
          { phase: '1주', expectation: '피부 진정/유분 밸런스 변화 체감 시작', focus: '자극 최소화 루틴 고정' },
          { phase: '2~4주', expectation: '톤/결 정돈 체감', focus: '성분 사용 주기 유지' },
          { phase: '6주+', expectation: '변화 안정화', focus: '재평가 후 루틴 미세 조정' },
        ];
  const ingredientGuide = analysis?.ingredient_guide || { recommended: [], avoid: [], note: '' };
  if (!analysis) {
    return {
      basis: ['분석 데이터가 없어 기본 시뮬레이션 값을 사용합니다.'],
      changes: ['AI 결과 대기 중'],
      routine: finalRoutine,
      careDetails,
      timeline,
      ingredientGuide,
      procedureRecommendations,
      afterTitle: 'AI 개선 이미지 생성 예정',
      afterDescription: '분석 결과가 준비되면 탭별 개선 버전을 생성합니다.',
    };
  }

  if (tabId === 'acne') {
    return {
      basis: [
        `트러블 : ${analysis.acne_score}/100 (${scoreBand(analysis.acne_score)})`,
        `홍조 : ${analysis.redness_score}/100 (${scoreBand(analysis.redness_score)})`,
      ],
      changes: [
        `트러블 흔적 완화: 약 +${estimateChange(analysis.acne_score)}%`,
        `홍조 완화: 약 +${estimateChange(analysis.redness_score)}%`,
        `피부결 정돈: 약 +${estimateChange(analysis.pore_score, 0.35)}%`,
      ],
      routine: finalRoutine,
      careDetails,
      timeline,
      ingredientGuide,
      procedureRecommendations,
      afterTitle: '트러블 완화 중심 애프터',
      afterDescription: '붉은 부위와 트러블 흔적을 완만하게 정리한 시뮬레이션입니다.',
    };
  }

  if (tabId === 'darkCircle') {
    return {
      basis: [
        `다크서클 : ${analysis.dark_circle_score}/100 (${scoreBand(analysis.dark_circle_score)})`,
        `눈가 주름 : ${analysis.wrinkle_eye ?? '측정불가'}${typeof analysis.wrinkle_eye === 'number' ? '/100' : ''}`,
      ],
      changes: [
        `눈 밑 톤 보정: 약 +${estimateChange(analysis.dark_circle_score)}%`,
        `눈가 선명도 개선: 약 +${estimateChange(analysis.wrinkle_eye, 0.3)}%`,
        '피곤한 인상 완화: 피부 톤 대비 개선',
      ],
      routine: finalRoutine,
      careDetails,
      timeline,
      ingredientGuide,
      procedureRecommendations,
      afterTitle: '눈가 개선 중심 애프터',
      afterDescription: '눈 밑 음영과 피로 인상을 줄이는 방향의  시뮬레이션입니다.',
    };
  }

  return {
    basis: [
      `모공 : ${analysis.pore_score}/100 (${scoreBand(analysis.pore_score)})`,
      `비대칭 : ${analysis.asymmetry_score}/100 (${scoreBand(analysis.asymmetry_score)})`,
    ],
    changes: [
      `피부결 정돈: 약 +${estimateChange(analysis.pore_score)}%`,
      `표면 텍스처 보정: 약 +${estimateChange(analysis.wrinkle_eye, 0.25)}%`,
      `톤 균일감 강화: 약 +${estimateChange(analysis.redness_score, 0.25)}%`,
    ],
    routine: finalRoutine,
    careDetails,
    timeline,
    ingredientGuide,
    procedureRecommendations,
    afterTitle: '피부결 개선 중심 애프터',
    afterDescription: '모공/결/톤의 균일감을 높이는 방향으로 구성한  결과입니다.',
  };
}

function buildProductRecommendationMock(analysis, tabId) {
  const skinType = analysis?.skin_type || '중성';
  const bySkinType = {
    건성: {
      cleanser: '약산성 크림/로션 타입 클렌저',
      serum: '히알루론산 + 판테놀 보습 세럼',
      moisturizer: '세라마이드 고함량 크림',
      sunscreen: '보습형 크림 선크림(SPF50+)',
      avoid: '고함량 알코올, 강한 스크럽',
    },
    지성: {
      cleanser: '젤 타입 저자극 클렌저',
      serum: '나이아신아마이드/징크 밸런싱 세럼',
      moisturizer: '가벼운 젤 타입 보습제',
      sunscreen: '논코메도제닉 플루이드 선크림',
      avoid: '무거운 오일 베이스 제품',
    },
    복합성: {
      cleanser: '약산성 젤-폼 하이브리드 클렌저',
      serum: 'T존 피지 케어 + U존 보습 세럼',
      moisturizer: '구역별 레이어링 가능한 로션/크림',
      sunscreen: '산뜻한 텍스처의 무기자차/혼합자차',
      avoid: '전 부위 동일 강도 각질 케어',
    },
    민감성: {
      cleanser: '향/색소 무첨가 저자극 클렌저',
      serum: '마데카소사이드/판테놀 진정 세럼',
      moisturizer: '장벽강화 성분 중심 보습제',
      sunscreen: '무향 저자극 선크림',
      avoid: '고농도 산(AHA/BHA) 동시 사용',
    },
    중성: {
      cleanser: '밸런스형 약산성 클렌저',
      serum: '가벼운 항산화/보습 세럼',
      moisturizer: '사계절용 밸런스 보습제',
      sunscreen: '데일리 선크림(SPF50+)',
      avoid: '과도한 제품 레이어링',
    },
  };

  const byGoal = {
    acne: {
      booster: '트러블 완화용 진정 패치/스팟 케어',
      tip: '신규 제품은 2~3일 간격으로 하나씩 추가',
    },
    darkCircle: {
      booster: '카페인/비타민C 계열 아이 케어',
      tip: '눈가에는 문지르지 말고 흡수시키기',
    },
    texture: {
      booster: '저농도 각질 케어 토너(주 1~2회)',
      tip: '각질 케어 후에는 보습 루틴 강화를 우선',
    },
  };

  const typePack = bySkinType[skinType] || bySkinType.중성;
  const goalPack = byGoal[tabId] || byGoal.texture;
  const products = [
    {
      category: '클렌저',
      name: typePack.cleanser,
      image:
        'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80',
    },
    {
      category: '세럼/토너',
      name: typePack.serum,
      image:
        'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80',
    },
    {
      category: '보습제',
      name: typePack.moisturizer,
      image:
        'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=900&q=80',
    },
    {
      category: '선케어',
      name: typePack.sunscreen,
      image:
        'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=900&q=80',
    },
  ];

  return {
    skinType,
    products,
    ...typePack,
    ...goalPack,
    note: ' 추천 데이터입니다. 실제 구매 전 성분/알레르기 반응을 확인하세요.',
  };
}

export default function BTestFlowPage() {
  const [step, setStep] = useState(1);
  const [selectedTab, setSelectedTab] = useState('acne');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [precheckLoading, setPrecheckLoading] = useState(false);
  const [precheckPass, setPrecheckPass] = useState(null);
  const [precheckDetail, setPrecheckDetail] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [afterPreviewUrl, setAfterPreviewUrl] = useState('');
  const [afterGenerating, setAfterGenerating] = useState(false);
  const [afterError, setAfterError] = useState('');
  const [error, setError] = useState('');
  const [survey, setSurvey] = useState({
    age_band: '20s',
    gender: 'female',
    skin_type_preference: 'unknown',
    sensitivity_level: 'medium',
  });
  const [credits, setCredits] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const stepOneSectionRef = useRef(null);
  const uploadCardRef = useRef(null);
  const surveyCardRef = useRef(null);
  const dropzoneRef = useRef(null);
  const step3BeforeAfterRef = useRef(null);
  const step3SimulationRef = useRef(null);
  const step3ProductsRef = useRef(null);
  const profileRequestIdRef = useRef(0);
  const afterRequestIdRef = useRef(0);

  const simulationTabs = useMemo(() => {
    if (!analysis) return SIMULATION_TEMPLATES;
    const priority = Array.isArray(analysis.focus_priority) ? analysis.focus_priority : [];
    const hasPriority = priority.length > 0;
    const avgByTemplate = (template) => {
      const valid = template.metricKeys
        .map((key) => analysis[key])
        .filter((value) => typeof value === 'number');
      if (!valid.length) return 50;
      return valid.reduce((sum, n) => sum + n, 0) / valid.length;
    };
    const priorityRank = new Map(priority.map((id, idx) => [id, idx]));
    return [...SIMULATION_TEMPLATES]
      .sort((a, b) => {
        if (hasPriority) {
          const aRank = priorityRank.has(a.id) ? priorityRank.get(a.id) : Number.MAX_SAFE_INTEGER;
          const bRank = priorityRank.has(b.id) ? priorityRank.get(b.id) : Number.MAX_SAFE_INTEGER;
          if (aRank !== bRank) return aRank - bRank;
        }
        return avgByTemplate(a) - avgByTemplate(b);
      })
      .map((template, index) => ({
        ...template,
        label: index === 0 ? `${template.label} (우선)` : template.label,
      }));
  }, [analysis]);
  const selectedPreview = useMemo(
    () => simulationTabs.find((tab) => tab.id === selectedTab) ?? simulationTabs[0],
    [selectedTab, simulationTabs]
  );
  const simulationMock = useMemo(
    () => buildSimulationMock(analysis, selectedTab, selectedPreview.routine),
    [analysis, selectedTab, selectedPreview.routine]
  );
  const productRecommendation = useMemo(
    () => buildProductRecommendationMock(analysis, selectedTab),
    [analysis, selectedTab]
  );
  const careDetailsForCards = useMemo(
    () => simulationMock.careDetails.filter((section) => section.id !== 'procedure'),
    [simulationMock.careDetails]
  );
  const procedurePriceMemo = useMemo(() => {
    const notes = simulationMock.procedureRecommendations
      .map((item) => String(item.price_note || '').trim())
      .filter(Boolean);
    if (!notes.length) return '가격은 병원/지역/패키지 구성에 따라 달라질 수 있습니다.';
    return Array.from(new Set(notes)).join(' / ');
  }, [simulationMock.procedureRecommendations]);

  const scoreGroups = useMemo(() => {
    if (!analysis) return [];
    const reason = analysis.reason && typeof analysis.reason === 'object' ? analysis.reason : {};
    const evidenceOrFallback = (key, fallback) => {
      const text = typeof reason[key] === 'string' ? reason[key].trim() : '';
      return text || fallback;
    };
    const displayScore = (score) => (typeof score === 'number' ? score : null);
    const skinItems = [
      {
        name: '트러블',
        score: analysis.acne_score,
        evidence: evidenceOrFallback('acne', '근거 데이터가 제한적입니다.'),
      },
      {
        name: '모공',
        score: analysis.pore_score,
        evidence: evidenceOrFallback('pores', '근거 데이터가 제한적입니다.'),
      },
      {
        name: '홍조',
        score: analysis.redness_score,
        evidence: evidenceOrFallback('redness', '근거 데이터가 제한적입니다.'),
      },
    ];
    const featureItems = [
      {
        name: '눈가 주름',
        score: displayScore(analysis.wrinkle_eye),
        evidence:
          typeof analysis.wrinkle_eye === 'number'
            ? evidenceOrFallback('wrinkle_eye', '근거 데이터가 제한적입니다.')
            : '눈가 정보가 부족해 보수적 기준으로 반영했습니다.',
      },
      {
        name: '다크서클',
        score: analysis.dark_circle_score,
        evidence: evidenceOrFallback('dark_circle', '근거 데이터가 제한적입니다.'),
      },
      {
        name: '비대칭',
        score: analysis.asymmetry_score,
        evidence: evidenceOrFallback('symmetry', '근거 데이터가 제한적입니다.'),
      },
    ];
    const avg = (items) => {
      const valid = items.filter((item) => typeof item.score === 'number');
      if (!valid.length) return 0;
      return Math.round(valid.reduce((sum, item) => sum + item.score, 0) / valid.length);
    };
    return [
      {
        key: 'skin',
        title: '피부 점수',
        score: avg(skinItems),
        risk: scoreToRisk(avg(skinItems)),
        description: '피부 컨디션 지표를 종합한 점수입니다.',
        items: skinItems,
      },
      {
        key: 'feature',
        title: '이목구비 점수',
        score: avg(featureItems),
        risk: scoreToRisk(avg(featureItems)),
        description: '눈가/대칭/음영 등 얼굴 인상 지표를 종합한 점수입니다.',
        items: featureItems,
      },
    ];
  }, [analysis]);
  const summaryText = useMemo(() => {
    if (!analysis) return getSummaryText(analysis);
    return analysis.analysis_summary || getSummaryText(analysis);
  }, [analysis]);
  const skinTypeText = useMemo(() => {
    if (!analysis) return '';
    return analysis.skin_type_description || skinTypeDescription(analysis.skin_type);
  }, [analysis]);
  const overallScore = useMemo(() => {
    if (!scoreGroups.length) return null;
    return Math.round(scoreGroups.reduce((sum, group) => sum + group.score, 0) / scoreGroups.length);
  }, [scoreGroups]);
  const mainSummaryMessage = useMemo(() => {
    const isHighScore = typeof overallScore === 'number' && overallScore >= 85;
    if (isHighScore) return { line1: MAIN_SUMMARY_HIGH_LINE1, line2: MAIN_SUMMARY_HIGH_LINE2 };
    return { line1: MAIN_SUMMARY_LOW_LINE1, line2: MAIN_SUMMARY_LOW_LINE2 };
  }, [overallScore]);
  const step2ActionLabel = useMemo(() => {
    const isHighScore = typeof overallScore === 'number' && overallScore >= 85;
    return isHighScore ? '인스타그램에 자랑하러가기' : '개선하러가기';
  }, [overallScore]);
  const quickMetrics = useMemo(() => {
    if (!analysis) return [];
    const reason = analysis.reason && typeof analysis.reason === 'object' ? analysis.reason : {};
    const evidenceOrFallback = (key) => {
      const text = typeof reason[key] === 'string' ? reason[key].trim() : '';
      return text || '근거 데이터가 제한적입니다.';
    };
    return [
      { key: 'acne', label: '트러블', score: analysis.acne_score, evidence: evidenceOrFallback('acne') },
      { key: 'pore', label: '모공', score: analysis.pore_score, evidence: evidenceOrFallback('pores') },
      { key: 'redness', label: '홍조', score: analysis.redness_score, evidence: evidenceOrFallback('redness') },
      { key: 'dark', label: '다크서클', score: analysis.dark_circle_score, evidence: evidenceOrFallback('dark_circle') },
      {
        key: 'wrinkle',
        label: '눈가 주름',
        score: analysis.wrinkle_eye,
        evidence:
          typeof analysis.wrinkle_eye === 'number'
            ? evidenceOrFallback('wrinkle_eye')
            : '눈가 정보가 부족해 보수적 기준으로 반영했습니다.',
      },
      { key: 'asymmetry', label: '비대칭', score: analysis.asymmetry_score, evidence: evidenceOrFallback('symmetry') },
    ];
  }, [analysis]);

  useEffect(() => {
    const storedRaw = localStorage.getItem('btest_credits');
    if (storedRaw === null) {
      // Temporary dev mode: default to paid Business account credits.
      localStorage.setItem('btest_plan', 'business');
      localStorage.setItem('btest_credits', '15');
      setCredits(15);
      return;
    }
    const stored = Number(storedRaw);
    setCredits(Number.isFinite(stored) && stored > 0 ? Math.floor(stored) : 0);
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  useEffect(() => {
    if (!simulationTabs.some((tab) => tab.id === selectedTab) && simulationTabs.length) {
      setSelectedTab(simulationTabs[0].id);
    }
  }, [simulationTabs, selectedTab]);

  useEffect(() => {
    if (analysis && simulationTabs.length) {
      setSelectedTab(simulationTabs[0].id);
    }
  }, [analysis, simulationTabs]);

  useEffect(() => {
    if (step !== 1) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        uploadCardRef.current,
        { opacity: 0, y: 20, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
      );
      if (selectedFile && surveyCardRef.current) {
        gsap.fromTo(
          surveyCardRef.current,
          { opacity: 0, y: 24, x: 8 },
          { opacity: 1, y: 0, x: 0, duration: 0.55, ease: 'power3.out', delay: 0.08 }
        );
      }
    }, stepOneSectionRef);
    return () => ctx.revert();
  }, [step, selectedFile]);

  useEffect(() => {
    if (!previewUrl || !uploadCardRef.current) return;
    const imageNode = uploadCardRef.current.querySelector('img[alt="업로드 이미지"]');
    if (!imageNode) return;
    gsap.fromTo(
      imageNode,
      { opacity: 0, scale: 1.03, filter: 'blur(2px)' },
      { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.45, ease: 'power2.out' }
    );
  }, [previewUrl]);

  useEffect(() => {
    if (!dropzoneRef.current) return;
    gsap.to(dropzoneRef.current, {
      scale: isDragOver ? 1.015 : 1,
      boxShadow: isDragOver ? '0 18px 36px rgba(249,115,22,0.16)' : '0 0 0 rgba(0,0,0,0)',
      duration: 0.2,
      ease: 'power2.out',
    });
  }, [isDragOver]);

  useEffect(() => {
    if (step !== 3) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        [step3BeforeAfterRef.current, step3SimulationRef.current],
        { opacity: 0, y: 24, scale: 0.985 },
        { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'power3.out', stagger: 0.08 }
      );
      gsap.fromTo(
        step3ProductsRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.2, ease: 'power3.out' }
      );
    });
    return () => ctx.revert();
  }, [step]);

  useEffect(() => {
    if (step !== 3 || !step3SimulationRef.current) return;
    const targets = step3SimulationRef.current.querySelectorAll('[data-tab-animate]');
    if (!targets.length) return;
    gsap.fromTo(
      targets,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' }
    );
  }, [selectedTab, step]);

  useEffect(() => {
    if (step !== 3 || !selectedFile) {
      setAfterPreviewUrl('');
      setAfterGenerating(false);
      setAfterError('');
      return;
    }
    // After image feature paused by product decision.
    setAfterPreviewUrl('');
    setAfterGenerating(false);
    setAfterError('');
  }, [step, selectedFile, selectedTab, analysis]);

  useEffect(() => {
    if (step !== 3 || !step3SimulationRef.current) return;
    const cards = Array.from(step3SimulationRef.current.querySelectorAll('[data-care-card]'));
    if (!cards.length) return;
    const cleanups = cards.map((card) => {
      const enter = () =>
        gsap.to(card, {
          y: -4,
          scale: 1.01,
          boxShadow: '0 12px 24px rgba(15, 23, 42, 0.12)',
          duration: 0.22,
          ease: 'power2.out',
        });
      const leave = () =>
        gsap.to(card, {
          y: 0,
          scale: 1,
          boxShadow: '0 0 0 rgba(15, 23, 42, 0)',
          duration: 0.2,
          ease: 'power2.out',
        });
      card.addEventListener('mouseenter', enter);
      card.addEventListener('mouseleave', leave);
      return () => {
        card.removeEventListener('mouseenter', enter);
        card.removeEventListener('mouseleave', leave);
      };
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [step, selectedTab]);

  async function handleAnalyze() {
    if (!selectedFile) {
      setError('분석할 얼굴 사진을 먼저 업로드해 주세요.');
      return;
    }
    if (precheckLoading) {
      setError('업로드 사진 확인이 진행 중입니다. 잠시만 기다려 주세요.');
      return;
    }
    if (precheckPass !== true) {
      setError(precheckDetail || '실사 정면 얼굴 사진만 업로드할 수 있습니다.');
      return;
    }
    if (profileLoading) {
      setError('사진 기반 설문 자동 설정이 진행 중입니다. 잠시만 기다려 주세요.');
      return;
    }
    if (!OPERATOR_UNLIMITED_MODE && credits < 1) {
      setError('이용권이 부족합니다. 먼저 횟수권을 결제해 주세요.');
      return;
    }
    setAnalyzing(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('survey', JSON.stringify(survey));
      const res = await fetch('/api/skin-analyze', { method: 'POST', body: formData });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        const detail = errJson?.detail || errJson?.error || 'Analyze failed';
        throw new Error(detail);
      }
      const data = await res.json();
      const mapped = mapApiToUi(data);
      if (!OPERATOR_UNLIMITED_MODE) {
        const nextCredits = Math.max(0, credits - 1);
        setCredits(nextCredits);
        localStorage.setItem('btest_credits', String(nextCredits));
      }
      setAnalysis(mapped);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : '분석 중 오류가 발생했습니다.');
    } finally {
      setAnalyzing(false);
    }
  }

  async function applyAutoSurveyFromPhoto(file, requestId) {
    setProfileLoading(true);
    setProfileError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/skin-profile', { method: 'POST', body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const detail = data?.detail || data?.error || 'Profile detection failed';
        throw new Error(detail);
      }
      if (profileRequestIdRef.current !== requestId) return;
      setSurvey((prev) => ({
        ...prev,
        age_band: data?.age_band || prev.age_band,
        gender: data?.gender || prev.gender,
        skin_type_preference: data?.skin_type_preference || prev.skin_type_preference,
        sensitivity_level: data?.sensitivity_level || prev.sensitivity_level,
      }));
    } catch (e) {
      if (profileRequestIdRef.current !== requestId) return;
      setProfileError(e instanceof Error ? e.message : '자동 설정 중 오류가 발생했습니다.');
    } finally {
      if (profileRequestIdRef.current === requestId) {
        setProfileLoading(false);
      }
    }
  }

  async function applyPrecheckFromPhoto(file, requestId) {
    setPrecheckLoading(true);
    setPrecheckPass(null);
    setPrecheckDetail('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/skin-precheck', { method: 'POST', body: formData });
      const data = await res.json().catch(() => null);
      if (profileRequestIdRef.current !== requestId) return;
      if (!res.ok) {
        const detail = data?.detail || data?.error || '사진 확인에 실패했습니다.';
        setPrecheckPass(false);
        setPrecheckDetail(detail);
        setError(detail);
        return;
      }
      const passed = Boolean(data?.pass);
      const detail = data?.detail || (passed ? '업로드 사진이 분석 조건을 통과했습니다.' : '');
      setPrecheckPass(passed);
      setPrecheckDetail(detail);
      if (!passed) {
        setError(detail || '실사 정면 얼굴 사진만 업로드할 수 있습니다.');
      }
    } catch (e) {
      if (profileRequestIdRef.current !== requestId) return;
      const detail = e instanceof Error ? e.message : '사진 확인 중 오류가 발생했습니다.';
      setPrecheckPass(false);
      setPrecheckDetail(detail);
      setError(detail);
    } finally {
      if (profileRequestIdRef.current === requestId) {
        setPrecheckLoading(false);
      }
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragOver(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile && droppedFile.type.startsWith('image/')) {
      handleFileChange(droppedFile);
      return;
    }
    setError('이미지 파일만 업로드할 수 있습니다.');
  }

  function handleFileChange(file) {
    setSelectedFile(file);
    setProfileError('');
    setAfterPreviewUrl('');
    setAfterGenerating(false);
    setAfterError('');
    if (!file) {
      profileRequestIdRef.current += 1;
      afterRequestIdRef.current += 1;
      setProfileLoading(false);
      setPrecheckLoading(false);
      setPrecheckPass(null);
      setPrecheckDetail('');
      return;
    }
    setError('');
    setAnalysis(null);
    setPrecheckPass(null);
    setPrecheckDetail('');
    const requestId = profileRequestIdRef.current + 1;
    profileRequestIdRef.current = requestId;
    applyAutoSurveyFromPhoto(file, requestId);
    applyPrecheckFromPhoto(file, requestId);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-amber-50 text-slate-900">
      {analyzing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-white/75 backdrop-blur-sm">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-lg">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-orange-600" />
            <p className="mt-3 text-sm font-semibold text-slate-800">피부 분석 중입니다...</p>
            <p className="mt-1 text-xs text-slate-500">응답이 도착하면 결과 화면으로 바로 이동합니다.</p>
          </div>
        </div>
      )}
      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        {step === 1 && (
          <section ref={stepOneSectionRef} className="space-y-6">
            {!selectedFile ? (
              <div ref={uploadCardRef} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-stretch">
                  <div>
                    <h2 className="text-2xl font-bold">1) 사진 업로드</h2>
                    <p className="mt-2 text-slate-600">정면 얼굴 사진 1장을 업로드해 주세요.</p>
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-extrabold text-amber-900">사진 가이드라인</p>
                      <ul className="mt-2 space-y-1 text-xs text-amber-900/90">
                        <li>- 얼굴 전체(이마~턱)가 프레임 안에 들어오게 촬영</li>
                        <li>- 정면 응시, 고개 기울임 최소화</li>
                        <li>- 실내/자연광에서 얼굴에 그림자 없이 밝게</li>
                        <li>- 필터/보정/뷰티앱 사용한 사진은 피하기</li>
                        <li>- 마스크, 선글라스, 앞머리 가림은 제외</li>
                      </ul>
                      <div className="mt-3 overflow-hidden rounded-xl border border-dashed border-amber-300 bg-white/70">
                        <div className="grid aspect-[21/7] place-items-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src="/gpt.png"
                            alt="사진 가이드라인 참고 이미지"
                            className="h-full w-full object-contain"
                            style={{ height: '200px' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    ref={dropzoneRef}
                    className={`rounded-2xl border-2 border-dashed bg-slate-50 transition ${
                      isDragOver ? 'border-orange-500 bg-orange-50' : 'border-slate-300'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <label className="grid h-full min-h-[280px] w-full cursor-pointer place-items-center p-4 text-center">
                      <div>
                        <ImagePlus className="mx-auto h-12 w-12 text-slate-500" />
                        <p className="mt-3 text-sm font-semibold text-slate-700">드래그 앤 드롭 또는 클릭</p>
                        <p className="mt-1 text-xs text-slate-500">이미지 업로드 후 자동 검사와 옵션 설정이 시작됩니다.</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                </div>
                {error && <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <div ref={uploadCardRef} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold">1) 사진 업로드</h2>
                  <p className="mt-2 text-slate-600">정면 얼굴 사진 1장을 업로드합니다.</p>
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm font-extrabold text-amber-900">사진 가이드라인</p>
                    <ul className="mt-2 space-y-1 text-xs text-amber-900/90">
                      <li>- 얼굴 전체(이마~턱)가 프레임 안에 들어오게 촬영</li>
                      <li>- 정면 응시, 고개 기울임 최소화</li>
                      <li>- 실내/자연광에서 얼굴에 그림자 없이 밝게</li>
                      <li>- 필터/보정/뷰티앱 사용한 사진은 피하기</li>
                      <li>- 마스크, 선글라스, 앞머리 가림은 제외</li>
                    </ul>
                  </div>
                  <div
                    ref={dropzoneRef}
                    className={`mt-5 rounded-2xl border-2 border-dashed bg-slate-50 transition ${
                      isDragOver ? 'border-orange-500 bg-orange-50' : 'border-slate-300'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <label className="relative grid aspect-[4/3] w-full cursor-pointer place-items-center overflow-hidden">
                      <div className="grid h-full w-full place-items-center bg-slate-100 p-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt="업로드 이미지"
                          className="max-h-full max-w-full h-auto w-auto object-contain"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-black/45 px-3 py-2 text-xs font-semibold text-white">
                        새 사진을 드래그 앤 드롭하거나 클릭해 교체
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">선택 파일: {selectedFile.name}</p>
                  <p
                    className={`mt-1 text-xs font-semibold ${
                      precheckLoading
                        ? 'text-amber-700'
                        : precheckPass
                          ? 'text-emerald-700'
                          : precheckPass === false
                            ? 'text-rose-600'
                            : 'text-slate-500'
                    }`}
                  >
                    {precheckLoading
                      ? '업로드 사진 적합성 확인 중...'
                      : precheckPass
                        ? precheckDetail || '사진 검증 통과'
                        : precheckPass === false
                          ? precheckDetail || '실사 정면 얼굴 사진만 업로드할 수 있습니다.'
                          : '사진 확인 대기 중'}
                  </p>
                  <label className="mt-3 inline-flex cursor-pointer items-center rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                    사진 변경
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {error && <p className="mt-2 text-sm font-semibold text-rose-600">{error}</p>}
                </div>

                <div ref={surveyCardRef} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-bold">옵션 설문</h2>
                  <p className="mt-2 text-slate-600">사진 기반 자동 설정 후, 직접 수정할 수 있습니다.</p>
                  <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-medium text-orange-900">
                    {profileLoading
                      ? '사진을 분석해 나이대/성별/피부타입/민감도를 자동으로 설정하는 중입니다...'
                      : '자동 설정 완료. 필요하면 값을 직접 수정해 주세요.'}
                  </div>
                  <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                    {precheckLoading
                      ? '사진 적합성 확인 중입니다.'
                      : precheckPass
                        ? '사진 적합성 확인 완료: 분석 가능'
                        : precheckPass === false
                          ? '사진 적합성 확인 실패: 다른 사진을 업로드해 주세요.'
                          : '사진 적합성 확인 대기'}
                  </div>
                  {profileError && <p className="mt-2 text-xs font-semibold text-rose-600">{profileError}</p>}
                  <div className="mt-5 space-y-3 text-sm">
                    <label className="block rounded-xl bg-slate-50 p-3">
                      <span className="mb-2 block text-xs font-semibold text-slate-600">나이대</span>
                      <select
                        value={survey.age_band}
                        onChange={(e) => setSurvey((prev) => ({ ...prev, age_band: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
                      >
                        <option value="10s">10대</option>
                        <option value="20s">20대</option>
                        <option value="30s">30대</option>
                        <option value="40s">40대</option>
                        <option value="50s">50대</option>
                      </select>
                    </label>
                    <label className="block rounded-xl bg-slate-50 p-3">
                      <span className="mb-2 block text-xs font-semibold text-slate-600">성별</span>
                      <select
                        value={survey.gender}
                        onChange={(e) => setSurvey((prev) => ({ ...prev, gender: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
                      >
                        <option value="female">여성</option>
                        <option value="male">남성</option>
                      </select>
                    </label>
                    <label className="block rounded-xl bg-slate-50 p-3">
                      <span className="mb-2 block text-xs font-semibold text-slate-600">피부타입</span>
                      <select
                        value={survey.skin_type_preference}
                        onChange={(e) =>
                          setSurvey((prev) => ({ ...prev, skin_type_preference: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
                      >
                        <option value="dry">건성</option>
                        <option value="oily">지성</option>
                        <option value="combination">복합</option>
                        <option value="unknown">모름</option>
                      </select>
                    </label>
                    <label className="block rounded-xl bg-slate-50 p-3">
                      <span className="mb-2 block text-xs font-semibold text-slate-600">민감도</span>
                      <select
                        value={survey.sensitivity_level}
                        onChange={(e) =>
                          setSurvey((prev) => ({ ...prev, sensitivity_level: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500"
                      >
                        <option value="low">낮음</option>
                        <option value="medium">보통</option>
                        <option value="high">높음</option>
                      </select>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={analyzing || profileLoading || precheckLoading || precheckPass !== true}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        분석 중...
                      </>
                    ) : (
                      <>
                        분석 결과 보기
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {step === 2 && (
          <section className="space-y-6">
            {analysis ? (
              <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
                <div className="space-y-3 lg:sticky lg:top-24 lg:h-fit">
                  <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                    <p className="mb-2 text-sm text-slate-500">업로드 사진</p>
                    <div className="grid aspect-[3/4] place-items-center overflow-hidden rounded-xl bg-slate-100">
                      {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewUrl} alt="업로드 사진" className="h-full w-full object-cover" />
                      ) : (
                        <UserRound className="h-10 w-10 text-slate-400" />
                      )}
                    </div>
                  </article>
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-sm font-bold text-white hover:bg-orange-700"
                    >
                      {step2ActionLabel}
                      <Sparkles className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
                        <CheckCircle2 className="h-4 w-4" />
                        핵심 진단 요약
                      </p>
                      <div className="relative">
                        <button
                          type="button"
                          className="group grid h-8 w-8 place-items-center rounded-full border-2 border-orange-400 bg-orange-50 text-sm font-extrabold text-orange-700 shadow-sm hover:bg-orange-100"
                          aria-label="점수 해석 기준"
                        >
                          !
                          <div className="pointer-events-none absolute right-0 top-10 hidden w-72 rounded-xl border-2 border-orange-300 bg-gradient-to-br from-orange-50 to-amber-50 p-3 text-left text-xs font-semibold text-slate-700 shadow-xl group-hover:block group-focus-visible:block group-active:block">
                            <p className="text-[11px] font-extrabold uppercase tracking-wide text-orange-700">점수 해석 기준</p>
                            <p className="mt-1">0~59: 개선 필요</p>
                            <p>60~89: 양호</p>
                            <p>90~100: 매우 높음</p>
                          </div>
                        </button>
                      </div>
                    </div>
                    <h2 className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xl font-bold text-emerald-700">
                      {mainSummaryMessage.line1}
                      <br />
                      {mainSummaryMessage.line2}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">분석 요약: {summaryText}</p>
                    {typeof overallScore === 'number' && (
                      <p className="mt-1 text-xs text-slate-500">종합 점수: {overallScore}/100</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      피부 타입: {analysis.skin_type} / {skinTypeText}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-slate-700">핵심 지표 한눈에 보기</p>
                    <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
                      {quickMetrics.map((metric) => (
                        <div key={metric.key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-semibold text-slate-500">{metric.label}</p>
                          <p className="mt-1 text-lg font-bold text-slate-900">
                            {typeof metric.score === 'number' ? `${metric.score}/100` : '측정불가'}
                          </p>
                          <span
                            className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              riskStyle(scoreToStatus(metric.score))
                            }`}
                          >
                            {scoreToStatus(metric.score)}
                          </span>
                          <p className="mt-2 text-[11px] leading-4 text-slate-500">{metric.evidence}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {scoreGroups.map((group) => (
                    <article key={group.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex w-full items-start justify-between gap-3 text-left">
                        <div>
                          <p className="text-sm text-slate-500">{group.title}</p>
                          <p className="mt-1 text-2xl font-bold text-slate-900">{group.score}/100</p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${riskStyle(group.risk)}`}>
                          {group.risk}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{group.description}</p>
                      <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-3">
                        {group.items.map((item) => (
                          <div key={item.name}>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-slate-800">
                                {item.name}: {typeof item.score === 'number' ? `${item.score}/100` : '측정불가'}
                              </p>
                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                {scoreToStatus(item.score)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">{item.evidence}</p>
                          </div>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                분석 데이터가 없습니다. Step 1에서 사진 업로드 후 분석을 진행해 주세요.
              </div>
            )}
          </section>
        )}

        {step === 3 && (
          <>
            <section className="grid gap-6 lg:grid-cols-2">
            <div ref={step3BeforeAfterRef} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold">Before / After</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  <p className="border-b border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                    비포 (원본 사진)
                  </p>
                  <div className="grid aspect-[3/4] place-items-center overflow-hidden bg-slate-100">
                    {previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt="비포 원본"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound className="h-10 w-10 text-slate-400" />
                    )}
                  </div>
                </div>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  <p className="border-b border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                    애프터 (AI 개선 이미지)
                  </p>
                  <div className="relative grid aspect-[3/4] place-items-center overflow-hidden bg-slate-100">
                    <p className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                      준비중입니다
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div ref={step3SimulationRef} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mt-4 flex flex-wrap gap-2">
                {simulationTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedTab(tab.id)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      selectedTab === tab.id
                        ? 'bg-slate-900 text-white'
                        : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div data-tab-animate className="mt-4 rounded-2xl bg-slate-50 p-4">
                <h3 className="font-bold text-slate-900">추천 케어/루틴</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {simulationMock.routine.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
                <div className="mt-3 space-y-2">
                  {careDetailsForCards.map((section) => (
                    <article
                      key={section.id}
                      data-care-card
                      className="rounded-xl border border-slate-200 bg-white p-3 transition-transform"
                    >
                      <div className="grid gap-3 md:grid-cols-[220px_1fr] md:items-start">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{displayCareTitle(section)}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{section.summary}</p>
                          <p className="mt-2 text-xs font-semibold text-slate-700">{section.period}</p>
                          <p className="mt-1 text-xs font-semibold text-emerald-700">{section.expected}</p>
                        </div>
                        <ul className="space-y-1 text-xs text-slate-700">
                          {section.details.map((detail) => (
                            <li key={detail}>- {detail}</li>
                          ))}
                        </ul>
                      </div>
                      {Array.isArray(section.focus_ingredients) && section.focus_ingredients.length > 0 ? (
                        <p className="mt-2 text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">권장 성분:</span>{' '}
                          {section.focus_ingredients.join(', ')}
                        </p>
                      ) : null}
                      {Array.isArray(section.avoid_ingredients) && section.avoid_ingredients.length > 0 ? (
                        <p className="mt-1 text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">피해야 할 성분:</span>{' '}
                          {section.avoid_ingredients.join(', ')}
                        </p>
                      ) : null}
                      {section.lifestyle_tip ? (
                        <p className="mt-1 text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-700">생활 팁:</span> {section.lifestyle_tip}
                        </p>
                      ) : null}
                      {Array.isArray(section.video_links) && section.video_links.length > 0 ? (
                        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                          <p className="text-[11px] font-semibold text-slate-700">참고 동영상</p>
                          <ul className="mt-1 space-y-1">
                            {section.video_links.map((video) => (
                              <li key={`${video.title}-${video.url}`} className="text-[11px] text-slate-600">
                                <a
                                  href={video.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
                                >
                                  {video.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <h4 className="text-sm font-bold text-amber-900">추천 시술 정보 + 가격</h4>
                  <p className="mt-1 text-xs text-amber-800">
                    분석 이미지 기반 참고 정보이며, 실제 시술 적합성/가격은 의료진 상담에서 최종 확정됩니다.
                  </p>
                  <div className="mt-3 space-y-2">
                    {simulationMock.procedureRecommendations.map((item, index) => (
                      <article key={`${item.name}-${index}`} className="rounded-xl border border-amber-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-600">추천 이유: {item.target}</p>
                          </div>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                            {formatKrwRange(item.price_krw_min, item.price_krw_max)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          횟수/주기: {item.sessions || '-'} / {item.interval || '-'}
                        </p>
                        <p className="mt-1 text-xs text-slate-600">다운타임: {item.downtime || '-'}</p>
                      </article>
                    ))}
                  </div>
                  <p className="mt-3 text-left text-[11px] text-slate-500">가격 메모: {procedurePriceMemo}</p>
                </div>
              </div>

            </div>
            </section>
            <section ref={step3ProductsRef} className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900">피부 맞춤 케어 & 화장품 추천</h3>
              <p className="mt-1 text-xs text-slate-500">기준 타입: {productRecommendation.skinType}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {productRecommendation.products.map((product) => (
                  <article key={product.category} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <div className="h-36 w-full overflow-hidden bg-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={product.image} alt={`${product.category} 추천 이미지`} className="h-full w-full object-cover" />
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-slate-500">{product.category}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{product.name}</p>
                    </div>
                  </article>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                <p><span className="font-semibold">집중 케어:</span> {productRecommendation.booster}</p>
                <p className="mt-1"><span className="font-semibold">주의 성분/사용:</span> {productRecommendation.avoid}</p>
                <p className="mt-1"><span className="font-semibold">사용 팁:</span> {productRecommendation.tip}</p>
              </div>
              <p className="mt-3 text-xs font-medium text-amber-700">{productRecommendation.note}</p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
