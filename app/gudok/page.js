'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

const BUSINESS_PACKAGE_CREDITS = 11;
const BUSINESS_PACKAGE_PRICE_KRW = 5500;
const SINGLE_CREDIT_PRICE_KRW = 1000;

function formatKrw(value) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`;
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    badge: 'Starter',
    priceLabel: '준비중',
    purchaseEnabled: false,
    creditsPerPurchase: 3,
    tone: 'from-slate-100 to-white',
    infoLevel: '운영 비중 낮음',
    details: ['현재 핵심 운영 플랜은 Business입니다.'],
  },
  {
    id: 'business',
    name: 'Business',
    badge: 'Most Popular',
    priceLabel: `${BUSINESS_PACKAGE_CREDITS}회 ${formatKrw(BUSINESS_PACKAGE_PRICE_KRW)}`,
    purchaseEnabled: true,
    creditsPerPurchase: BUSINESS_PACKAGE_CREDITS,
    tone: 'from-emerald-100 to-teal-50',
    infoLevel: '현재 제공 기능 전체 이용',
    details: [
      '사진 업로드 + 자동 사전검사',
      '핵심 지표 점수 + 항목별 근거 제공',
      '우선 개선 항목 Top 3 제시',
      'Before/After 주차별 변화(1/2/4/6/8주)',
      '추천 홈케어 루틴/성분/실행 포인트',
      '추천 시술 정보 + 가격 가이드',
      '결과 설명 문장 확장',
      `패키지 구매: ${BUSINESS_PACKAGE_CREDITS}회 ${formatKrw(BUSINESS_PACKAGE_PRICE_KRW)}`,
      `단일 구매: 1회 ${formatKrw(SINGLE_CREDIT_PRICE_KRW)}`,
      '이메일 기반 간편 시작',
      '사진 저장 없이 분석 후 삭제',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Premium',
    priceLabel: '준비중',
    purchaseEnabled: false,
    creditsPerPurchase: 30,
    tone: 'from-amber-100 to-orange-50',
    infoLevel: '차후 고도화 예정',
    details: ['고도화 리포트/고급 분석 기능은 Pro에서 순차 오픈 예정입니다.'],
  },
];

export default function GudokPage() {
  const [email] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('btest_user_email') || '';
  });
  const [credits, setCredits] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const stored = Number(localStorage.getItem('btest_credits') || '0');
    return Number.isFinite(stored) && stored > 0 ? Math.floor(stored) : 0;
  });
  const [selectedPlan, setSelectedPlan] = useState(() => {
    if (typeof window === 'undefined') return 'business';
    return localStorage.getItem('btest_plan') || 'business';
  });
  const [message, setMessage] = useState('');

  const active = useMemo(() => PLANS.find((p) => p.id === selectedPlan) || PLANS[0], [selectedPlan]);

  function handleSelectPlan(planId) {
    setSelectedPlan(planId);
    localStorage.setItem('btest_plan', planId);
    const plan = PLANS.find((p) => p.id === planId);
    setMessage(`${plan?.name || planId} 플랜 선택 완료`);
  }

  function handlePurchase(mode) {
    if (active.id !== 'business') {
      setMessage('현재 결제는 Business 플랜만 지원합니다.');
      return;
    }
    const purchaseCredits = mode === 'single' ? 1 : BUSINESS_PACKAGE_CREDITS;
    const purchaseAmount = mode === 'single' ? SINGLE_CREDIT_PRICE_KRW : BUSINESS_PACKAGE_PRICE_KRW;
    const nextCredits = credits + purchaseCredits;
    setCredits(nextCredits);
    localStorage.setItem('btest_credits', String(nextCredits));
    setMessage(`${active.name} 결제 완료 (${formatKrw(purchaseAmount)}, ${purchaseCredits}회). 현재 잔여 ${nextCredits}회`);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#f8fafc_0%,#ecfeff_35%,#ffffff_75%)] text-slate-900">
      <section className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Membership</p>
        <h1
          className="mt-2 text-4xl font-bold leading-tight md:text-5xl"
          style={{ fontFamily: 'Garamond, Baskerville, Times New Roman, serif' }}
        >
          Business / Pro
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600">
          플랜이 올라갈수록 결과 설명과 해설이 더 길고 디테일해집니다. Business는 패키지(11회 5,500원)와
          단일 구매(1회 1,000원)를 함께 제공합니다.
        </p>

        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">Email: {email || '미입력'}</span>
          <span className="rounded-full bg-emerald-600 px-3 py-1 font-semibold text-white">Credits: {credits}</span>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const selected = selectedPlan === plan.id;
            return (
              <article
                key={plan.id}
                className={`rounded-3xl border bg-white p-5 shadow-sm transition ${
                  selected ? 'border-slate-900 ring-2 ring-slate-200' : 'border-slate-200'
                }`}
              >
                <div className={`rounded-2xl bg-gradient-to-br ${plan.tone} p-4`}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-600">{plan.badge}</p>
                  <h2
                    className="mt-1 text-3xl font-bold"
                    style={{ fontFamily: 'Garamond, Baskerville, Times New Roman, serif' }}
                  >
                    {plan.name}
                  </h2>
                  <p className="mt-2 text-xl font-extrabold text-slate-900">{plan.priceLabel}</p>
                </div>

                <p className="mt-3 text-xs font-semibold text-slate-500">{plan.infoLevel}</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {plan.details.map((d) => (
                    <li key={d}>- {d}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs font-semibold text-slate-600">
                  {plan.purchaseEnabled ? `패키지 ${BUSINESS_PACKAGE_CREDITS}회 / 단일 1회 구매 가능` : '결제 오픈 준비중'}
                </p>

                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`mt-4 w-full rounded-full px-4 py-2 text-sm font-bold ${
                    selected
                      ? 'bg-slate-900 text-white'
                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {selected ? '선택됨' : `${plan.name} 선택`}
                </button>
              </article>
            );
          })}
        </div>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-bold" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
            Checkout
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            선택 플랜: <span className="font-bold">{active.name}</span>
            {' '}| 결제 방식: <span className="font-bold">{active.id === 'business' ? '패키지 / 단일' : '준비중'}</span>
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
              <p className="font-bold text-emerald-900">Business 패키지</p>
              <p className="mt-1 text-emerald-900/90">결제 금액: {formatKrw(BUSINESS_PACKAGE_PRICE_KRW)}</p>
              <p className="text-emerald-900/90">획득 횟수: {BUSINESS_PACKAGE_CREDITS}회</p>
              <button
                type="button"
                onClick={() => handlePurchase('package')}
                disabled={active.id !== 'business'}
                className="mt-3 w-full rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                패키지 결제
              </button>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p className="font-bold text-slate-900">단일 구매</p>
              <p className="mt-1 text-slate-700">결제 금액: {formatKrw(SINGLE_CREDIT_PRICE_KRW)}</p>
              <p className="text-slate-700">획득 횟수: 1회</p>
              <button
                type="button"
                onClick={() => handlePurchase('single')}
                disabled={active.id !== 'business'}
                className="mt-3 w-full rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-200"
              >
                단일 결제
              </button>
            </div>
          </div>

          {message ? <p className="mt-3 text-sm font-semibold text-emerald-700">{message}</p> : null}
        </section>

        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-extrabold">리포트 정보량 차이</h3>
          <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="font-bold">Free</p>
              <p className="mt-1 text-slate-600">핵심 점수와 짧은 요약 중심</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="font-bold text-emerald-900">Business</p>
              <p className="mt-1 text-emerald-900/80">시뮬레이션/루틴/근거요약/실행체크리스트 제공</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="font-bold text-amber-900">Pro</p>
              <p className="mt-1 text-amber-900/80">고도화 기능 차후 오픈 예정</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/views" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
              분석 화면으로
            </Link>
            <Link href="/" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">
              랜딩으로
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <h3 className="text-lg font-extrabold text-emerald-900">Business 기능 한눈에 보기</h3>
          <div className="mt-3 grid gap-2 text-sm text-emerald-900/90 md:grid-cols-2">
            <p>- 개선 시뮬레이션 상세</p>
            <p>- 루틴/시술 추천 강화</p>
            <p>- 우선 개선 항목 Top 3</p>
            <p>- 항목별 근거 요약</p>
            <p>- 실행 체크리스트</p>
            <p>- 주간 점검 포인트</p>
            <p>- 확장된 결과 설명 문장</p>
            <p>- 패키지: 11회 5,500원</p>
            <p>- 단일: 1회 1,000원</p>
            <p>- 이메일 결과 전달 + 사진 저장 안 함</p>
          </div>
        </section>
      </section>
    </main>
  );
}
