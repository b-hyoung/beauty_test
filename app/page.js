'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

const highlights = [
  '사진 1장으로 빠른 피부 상태 확인',
  '점수 + 요약 + 개선 우선순위 제공',
  '실행 가능한 루틴 가이드까지 한 번에',
  '피부에 맞는 시술 정보와 예상 가격, 케어 화장품 추천까지 제공',
  '결과는 이메일로 전달, 사진은 저장하지 않고 분석 후 삭제',
];

const benefits = [
  {
    title: '지금 상태를 명확하게',
    detail: '복잡한 설명 대신 핵심 점수와 요약으로 현재 상태를 직관적으로 확인합니다.',
    image:
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: '무엇부터 바꿔야 할지',
    detail: '개선 우선순위를 제시해, 당장 실천할 항목부터 빠르게 정리합니다.',
    image:
      'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    title: '결과를 행동으로 연결',
    detail: '추천 루틴을 통해 확인에서 끝나지 않고 실제 관리로 이어지게 돕습니다.',
    image:
      'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1200&q=80',
  },
];

const steps = [
  { title: '이메일 입력', detail: '간단히 시작 정보만 입력' },
  { title: '사진 업로드', detail: '정면 얼굴 사진 1장 업로드' },
  { title: 'AI 분석', detail: '핵심 점수와 상태 요약 생성' },
  { title: '개선 가이드', detail: '시뮬레이션과 루틴 확인' },
];

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [privacyChecked, setPrivacyChecked] = useState(false);

  function handleStart() {
    const normalized = email.trim().toLowerCase();
    if (!isValidEmail(normalized)) {
      setEmailError('유효한 이메일 주소를 입력해 주세요.');
      return;
    }

    localStorage.setItem('btest_user_email', normalized);
    localStorage.setItem('btest_plan', 'business');
    const existingCredits = Number(localStorage.getItem('btest_credits') || '0');
    if (!Number.isFinite(existingCredits) || existingCredits < 1) {
      localStorage.setItem('btest_credits', '15');
    }
    setEmailError('');
    router.push('/views');
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ecfeff_0%,#f8fafc_40%,#ffffff_100%)] text-slate-900">
      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[1.2fr_0.8fr] md:p-10">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              <Sparkles className="h-4 w-4" />
              AI SKIN INSIGHT
            </p>
            <h1 className="mt-4 text-3xl font-extrabold leading-tight md:text-5xl">
              가장 빠른 피부 솔루션
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-600 md:text-lg">
              사진 한 장으로 현재 피부 상태를 확인하고,<br/>개선 우선순위와 루틴까지 바로 받아보세요.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-slate-700">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-sky-200 bg-gradient-to-r from-sky-50 to-white p-5">
              <p className="text-sm font-extrabold text-sky-800">민감한 개인정보, 이렇게 지킵니다</p>
              <p className="mt-2 text-sm font-semibold text-sky-900/90">
                업로드한 사진은 저장하지 않고 분석 후 삭제됩니다.
              </p>
              <p className="mt-1 text-xs text-sky-900/80">
                결과값과 비포/애프터, 루틴 가이드는 이메일로만 전달됩니다.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-bold text-slate-800">지금 시작하기</p>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                placeholder="이메일 주소를 입력하세요"
                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none ring-emerald-500 placeholder:text-slate-400 focus:ring-2"
              />
              <label className="mt-3 flex items-start gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={privacyChecked}
                  onChange={(e) => setPrivacyChecked(e.target.checked)}
                  className="mt-0.5"
                />
                업로드한 사진은 분석이 끝나면 즉시 삭제되며<br/>별도로 보관되지 않습니다.
              </label>
              <button
                type="button"
                onClick={handleStart}
                disabled={!privacyChecked}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                분석 시작하기
                <ArrowRight className="h-4 w-4" />
              </button>
              {emailError ? <p className="mt-2 text-sm font-semibold text-rose-600">{emailError}</p> : null}
              <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
                <ShieldCheck className="h-4 w-4 text-emerald-700" />
                로그인 없이 빠르게 시작 가능
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {benefits.map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.title} className="aspect-[16/9] h-auto w-full object-cover" />
              </div>
              <h2 className="text-lg font-bold">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h3 className="text-2xl font-bold">이용 흐름</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {steps.map((step, idx) => (
              <article key={step.title} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-extrabold text-emerald-700">STEP {idx + 1}</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{step.title}</p>
                <p className="mt-1 text-xs text-slate-600">{step.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
