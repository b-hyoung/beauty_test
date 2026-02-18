import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'dall-e-2';
const OPENAI_VISION_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4.1-mini';

function buildPrompt(tab, summary, reason, eyeState) {
  const reasonMap = reason && typeof reason === 'object' ? reason : {};
  const compactReason = {
    acne: String(reasonMap.acne || '').slice(0, 80),
    pores: String(reasonMap.pores || '').slice(0, 80),
    redness: String(reasonMap.redness || '').slice(0, 80),
    dark_circle: String(reasonMap.dark_circle || '').slice(0, 80),
    wrinkle_eye: String(reasonMap.wrinkle_eye || '').slice(0, 80),
    symmetry: String(reasonMap.symmetry || '').slice(0, 80),
  };
  const shortSummary = String(summary || '').slice(0, 160);
  const tabGuide = {
    acne:
      'Clean up acne, red spots, and post-acne marks on skin areas only. Redness must be reduced, never increased.',
    darkCircle:
      'Reduce under-eye darkness naturally while keeping the same person. Do not add any cheek redness.',
    texture:
      'Improve skin texture and reduce visible pore roughness on skin areas only. Keep natural skin tone unchanged.',
  };
  const focus = tabGuide[tab] || tabGuide.texture;
  const eyeInstruction =
    eyeState === 'closed'
      ? 'Eyes must remain closed exactly as in input.'
      : eyeState === 'open'
        ? 'Eyes must remain open exactly as in input.'
        : 'Keep eye openness unchanged from input.';
  const rawPrompt = [
    'Edit this exact same person photo into a cleaner skin AFTER version.',
    'Keep identity unchanged.',
    focus,
    'Keep face shape, expression, eyes, eyebrows, nose, lips, hair, angle, and background unchanged.',
    'Important: if eyes are closed in input, keep eyes closed in output. Do not change eye openness.',
    eyeInstruction,
    'Only improve skin condition; do not alter facial features.',
    'Do not add blush or new redness anywhere on face.',
    'Do not increase red saturation. Skin tone should stay close to input tone.',
    'Any existing redness should decrease, not increase.',
    'Keep white balance and overall color tone consistent with input.',
    'No text, no watermark, no split image, no duplicate face.',
    'Natural detail should remain.',
    `Summary: ${shortSummary}`,
    `Hints: acne=${compactReason.acne}; pores=${compactReason.pores}; redness=${compactReason.redness}; dark=${compactReason.dark_circle};`,
  ].join(' ');

  return rawPrompt.length > 980 ? `${rawPrompt.slice(0, 980)}...` : rawPrompt;
}

