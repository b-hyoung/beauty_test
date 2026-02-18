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

function normalizeProfile(data) {
  const ageBands = new Set(['10s', '20s', '30s', '40s', '50s']);
  const genders = new Set(['female', 'male']);
  const skinTypes = new Set(['dry', 'oily', 'combination', 'unknown']);
  const sensitivityLevels = new Set(['low', 'medium', 'high']);

  const ageBand = String(data?.age_band || '20s');
  const gender = String(data?.gender || 'female');
  const skinTypePreference = String(data?.skin_type_preference || 'unknown');
  const sensitivityLevel = String(data?.sensitivity_level || 'medium');

  return {
    age_band: ageBands.has(ageBand) ? ageBand : '20s',
    gender: genders.has(gender) ? gender : 'female',
    skin_type_preference: skinTypes.has(skinTypePreference) ? skinTypePreference : 'unknown',
    sensitivity_level: sensitivityLevels.has(sensitivityLevel) ? sensitivityLevel : 'medium',
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
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'image is required' }, { status: 400 });
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
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You estimate optional profile fields from one face photo.',
            'Return strict JSON only.',
            'Use conservative guesses and avoid overconfident assumptions.',
          ].join(' '),
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                '아래 JSON 스키마로만 응답해 주세요.\n' +
                JSON.stringify(
                  {
                    age_band: '10s|20s|30s|40s|50s',
                    gender: 'female|male',
                    skin_type_preference: 'dry|oily|combination|unknown',
                    sensitivity_level: 'low|medium|high',
                  },
                  null,
                  2
                ) +
                '\n확신이 낮으면 skin_type_preference는 unknown, sensitivity_level은 medium을 우선 사용하세요.',
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
      { error: 'invalid_model_output', detail: 'profile output parse failed' },
      { status: 502 }
    );
  }

  return NextResponse.json(normalizeProfile(parsed));
}
