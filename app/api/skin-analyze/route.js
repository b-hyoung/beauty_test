import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_VISION_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4.1-mini';
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

function clampScore(value, fallback = 50) {
  if (value === null || value === undefined) return fallback;
  const n = Number(value);
  if (Number.isNaN(n)) return fallback;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}

function normalizeSkinType(value) {
  const text = String(value || '').trim();
  if (!text) return '중성';
  const map = {
    dry: '건성',
    oily: '지성',
    combination: '복합성',
    sensitive: '민감성',
    normal: '중성',
    건성: '건성',
    지성: '지성',
    복합성: '복합성',
    민감성: '민감성',
    중성: '중성',
  };
  return map[text.toLowerCase()] || map[text] || '중성';
}

function safeParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function findJsonBlock(text) {
  if (!text) return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return safeParseJson(text.slice(start, end + 1));
}

function sanitizeCareSection(section, fallbackId) {
  const details = Array.isArray(section?.details)
    ? section.details.map((d) => String(d)).filter(Boolean).slice(0, 6)
    : [];
  const focusIngredients = Array.isArray(section?.focus_ingredients)
    ? section.focus_ingredients.map((item) => String(item)).filter(Boolean).slice(0, 4)
    : [];
  const avoidIngredients = Array.isArray(section?.avoid_ingredients)
    ? section.avoid_ingredients.map((item) => String(item)).filter(Boolean).slice(0, 4)
    : [];
  const videoLinks = Array.isArray(section?.video_links)
    ? section.video_links
        .map((item) => ({
          title: String(item?.title || '').trim(),
          url: String(item?.url || '').trim(),
        }))
        .filter((item) => item.title && /^https?:\/\//.test(item.url))
        .slice(0, 3)
    : [];
  return {
    id: String(section?.id || fallbackId),
    title: String(section?.title || ''),
    summary: String(section?.summary || ''),
    period: String(section?.period || ''),
    expected: String(section?.expected || ''),
    lifestyle_tip: String(section?.lifestyle_tip || '').trim(),
    focus_ingredients: focusIngredients,
    avoid_ingredients: avoidIngredients,
    video_links: videoLinks,
    details,
  };
}

function sanitizeCareEntry(entry) {
  return {
    routine: Array.isArray(entry?.routine)
      ? entry.routine.map((r) => String(r)).filter(Boolean).slice(0, 6)
      : [],
    care_details: Array.isArray(entry?.care_details)
      ? entry.care_details
          .map((section, idx) => sanitizeCareSection(section, `section_${idx + 1}`))
          .filter((section) => section.title)
      : [],
  };
}

function sanitizeProcedureItem(item) {
  const min = Number(item?.price_krw_min);
  const max = Number(item?.price_krw_max);
  return {
    name: String(item?.name || '').trim(),
    target: String(item?.target || '').trim(),
    reason: String(item?.reason || '').trim(),
    sessions: String(item?.sessions || '').trim(),
    interval: String(item?.interval || '').trim(),
    downtime: String(item?.downtime || '').trim(),
    price_krw_min: Number.isFinite(min) && min > 0 ? Math.round(min) : null,
    price_krw_max: Number.isFinite(max) && max > 0 ? Math.round(max) : null,
    price_note: String(item?.price_note || '').trim(),
  };
}

function sanitizeProcedurePack(pack) {
  return Array.isArray(pack)
    ? pack
        .map((item) => sanitizeProcedureItem(item))
        .filter((item) => item.name && item.target)
        .slice(0, 4)
    : [];
}

function sanitizeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function sanitizeFocusPriority(value) {
  const allowed = new Set(['acne', 'darkCircle', 'texture']);
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value
    .map((item) => String(item || '').trim())
    .filter((item) => allowed.has(item) && !seen.has(item) && seen.add(item))
    .slice(0, 3);
}

function sanitizeTimeline(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      phase: String(item?.phase || '').trim(),
      expectation: String(item?.expectation || '').trim(),
      focus: String(item?.focus || '').trim(),
    }))
    .filter((item) => item.phase && item.expectation)
    .slice(0, 4);
}

