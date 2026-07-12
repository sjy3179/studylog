import type { ReactNode } from 'react'
import {
  ArrowRight,
  BarChart3,
  Camera,
  CheckCircle2,
  Clock3,
  EyeOff,
  Gauge,
  Layers3,
  LockKeyhole,
  Pause,
  ScanLine,
  ShieldCheck,
  Sparkles,
  SunMedium,
  TriangleAlert,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'

import { BrandMark } from '@/components/brand/BrandMark'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const pageWidth = 'mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-10'

type FeatureCardProps = {
  description: string
  eyebrow: string
  icon: ReactNode
  title: string
}

function FeatureCard({ description, eyebrow, icon, title }: FeatureCardProps) {
  return (
    <Card className="h-full gap-0 border-0 bg-white py-0 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/80">
      <CardHeader className="gap-5 px-6 pt-6 pb-0 sm:px-7 sm:pt-7">
        <div className="flex items-start justify-between gap-4">
          <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
            {icon}
          </span>
          <span className="font-mono text-[11px] font-semibold tracking-[0.16em] text-slate-400">
            {eyebrow}
          </span>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-lg font-semibold tracking-[-0.02em] text-slate-950">
            {title}
          </CardTitle>
          <CardDescription className="text-[15px] leading-7 text-slate-600">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-6 pt-6 pb-7 sm:px-7">
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-2/3 rounded-full bg-indigo-500/70" />
        </div>
      </CardContent>
    </Card>
  )
}

type SectionHeadingProps = {
  align?: 'center' | 'left'
  children: ReactNode
  description: string
  eyebrow: string
  id: string
}

function SectionHeading({
  align = 'left',
  children,
  description,
  eyebrow,
  id,
}: SectionHeadingProps) {
  return (
    <div
      className={
        align === 'center'
          ? 'mx-auto max-w-2xl text-center'
          : 'max-w-2xl text-left'
      }
    >
      <p className="mb-4 text-xs font-semibold tracking-[0.18em] text-indigo-700 uppercase">
        {eyebrow}
      </p>
      <h2
        className="m-0 text-3xl leading-tight font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl"
        id={id}
      >
        {children}
      </h2>
      <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
        {description}
      </p>
    </div>
  )
}

function ProductPreview() {
  return (
    <figure
      aria-labelledby="product-preview-caption"
      className="relative mx-auto w-full max-w-[620px]"
    >
      <figcaption className="sr-only" id="product-preview-caption">
        순공 시간, 현재 자세, 현재 조도를 보여주는 studylog 제품 화면 미리보기
      </figcaption>
      <div
        aria-hidden="true"
        className="absolute -inset-8 -z-10 rounded-[3rem] bg-indigo-100/60 blur-3xl"
      />
      <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_34px_90px_-38px_rgba(30,41,59,0.42)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-rose-300" />
            <span className="size-2 rounded-full bg-amber-300" />
            <span className="size-2 rounded-full bg-emerald-300" />
          </div>
          <Badge
            variant="outline"
            className="border-slate-200 bg-slate-50 text-[10px] font-semibold tracking-wider text-slate-500 uppercase"
          >
            제품 미리보기
          </Badge>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-[1.25fr_0.75fr] sm:p-6">
          <div className="rounded-2xl bg-slate-950 p-5 text-left text-white sm:p-6">
            <div className="mb-10 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">순공 시간</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                <CheckCircle2 aria-hidden="true" className="size-3.5" />
                학습 중
              </span>
            </div>
            <p className="font-mono text-4xl leading-none font-semibold tracking-[-0.05em] text-white sm:text-5xl">
              01:24:31
            </p>
            <p className="mt-4 flex items-center gap-2 text-xs text-slate-400">
              <Clock3 aria-hidden="true" className="size-3.5" />
              착석·자세·조도 조건 충족 중
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-1">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-left">
              <span className="flex size-8 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
                <ScanLine aria-hidden="true" className="size-4" />
              </span>
              <p className="mt-4 text-[11px] font-medium text-emerald-800/70">현재 자세</p>
              <p className="mt-1 text-sm font-semibold text-emerald-950">GOOD</p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-left">
              <span className="flex size-8 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm">
                <SunMedium aria-hidden="true" className="size-4" />
              </span>
              <p className="mt-4 text-[11px] font-medium text-amber-800/70">현재 조도</p>
              <p className="mt-1 text-sm font-semibold text-amber-950">620 Lux · 적정</p>
            </div>
          </div>
        </div>

        <div className="mx-4 mb-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs sm:mx-6 sm:mb-6">
          <span className="flex items-center gap-2 font-medium text-slate-700">
            <Camera aria-hidden="true" className="size-4 text-indigo-600" />
            자세 분석 준비됨
          </span>
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            브라우저 내 처리
          </span>
        </div>
      </div>
    </figure>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f8fafc] text-left text-slate-950 [color-scheme:light]">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-indigo-700 shadow-lg focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        본문으로 건너뛰기
      </a>

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className={`${pageWidth} flex h-16 items-center justify-between`}>
          <BrandMark className="focus-visible:ring-indigo-500" to="/" />

          <nav className="hidden items-center gap-7 md:flex" aria-label="주요 메뉴">
            <a
              className="rounded-md py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              href="#how-it-works"
            >
              작동 방식
            </a>
            <a
              className="rounded-md py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              href="#report"
            >
              기록
            </a>
            <a
              className="rounded-md py-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              href="#privacy"
            >
              개인정보 보호
            </a>
          </nav>

          <Button
            asChild
            className="h-11 rounded-xl bg-slate-950 px-4 text-white shadow-sm hover:bg-slate-800"
          >
            <Link to="/app">
              시작하기
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </header>

      <main id="main-content">
        <section className="relative isolate overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32 lg:pt-28">
          <div
            aria-hidden="true"
            className="absolute top-10 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-100/70 blur-3xl sm:h-96 sm:w-96"
          />
          <div className={`${pageWidth} grid items-center gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16`}>
            <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
              <Badge className="mb-6 h-7 border border-indigo-100 bg-indigo-50 px-3 text-xs font-semibold text-indigo-700">
                <Sparkles aria-hidden="true" />
                자세와 환경을 함께 기록하는 캠스터디
              </Badge>
              <p className="text-sm font-bold tracking-[0.16em] text-indigo-700 uppercase">
                studylog
              </p>
              <h1 className="!m-0 mt-5! text-4xl leading-[1.14] font-bold tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[4.1rem]">
                공부한 시간보다,
                <br />
                공부한 상태까지 기록하세요.
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg lg:mx-0">
                웹캠 기반 자세 분석과 학습 공간의 밝기 데이터를 이용해
                <br className="hidden sm:block" />
                착석 상태, 자세 변화, 권장 조건 학습 시간을 기록합니다.
              </p>

              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="h-12 rounded-xl bg-indigo-600 px-6 text-base text-white shadow-lg shadow-indigo-200/70 hover:bg-indigo-700"
                >
                  <Link to="/app">
                    무료로 시작하기
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl border-slate-200 bg-white px-6 text-base text-slate-800 shadow-sm hover:bg-slate-50"
                >
                  <Link to="/app?demo=1">데모</Link>
                </Button>
              </div>
              <a
                href="#how-it-works"
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-slate-600 underline-offset-4 transition-colors hover:text-indigo-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                작동 방식 보기
                <ArrowRight aria-hidden="true" className="size-4 rotate-90" />
              </a>
            </div>

            <ProductPreview />
          </div>
        </section>

        <section
          className="border-y border-slate-200 bg-white py-20 sm:py-24"
          aria-labelledby="timer-limitation-title"
        >
          <div className={`${pageWidth} grid gap-6 lg:grid-cols-2`}>
            <Card className="gap-0 border-0 bg-slate-50 py-0 ring-1 ring-slate-200/80">
              <CardContent className="p-7 sm:p-9">
                <span className="flex size-11 items-center justify-center rounded-xl bg-slate-200/70 text-slate-700">
                  <Pause aria-hidden="true" className="size-5" />
                </span>
                <p className="mt-8 text-xs font-semibold tracking-[0.16em] text-slate-500 uppercase">
                  기존 공부 타이머의 한계
                </p>
                <h2
                  id="timer-limitation-title"
                  className="m-0 mt-3 text-2xl leading-snug font-semibold tracking-[-0.03em] text-slate-950 sm:text-3xl"
                >
                  켜져 있던 시간만으로는
                  <br />
                  학습 상태를 알기 어렵습니다.
                </h2>
                <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">
                  자리를 비웠는지, 자세가 흐트러졌는지, 학습 공간의 밝기가 적정했는지까지
                  시간과 함께 나누어 기록합니다.
                </p>
              </CardContent>
            </Card>

            <Card className="gap-0 border-0 bg-indigo-950 py-0 text-white ring-0">
              <CardContent className="p-7 sm:p-9">
                <span className="flex size-11 items-center justify-center rounded-xl bg-white/10 text-indigo-200">
                  <Gauge aria-hidden="true" className="size-5" />
                </span>
                <p className="mt-8 text-xs font-semibold tracking-[0.16em] text-indigo-300 uppercase">
                  studylog의 순공 시간
                </p>
                <h2 className="m-0 mt-3 text-2xl leading-snug font-semibold tracking-[-0.03em] text-white sm:text-3xl">
                  실행 중 · 감지됨 · GOOD
                  <br />
                  그리고 권장 조도
                </h2>
                <p className="mt-5 max-w-lg text-base leading-7 text-indigo-100/75">
                  studylog의 순공 시간은 실제 집중력을 측정한 값이 아니라, 착석·자세·조도
                  조건을 충족한 시간입니다.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-20 py-24 sm:py-32"
          aria-labelledby="how-it-works-title"
        >
          <div className={pageWidth}>
            <SectionHeading
              align="center"
              id="how-it-works-title"
              eyebrow="How it works"
              description="한 가지 신호에만 기대지 않고, 자세 분류와 기준 자세 분석, 조도 데이터를 각자의 역할에 맞게 사용합니다."
            >
              학습 상태를 기록하는 세 가지 신호
            </SectionHeading>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <FeatureCard
                eyebrow="01 · CLASSIFY"
                icon={<Camera aria-hidden="true" className="size-5" />}
                title="Teachable Machine 자세 분류"
                description="Pose Project 모델이 GOOD_POSTURE, FORWARD_LEAN, SIDE_LEAN, RESTING 네 가지 자세 클래스를 분류합니다."
              />
              <FeatureCard
                eyebrow="02 · COMPARE"
                icon={<ScanLine aria-hidden="true" className="size-5" />}
                title="MediaPipe 기준 자세 분석"
                description="관절 랜드마크를 이용해 사용자가 설정한 기준 자세와 현재 자세의 변화를 비교합니다."
              />
              <FeatureCard
                eyebrow="03 · SENSE"
                icon={<SunMedium aria-hidden="true" className="size-5" />}
                title="가상 조도 센서"
                description="0~1500 Lux 범위의 가상 센서값으로 낮음, 권장, 높음 상태와 조도 경고 흐름을 확인합니다."
              />
            </div>
          </div>
        </section>

        <section className="bg-slate-950 py-24 text-white sm:py-32" aria-labelledby="stability-title">
          <div className={`${pageWidth} grid items-center gap-14 lg:grid-cols-[0.8fr_1.2fr]`}>
            <div>
              <p className="mb-4 text-xs font-semibold tracking-[0.18em] text-indigo-300 uppercase">
                Stable feedback
              </p>
              <h2
                className="m-0 text-3xl leading-tight font-semibold tracking-[-0.035em] text-white sm:text-4xl"
                id="stability-title"
              >
                순간 변화는 걸러내고,
                <br />
                필요한 경고는 분명하게
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                상태 안정화는 짧은 움직임이 즉시 경고로 바뀌는 것을 줄입니다. 경고는 색상뿐
                아니라 아이콘과 문구로 함께 전달합니다.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                <CheckCircle2 aria-hidden="true" className="size-5 text-emerald-300" />
                <p className="mt-8 text-sm font-semibold text-white">GOOD</p>
                <p className="mt-1 text-xs leading-5 text-emerald-100/70">권장 조건에서 순공 기록</p>
              </div>
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-5">
                <TriangleAlert aria-hidden="true" className="size-5 text-amber-300" />
                <p className="mt-8 text-sm font-semibold text-white">자세 주의</p>
                <p className="mt-1 text-xs leading-5 text-amber-100/70">안정화 뒤 안내와 시간 기록</p>
              </div>
              <div className="rounded-2xl border border-slate-400/20 bg-slate-400/10 p-5">
                <EyeOff aria-hidden="true" className="size-5 text-slate-300" />
                <p className="mt-8 text-sm font-semibold text-white">자리 비움</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">순공 정지, 내부 시간 기록</p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="report"
          className="scroll-mt-20 bg-white py-24 sm:py-32"
          aria-labelledby="report-title"
        >
          <div className={`${pageWidth} grid items-center gap-12 lg:grid-cols-2 lg:gap-20`}>
            <div>
              <SectionHeading
                id="report-title"
                eyebrow="Session report"
                description="세션이 끝난 뒤 순공 시간과 목표 달성률, 자세·조도 상태를 한 화면에서 되돌아봅니다."
              >
                시간의 양에서
                <br />
                학습 조건의 흐름까지
              </SectionHeading>
              <ul className="mt-8 space-y-4 text-sm text-slate-700">
                {[
                  '순공 시간과 전체 세션 시간 구분',
                  '자세 주의·자리 비움·조도 주의 시간 기록',
                  '일간·주간·과목별 기록 탐색',
                ].map((item) => (
                  <li className="flex items-center gap-3" key={item}>
                    <CheckCircle2 aria-hidden="true" className="size-5 text-emerald-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <Card className="gap-0 border-0 bg-slate-50 py-0 shadow-[0_20px_60px_-38px_rgba(15,23,42,0.4)] ring-1 ring-slate-200">
              <CardContent className="p-5 sm:p-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500">세션 리포트</p>
                    <p className="mt-1 text-base font-semibold text-slate-950">오늘의 캠스터디</p>
                  </div>
                  <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                    <BarChart3 aria-hidden="true" className="size-5" />
                  </span>
                </div>
                <Separator className="my-6 bg-slate-200" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80">
                    <p className="text-[11px] text-slate-500">순공 시간</p>
                    <p className="mt-2 font-mono text-xl font-semibold text-slate-950">01:24:31</p>
                  </div>
                  <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200/80">
                    <p className="text-[11px] text-slate-500">권장 조도 유지율</p>
                    <p className="mt-2 font-mono text-xl font-semibold text-slate-950">—</p>
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-white p-4 ring-1 ring-slate-200/80">
                  <div className="mb-4 flex items-center justify-between text-[11px] text-slate-500">
                    <span>세션 상태 타임라인</span>
                    <span>상태별 기록</span>
                  </div>
                  <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
                    <span className="w-[58%] bg-emerald-500" />
                    <span className="w-[16%] bg-amber-400" />
                    <span className="w-[10%] bg-slate-400" />
                    <span className="w-[16%] bg-indigo-300" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-emerald-500" />순공</span>
                    <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-amber-400" />자세 주의</span>
                    <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-slate-400" />자리 비움</span>
                    <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-indigo-300" />조도 주의</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section
          id="privacy"
          className="scroll-mt-20 border-y border-slate-200 bg-indigo-50/50 py-20 sm:py-24"
          aria-labelledby="privacy-title"
        >
          <div className={`${pageWidth} grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16`}>
            <div className="relative mx-auto w-full max-w-md" aria-hidden="true">
              <div className="absolute -inset-8 rounded-full bg-indigo-200/35 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-indigo-100 bg-white/90 p-5 shadow-[0_24px_70px_-36px_rgba(67,56,202,0.45)] backdrop-blur sm:p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-sm">
                      <ShieldCheck className="size-6" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-950">브라우저 안에서 처리</p>
                      <p className="mt-0.5 text-xs text-slate-500">카메라 프레임은 기기 밖으로 나가지 않아요</p>
                    </div>
                  </div>
                  <span className="size-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                </div>

                <div className="my-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4 text-center ring-1 ring-slate-200/80">
                    <Camera className="mx-auto size-6 text-slate-500" />
                    <p className="mt-2 text-xs font-semibold text-slate-700">실시간 입력</p>
                  </div>
                  <ArrowRight className="size-4 text-indigo-400" />
                  <div className="rounded-2xl bg-indigo-50 p-4 text-center ring-1 ring-indigo-100">
                    <ScanLine className="mx-auto size-6 text-indigo-600" />
                    <p className="mt-2 text-xs font-semibold text-indigo-900">순간 분석</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3 text-xs font-medium text-slate-600">
                    <EyeOff className="size-4 text-indigo-600" />
                    원본 영상·이미지 저장 안 함
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3 text-xs font-medium text-slate-600">
                    <LockKeyhole className="size-4 text-indigo-600" />
                    서버 전송 없이 로컬에서 완료
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-indigo-700 uppercase">
                Privacy by design
              </p>
              <h2
                className="m-0 text-3xl leading-tight font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl"
                id="privacy-title"
              >
                분석에 필요한 순간만,
                <br className="sm:hidden" /> 브라우저 안에서
              </h2>
              <p className="mt-5 max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">
                카메라 영상은 브라우저 안에서 실시간 분석에만 사용되며
                <br className="hidden sm:block" />
                원본 영상과 이미지는 저장되거나 서버로 전송되지 않습니다.
              </p>
              <div className="mt-7 flex flex-wrap gap-3 text-xs font-medium text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 ring-1 ring-slate-200">
                  <LockKeyhole aria-hidden="true" className="size-3.5 text-indigo-600" />
                  원본 영상 미저장
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 ring-1 ring-slate-200">
                  <Layers3 aria-hidden="true" className="size-3.5 text-indigo-600" />
                  브라우저 내 실시간 처리
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-32" aria-labelledby="group-preview-title">
          <div className={pageWidth}>
            <div className="grid items-end gap-8 lg:grid-cols-2">
              <SectionHeading
                id="group-preview-title"
                eyebrow="Group preview"
                description="각자의 학습 화면은 분리한 채, 함께 공부하는 흐름을 보여줍니다."
              >
                나란히 공부하는 감각만 담은 그룹
              </SectionHeading>
              <p className="max-w-lg text-sm leading-6 text-slate-500 lg:justify-self-end">
                그룹 생성, 참가, 초대 기능은 현재 비활성화되어 있으며 실제 네트워크 요청이나
                사용자 동기화는 발생하지 않습니다.
              </p>
            </div>

            <Card className="mt-10 gap-0 border-0 bg-white py-0 shadow-[0_18px_60px_-38px_rgba(15,23,42,0.45)] ring-1 ring-slate-200">
              <CardContent className="p-5 sm:p-8">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold tracking-[-0.02em] text-slate-950">시험기간 집중반</h3>
                      <Badge className="border border-indigo-100 bg-indigo-50 text-indigo-700">미리보기</Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">각자의 목표를 향해 함께 공부하는 그룹입니다.</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <Users aria-hidden="true" className="size-4 text-indigo-600" />
                    그룹 멤버 미리보기
                  </div>
                </div>

                <Separator className="my-6 bg-slate-200" />
                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    { name: '나', status: '공부 중', subject: '수학', tone: 'bg-emerald-500' },
                    { name: '민준', status: '휴식', subject: '영어', tone: 'bg-amber-400' },
                    { name: '서연', status: '오프라인', subject: '과목 없음', tone: 'bg-slate-400' },
                  ].map((member) => (
                    <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/70" key={member.name}>
                      <span className="flex size-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-700 shadow-sm">
                        {member.name.slice(0, 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-semibold text-slate-950">{member.name}</p>
                          <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <i className={`size-1.5 rounded-full ${member.tone}`} />
                            {member.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{member.subject}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="px-5 pb-24 sm:px-8 sm:pb-32" aria-labelledby="final-cta-title">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-indigo-600 px-6 py-14 text-center text-white shadow-[0_30px_70px_-40px_rgba(79,70,229,0.8)] sm:px-10 sm:py-20">
            <p className="text-xs font-semibold tracking-[0.18em] text-indigo-200 uppercase">Start a session</p>
            <h2
              className="m-0 mt-4 text-3xl leading-tight font-semibold tracking-[-0.04em] text-white sm:text-5xl"
              id="final-cta-title"
            >
              오늘의 공부를,
              <br />
              상태와 함께 남겨보세요.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-indigo-100">
              설치나 로그인 없이 데모 센서로 studylog의 핵심 흐름을 먼저 확인할 수 있습니다.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-xl bg-white px-6 text-base text-indigo-700 hover:bg-indigo-50">
                <Link to="/app">
                  무료로 시작하기
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-indigo-400 bg-indigo-600 px-6 text-base text-white hover:bg-indigo-700 hover:text-white"
              >
                <Link to="/app?demo=1">데모</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className={`${pageWidth} flex flex-col gap-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between`}>
          <BrandMark compact to="/" />
          <p>착석·자세·조도 조건을 기록하는 개인용 캠스터디</p>
        </div>
      </footer>
    </div>
  )
}
