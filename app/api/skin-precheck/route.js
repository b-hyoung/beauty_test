import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_VISION_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4.1-mini';
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';

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

function buildRejectMessage(data) {
  const reasons = [];
  if (!data?.is_real_human_photo || data?.looks_like_anime_or_character) {
    reasons.push('실제 인물 사진이 아닙니다 (애니/캐릭터/일러스트 불가)');
  }
  if ((data?.face_count ?? 0) !== 1) {
    reasons.push('얼굴이 정확히 1명만 보여야 합니다');
  }
  if (!data?.frontal_face) {
    reasons.push('정면 얼굴 사진이 필요합니다');
  }
  if (data?.occlusion_level === 'high') {
    reasons.push('얼굴 가림이 심합니다 (마스크/손/머리카락/소품)');
  }
  if (data?.blur_level === 'high') {
    reasons.push('사진이 흐릿합니다');
  }
  if (data?.lighting_quality === 'low') {
    reasons.push('조명이 어둡거나 그림자가 심합니다');
  }
  if (!reasons.length) {
    return '업로드 조건을 충족하지 못했습니다. 정면 실사 얼굴 사진으로 다시 시도해 주세요.';
  }
  return `업로드 조건 미충족: ${reasons.join(', ')}`;
}

export async function POST(req) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'server_misconfigured', detail: '서버 설정 오류: OPENAI_API_KEY가 없습니다.' },
      { status: 500 }
    );
  }

  const formData = await req.formData();
  const file = formData.get('image');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'image_required', detail: '이미지 파일이 필요합니다.' }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || 'image/jpeg';
  const imageDataUrl = `data:${mimeType};base64,${bytes.toString('base64')}`;

  const completion = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_VISION_MODEL,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a strict image precheck validator for face analysis. Return JSON only.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                '아래 스키마로 판정해 주세요. 얼굴 분석용 사진이 아니면 pass=false 입니다.\n' +
                JSON.stringify(
                  {
                    pass: 'boolean',
                    is_real_human_photo: 'boolean',
                    looks_like_anime_or_character: 'boolean',
                    face_count: 'number',
                    frontal_face: 'boolean',
                    occlusion_level: 'low|medium|high',
                    blur_level: 'low|medium|high',
                    lighting_quality: 'low|medium|high',
                    issues: ['string'],
                  },
                  null,
                  2
                ) +
                '\n규칙: 애니/캐릭터/일러스트/실사가 아니면 반드시 pass=false.',
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
    const rawDetail = await completion.text();
    return NextResponse.json(
      {
        error: 'openai_error',
        detail: '사진 판별 중 일시적 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        raw_detail: rawDetail,
      },
      { status: completion.status }
    );
  }

  const completionJson = await completion.json();
  const content = completionJson?.choices?.[0]?.message?.content || '';
  const parsed = safeParseJson(content) || findJsonBlock(content);

  if (!parsed) {
    return NextResponse.json(
      {
        pass: false,
        error: 'invalid_model_output',
        detail: '사진 판별 결과를 처리하지 못했습니다. 다른 사진으로 다시 시도해 주세요.',
      },
      { status: 502 }
    );
  }

  const normalized = {
    pass: Boolean(parsed.pass),
    is_real_human_photo: Boolean(parsed.is_real_human_photo),
    looks_like_anime_or_character: Boolean(parsed.looks_like_anime_or_character),
    face_count: Number.isFinite(Number(parsed.face_count)) ? Number(parsed.face_count) : 0,
    frontal_face: Boolean(parsed.frontal_face),
    occlusion_level: parsed.occlusion_level || 'medium',
    blur_level: parsed.blur_level || 'medium',
    lighting_quality: parsed.lighting_quality || 'medium',
    issues: Array.isArray(parsed.issues) ? parsed.issues : [],
  };

  const failByRule =
    !normalized.is_real_human_photo ||
    normalized.looks_like_anime_or_character ||
    normalized.face_count !== 1 ||
    !normalized.frontal_face ||
    normalized.occlusion_level === 'high' ||
    normalized.blur_level === 'high' ||
    normalized.lighting_quality === 'low';

  const finalPass = normalized.pass && !failByRule;
  const detailMessage = finalPass ? '사진 검증 통과' : buildRejectMessage(normalized);

  return NextResponse.json({
    ...normalized,
    pass: finalPass,
    detail: detailMessage,
  });
}