function sanitizeIngredientGuide(value) {
  const data = value && typeof value === 'object' ? value : {};
  const recommended = Array.isArray(data.recommended)
    ? data.recommended.map((item) => String(item)).filter(Boolean).slice(0, 5)
    : [];
  const avoid = Array.isArray(data.avoid)
    ? data.avoid.map((item) => String(item)).filter(Boolean).slice(0, 5)
    : [];
  const note = String(data.note || '').trim();
  return { recommended, avoid, note };
}

function normalizeSurveyInput(rawSurvey) {
  const survey = rawSurvey && typeof rawSurvey === 'object' ? rawSurvey : {};
  const ageBands = new Set(['10s', '20s', '30s', '40s', '50s']);
  const genders = new Set(['female', 'male']);
  const skinTypes = new Set(['dry', 'oily', 'combination', 'unknown']);
  const sensitivityLevels = new Set(['low', 'medium', 'high']);

  const ageBand = String(survey.age_band || '20s');
  const gender = String(survey.gender || 'female');
  const skinTypePreference = String(survey.skin_type_preference || 'unknown');
  const sensitivityLevel = String(survey.sensitivity_level || 'medium');

  return {
    age_band: ageBands.has(ageBand) ? ageBand : '20s',
    gender: genders.has(gender) ? gender : 'female',
    skin_type_preference: skinTypes.has(skinTypePreference) ? skinTypePreference : 'unknown',
    sensitivity_level: sensitivityLevels.has(sensitivityLevel) ? sensitivityLevel : 'medium',
    sensitive_skin: Boolean(survey.sensitive_skin),
    recent_trouble_increase: Boolean(survey.recent_trouble_increase),
    irregular_sleep: Boolean(survey.irregular_sleep),
  };
}