async function detectEyeState(imageDataUrl) {
  if (!OPENAI_API_KEY) return 'unknown';
  const res = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
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
          content: 'Return only JSON with one field: eye_state=open|closed|unknown',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Classify whether eyes are open or closed.' },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
    cache: 'no-store',
  });
  if (!res.ok) return 'unknown';
  const json = await res.json().catch(() => null);
  const raw = json?.choices?.[0]?.message?.content || '';
  try {
    const parsed = JSON.parse(raw);
    const eye = String(parsed?.eye_state || '').toLowerCase();
    if (eye === 'open' || eye === 'closed') return eye;
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function buildMaskSvg(tab, size) {
  if (tab === 'darkCircle') {
    return `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="transparent" />
        <ellipse cx="${Math.round(size * 0.36)}" cy="${Math.round(size * 0.46)}" rx="${Math.round(size * 0.12)}" ry="${Math.round(size * 0.07)}" fill="black" />
        <ellipse cx="${Math.round(size * 0.64)}" cy="${Math.round(size * 0.46)}" rx="${Math.round(size * 0.12)}" ry="${Math.round(size * 0.07)}" fill="black" />
      </svg>
    `;
  }
  if (tab === 'acne') {
    return `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="transparent" />
        <ellipse cx="${Math.round(size * 0.5)}" cy="${Math.round(size * 0.25)}" rx="${Math.round(size * 0.28)}" ry="${Math.round(size * 0.16)}" fill="black" />
        <ellipse cx="${Math.round(size * 0.34)}" cy="${Math.round(size * 0.58)}" rx="${Math.round(size * 0.18)}" ry="${Math.round(size * 0.16)}" fill="black" />
        <ellipse cx="${Math.round(size * 0.66)}" cy="${Math.round(size * 0.58)}" rx="${Math.round(size * 0.18)}" ry="${Math.round(size * 0.16)}" fill="black" />
        <ellipse cx="${Math.round(size * 0.5)}" cy="${Math.round(size * 0.78)}" rx="${Math.round(size * 0.17)}" ry="${Math.round(size * 0.12)}" fill="black" />
      </svg>
    `;
  }
  return `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="transparent" />
      <ellipse cx="${Math.round(size * 0.5)}" cy="${Math.round(size * 0.5)}" rx="${Math.round(size * 0.34)}" ry="${Math.round(size * 0.42)}" fill="black" />
    </svg>
  `;
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
  const tab = String(formData.get('tab') || 'texture');
  const summary = String(formData.get('analysis_summary') || '');
  let reason = {};
  try {
    reason = JSON.parse(String(formData.get('reason') || '{}'));
  } catch {
    reason = {};
  }

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'image is required' }, { status: 400 });
  }

  const inputBytes = Buffer.from(await file.arrayBuffer());
  const size = 1024;
  const preparedImage = await sharp(inputBytes)
    .resize(size, size, {
      fit: 'contain',
      position: 'center',
      background: { r: 236, g: 241, b: 245, alpha: 1 },
    })
    .ensureAlpha()
    .png()
    .toBuffer();
  const preparedImageDataUrl = `data:image/png;base64,${preparedImage.toString('base64')}`;
  const eyeState = await detectEyeState(preparedImageDataUrl);

  // Create an edit mask so the model is forced to update face/eye regions.
  const maskSvg = buildMaskSvg(tab, size);
  const preparedMask = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: Buffer.from(maskSvg), blend: 'dest-out' }])
    .png()
    .toBuffer();

  const prompt = buildPrompt(tab, summary, reason, eyeState);
  const callEdits = async (model) => {
    const body = new FormData();
    body.append('model', model);
    body.append('prompt', prompt);
    body.append('size', model === 'dall-e-2' ? '1024x1024' : '1024x1536');
    body.append('response_format', 'b64_json');
    body.append('image', new Blob([preparedImage], { type: 'image/png' }), 'input.png');
    body.append('mask', new Blob([preparedMask], { type: 'image/png' }), 'mask.png');

    const res = await fetch(`${OPENAI_API_BASE}/images/edits`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body,
      cache: 'no-store',
    });

    const text = await res.text();
    const json = (() => {
      try {
        return JSON.parse(text);
      } catch {
        return null;
      }
    })();
    return { ok: res.ok, status: res.status, text, json };
  };

  let response = await callEdits(OPENAI_IMAGE_MODEL);
  if (!response.ok && OPENAI_IMAGE_MODEL !== 'dall-e-2') {
    const invalidModel =
      response.json?.error?.param === 'model' || /Value must be 'dall-e-2'/.test(response.text);
    if (invalidModel) {
      response = await callEdits('dall-e-2');
    }
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: 'openai_image_error', detail: response.text },
      { status: response.status }
    );
  }

  const json = response.json || {};
  const b64 = json?.data?.[0]?.b64_json;
  const url = json?.data?.[0]?.url;

  if (b64) {
    return NextResponse.json({ image_data_url: `data:image/png;base64,${b64}` });
  }
  if (url) {
    return NextResponse.json({ image_url: url });
  }
  return NextResponse.json({ error: 'invalid_image_output' }, { status: 502 });
}