export async function POST(req) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'server_misconfigured', detail: 'OPENAI_API_KEY is missing' },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get('image');
  const surveyRaw = formData.get('survey');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'image is required' }, { status: 400 });
  }
  const parsedSurvey =
    typeof surveyRaw === 'string' ? normalizeSurveyInput(safeParseJson(surveyRaw)) : normalizeSurveyInput(null);

  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || 'image/jpeg';
  const imageDataUrl = `data:${mimeType};base64,${bytes.toString('base64')}`;

  const schemaGuide = {
    acne_score: '0~100, 높을수록 양호',
    pore_score: '0~100, 높을수록 양호',
    redness_score: '0~100, 높을수록 양호',
    dark_circle_score: '0~100, 높을수록 양호',
    wrinkle_eye_score: '0~100 또는 null, 높을수록 양호',
    symmetry_score: '0~100, 높을수록 양호',
    skin_type: '건성/지성/복합성/민감성/중성 중 하나',
    skin_type_description: '피부 타입 해석 설명(1~2문장)',
    analysis_summary: '분석 요약 한 줄',
    focus_priority: ['acne|darkCircle|texture (우선순위 순서)'],
    progress_timeline: [
      {
        phase: '1주',
        expectation: '예상 체감 변화',
        focus: '집중 포인트',
      },
    ],
    ingredient_guide: {
      recommended: ['권장 성분1', '권장 성분2'],
      avoid: ['주의 성분1'],
      note: '성분 사용 메모',
    },
    confidence: '0~100',
    reason: {
      acne: '문자열 근거',
      pores: '문자열 근거',
      redness: '문자열 근거',
      dark_circle: '문자열 근거',
      wrinkle_eye: '문자열 근거',
      symmetry: '문자열 근거',
    },
    care_plan: {
      acne: {
        routine: ['문자열'],
        care_details: [
          {
            id: 'home|massage|procedure',
            title: '홈케어|마사지|시술',
            summary: '한 줄 요약',
            period: '예상 기간',
            expected: '기대 개선',
            details: ['세부 항목 문자열'],
          },
        ],
      },
      darkCircle: 'acne와 동일 구조',
      texture: 'acne와 동일 구조',
    },
    procedure_recommendations: {
      acne: [
        {
          name: '시술명',
          target: '개선 타겟',
          reason: '추천 근거',
          sessions: '권장 횟수 예: 3~5회',
          interval: '권장 주기 예: 2~4주 간격',
          downtime: '다운타임 예: 거의 없음/1~3일',
          price_krw_min: 50000,
          price_krw_max: 250000,
          price_note: '대략적 1회 비용(지역/병원별 상이)',
        },
      ],
      darkCircle: 'acne와 동일 구조',
      texture: 'acne와 동일 구조',
    },
  };

  const completion = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_VISION_MODEL,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You are a conservative facial-skin scoring assistant.',
            'Return ONLY strict valid JSON. No markdown, no extra text.',
            'All scores are integers 0-100 where HIGHER means BETTER.',
            '0=very poor, 50=average/uncertain, 100=excellent.',
            'Avoid extreme values (0/100) unless very clear evidence.',
            'If evidence is weak, prefer 45-65.',
            'If a feature is hard to see, still provide a conservative estimate near 45-55.',
            'For care_plan.care_details with id=home, include focus_ingredients, avoid_ingredients, and lifestyle_tip.',
            'Also provide progress_timeline and ingredient_guide in Korean.',
            'For procedure_recommendations, provide realistic Korean-clinic style options and KRW price ranges per session.',
            'Prices must be approximate and conservative; include uncertainty in price_note.',
          ].join(' '),
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                `아래 스키마로 얼굴 사진을 분석해 JSON으로 반환하세요.\n${JSON.stringify(schemaGuide, null, 2)}\n` +
                `참고 설문 정보: ${JSON.stringify(parsedSurvey)}\n` +
                '주의: 의료 진단이 아니라 이미지 기반 추정치이며, 피부점수/이목구비점수 UI에서 사용할 값입니다. 설문 정보는 점수 해석/루틴 추천에만 보조적으로 반영하세요.',
            },
            {
              type: 'image_url',
              image_url: { url: imageDataUrl },
            },
          ],
        },
      ],
    }),
    cache: 'no-store',
  });

  if (!completion.ok) {
    const detail = await completion.text();
    return NextResponse.json({ error: 'openai_error', detail }, { status: completion.status });
  }

  const completionJson = await completion.json();
  const content = completionJson?.choices?.[0]?.message?.content || '';
  const parsed = safeParseJson(content) || findJsonBlock(content);

  if (!parsed) {
    return NextResponse.json(
      {
        error: 'invalid_model_output',
        detail: 'Model output was not valid JSON',
        raw: completionJson,
      },
      { status: 502 }
    );
  }

  const mapped = {
    acne_score: clampScore(parsed.acne_score, 50),
    pore_score: clampScore(parsed.pore_score, 50),
    redness_score: clampScore(parsed.redness_score, 50),
    dark_circle_score: clampScore(parsed.dark_circle_score, 50),
    wrinkle_eye_score: clampScore(parsed.wrinkle_eye_score ?? parsed.wrinkle_eye, 50),
    symmetry_score: clampScore(parsed.symmetry_score, 50),
    skin_type: normalizeSkinType(parsed.skin_type),
    skin_type_description: sanitizeText(parsed.skin_type_description),
    analysis_summary: sanitizeText(parsed.analysis_summary),
    focus_priority: sanitizeFocusPriority(parsed.focus_priority),
    progress_timeline: sanitizeTimeline(parsed.progress_timeline),
    ingredient_guide: sanitizeIngredientGuide(parsed.ingredient_guide),
    confidence: clampScore(parsed.confidence, 60),
    reason: parsed.reason && typeof parsed.reason === 'object' ? parsed.reason : {},
    care_plan: {
      acne: sanitizeCareEntry(parsed?.care_plan?.acne),
      darkCircle: sanitizeCareEntry(parsed?.care_plan?.darkCircle),
      texture: sanitizeCareEntry(parsed?.care_plan?.texture),
    },
    procedure_recommendations: {
      acne: sanitizeProcedurePack(parsed?.procedure_recommendations?.acne),
      darkCircle: sanitizeProcedurePack(parsed?.procedure_recommendations?.darkCircle),
      texture: sanitizeProcedurePack(parsed?.procedure_recommendations?.texture),
    },
    regions: [],
  };

  return NextResponse.json(mapped);
}
