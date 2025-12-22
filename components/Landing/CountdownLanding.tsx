'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

function clampNonNegative(n: number) {
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

function pad2(n: number) {
  const s = String(Math.floor(n))
  return s.length >= 2 ? s : `0${s}`
}

function formatVietnameseDate(iso: string) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '...'
  return d.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })
}

const STORAGE_KEY = 'pb_rocket_launch_v1'
const LAUNCH_ANIM_MS = 1500

function RocketSvg(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 128 128"
      className={props.className}
      role="img"
      aria-label="Tên lửa"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="pb-rocket-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e5e7eb" />
          <stop offset="1" stopColor="#94a3b8" />
        </linearGradient>
        <linearGradient id="pb-rocket-nose" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient id="pb-rocket-flame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.55" stopColor="#fb7185" />
          <stop offset="1" stopColor="#ef4444" />
        </linearGradient>
      </defs>

      {/* body */}
      <path
        d="M64 10c16 10 26 30 26 54 0 22-8 41-26 60-18-19-26-38-26-60 0-24 10-44 26-54z"
        fill="url(#pb-rocket-body)"
        stroke="#0f172a"
        strokeOpacity="0.4"
        strokeWidth="2"
      />
      {/* window */}
      <circle cx="64" cy="56" r="10" fill="#0b1220" opacity="0.9" />
      <circle cx="60" cy="52" r="3" fill="#93c5fd" opacity="0.8" />
      {/* nose */}
      <path
        d="M64 10c7 5 12 12 15 21H49c3-9 8-16 15-21z"
        fill="url(#pb-rocket-nose)"
      />
      {/* fins */}
      <path d="M38 72l-18 8 16 10c2-7 2-12 2-18z" fill="#3b82f6" opacity="0.9" />
      <path d="M90 72l18 8-16 10c-2-7-2-12-2-18z" fill="#3b82f6" opacity="0.9" />
      {/* flame */}
      <path
        d="M64 116c-6-6-10-14-10-22 0-3 0-5 1-8 3 4 7 6 9 7 2-1 6-3 9-7 1 3 1 5 1 8 0 8-4 16-10 22z"
        fill="url(#pb-rocket-flame)"
        opacity="0.95"
      />
    </svg>
  )
}

export default function CountdownLanding(props: {
  launchAtIso: string
  href: string
  autoLaunch?: boolean
  autoLaunchDelayMs?: number
}) {
  const router = useRouter()
  const { launchAtIso, href, autoLaunch = false, autoLaunchDelayMs = 450 } = props
  const launchMs = useMemo(() => new Date(launchAtIso).getTime(), [launchAtIso])
  const [now, setNow] = useState(() => Date.now())
  const [hasLaunched, setHasLaunched] = useState(false)
  const [isLaunching, setIsLaunching] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setMounted(true)
    try {
      const v = window.localStorage.getItem(STORAGE_KEY)
      setHasLaunched(v === '1')
    } catch {
      setHasLaunched(false)
    }
  }, [])

  const finishAndNavigate = async () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
    router.push(href)
  }

  const launch = async () => {
    if (isLaunching) return
    setIsLaunching(true)
    // Wait for animation to be visible
    setTimeout(() => {
      void finishAndNavigate()
    }, LAUNCH_ANIM_MS)
  }

  // Auto launch on/after launch date (once per user)
  useEffect(() => {
    if (!mounted) return
    if (!autoLaunch) return
    if (hasLaunched) return
    if (Date.now() < launchMs) return

    const t = setTimeout(() => {
      void launch()
    }, autoLaunchDelayMs)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, autoLaunch, hasLaunched, launchMs, autoLaunchDelayMs])

  const diffMs = clampNonNegative(launchMs - now)
  const totalSeconds = Math.floor(diffMs / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const dateLabel = useMemo(() => formatVietnameseDate(launchAtIso), [launchAtIso])

  return (
    <div className="min-h-screen bg-[#071b34] text-white">
      <div className="relative min-h-screen overflow-hidden select-none">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_15%_15%,rgba(59,130,246,0.20),transparent_55%),radial-gradient(900px_circle_at_85%_35%,rgba(234,179,8,0.18),transparent_55%),radial-gradient(700px_circle_at_35%_85%,rgba(168,85,247,0.12),transparent_55%)]" />
          <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full border border-yellow-400/35" />
          <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full border-2 border-yellow-400/25" />
          <div className="absolute -top-12 right-12 h-40 w-40 rotate-12 rounded-full border border-yellow-300/25" />
          {/* confetti-ish dots */}
          <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(255,215,0,0.45)_1px,transparent_1px),radial-gradient(rgba(59,130,246,0.45)_1px,transparent_1px),radial-gradient(rgba(255,255,255,0.25)_1px,transparent_1px)] [background-size:80px_80px,110px_110px,140px_140px] [background-position:10px_20px,50px_70px,0px_0px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-10 md:py-14">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/10 ring-2 ring-white/20 flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="Logo" width={40} height={40} priority />
              </div>
              <div className="font-poppins">
                <div className="text-sm text-white/70">THPT Phước Bửu</div>
                <div className="text-base font-semibold">Ra mắt website</div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 text-sm text-white/70 font-poppins">
              <span>THPT Phước Bửu</span>
              <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <div className="font-poppins">
                <div className="text-sm md:text-base text-yellow-300/90 font-semibold tracking-wide">
                  CHỈ CÒN {days} NGÀY NỮA LÀ ĐẾN SỰ KIỆN
                </div>
                <h1 className="mt-2 text-3xl md:text-5xl font-extrabold tracking-tight">
                  RA MẮT WEBSITE CHÍNH THỨC
                </h1>
                <div className="mt-3 text-base md:text-lg text-white/80">
                  Ra mắt chính thức ngày <span className="text-yellow-200 font-semibold">{dateLabel}</span>
                </div>
              </div>

              <div className="mt-10">
                <div className="text-center md:text-left">
                  <div className="text-xl md:text-2xl font-extrabold font-poppins tracking-wide">
                    CHỈ CÒN
                  </div>
                </div>

                <div className="mt-4 flex flex-col md:flex-row md:items-end gap-4">
                  <div className="flex items-center justify-center md:justify-start gap-3">
                    <div className="text-4xl md:text-6xl font-extrabold text-yellow-300 font-poppins tabular-nums">
                      {pad2(days)}
                    </div>
                    <div className="text-4xl md:text-6xl font-extrabold text-white/80 font-poppins">:</div>
                    <div className="text-4xl md:text-6xl font-extrabold text-yellow-300 font-poppins tabular-nums">
                      {pad2(hours)}
                    </div>
                    <div className="text-4xl md:text-6xl font-extrabold text-white/80 font-poppins">:</div>
                    <div className="text-4xl md:text-6xl font-extrabold text-yellow-300 font-poppins tabular-nums">
                      {pad2(minutes)}
                    </div>
                    <div className="text-4xl md:text-6xl font-extrabold text-white/80 font-poppins">:</div>
                    <div className="text-4xl md:text-6xl font-extrabold text-yellow-300 font-poppins tabular-nums">
                      {pad2(seconds)}
                    </div>
                  </div>

                  <div className="flex items-center justify-center md:justify-start gap-8 text-xs md:text-sm text-white/70 font-poppins">
                    <div className="text-center">
                      <div className="font-semibold text-white/80">DAYS</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-white/80">HOURS</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-white/80">MINUTES</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-white/80">SECONDS</div>
                    </div>
                  </div>
                </div>

                <div className="mt-10 flex items-center justify-center md:justify-start">
                  <div className="rounded-full border border-yellow-400/35 bg-white/5 px-6 py-3 font-poppins text-lg md:text-xl">
                    thptphuocbuu.edu.vn
                  </div>
                </div>

                <div className="mt-6 text-sm text-white/70 font-poppins">
                  {autoLaunch && Date.now() >= launchMs && !hasLaunched ? 'Đang khởi động...' : ' '}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-sm">
                <div className="absolute -inset-6 rounded-3xl bg-gradient-to-tr from-yellow-400/25 to-blue-500/10 blur-2xl" />

                {/* Rocket stage */}
                <button
                  type="button"
                  onClick={() => void launch()}
                  disabled={isLaunching}
                  className={`relative w-full rounded-2xl border border-white/10 bg-black/20 p-6 shadow-2xl hover:bg-black/30 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-400/60 ${
                    isLaunching ? 'pb-stage pb-stage--launch' : 'pb-stage'
                  }`}
                  aria-label="Phóng tên lửa và vào đăng nhập"
                >
                  <div className="flex items-center justify-center">
                    <div className={`pb-rocket ${isLaunching ? 'pb-rocket--launch' : ''}`}>
                      <RocketSvg className="h-44 w-44 md:h-52 md:w-52 drop-shadow-[0_20px_30px_rgba(0,0,0,0.45)]" />
                      <div className={`pb-exhaust ${isLaunching ? 'pb-exhaust--on' : ''}`} aria-hidden="true" />
                      <div className={`pb-smoke ${isLaunching ? 'pb-smoke--on' : ''}`} />
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <div className="font-poppins font-extrabold text-lg text-yellow-200">
                      {isLaunching ? 'Đang phóng...' : 'PHÓNG TÊN LỬA'}
                    </div>
                    <div className="mt-1 text-xs text-white/70 font-poppins">&nbsp;</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 md:hidden text-center text-sm text-white/70 font-poppins">
            &nbsp;
          </div>
        </div>
      </div>
      <style jsx>{`
        .pb-stage {
          transform: translateZ(0);
          will-change: transform, filter;
        }
        .pb-stage--launch {
          animation: pb-stage-shake ${LAUNCH_ANIM_MS}ms ease-out forwards;
        }

        .pb-rocket {
          position: relative;
          transition: transform ${LAUNCH_ANIM_MS}ms cubic-bezier(0.12, 0.85, 0.2, 1),
            opacity ${LAUNCH_ANIM_MS}ms ease;
          transform: translateY(0) rotate(0deg);
          opacity: 1;
          will-change: transform, opacity;
        }
        .pb-rocket--launch {
          transform: translateY(-160vh) rotate(-12deg) scale(0.92);
          opacity: 0.98;
        }

        .pb-exhaust {
          position: absolute;
          left: 50%;
          bottom: -18px;
          width: 10px;
          height: 10px;
          transform: translateX(-50%);
          opacity: 0;
          pointer-events: none;
        }
        .pb-exhaust--on {
          opacity: 1;
        }
        .pb-exhaust::before {
          content: '';
          position: absolute;
          left: 50%;
          top: 0;
          width: 34px;
          height: 90px;
          transform: translateX(-50%);
          background: radial-gradient(
              circle at 50% 20%,
              rgba(253, 230, 138, 0.95),
              rgba(251, 113, 133, 0.85) 45%,
              rgba(239, 68, 68, 0.55) 70%,
              rgba(239, 68, 68, 0) 100%
            );
          filter: blur(0.2px);
          border-radius: 999px;
          transform-origin: 50% 0%;
          animation: pb-flame ${LAUNCH_ANIM_MS}ms ease-out forwards;
        }
        .pb-exhaust::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 26px;
          width: 140px;
          height: 140px;
          transform: translateX(-50%);
          background: radial-gradient(
            circle,
            rgba(255, 255, 255, 0.28),
            rgba(255, 255, 255, 0.08) 35%,
            rgba(255, 255, 255, 0) 70%
          );
          border-radius: 999px;
          filter: blur(1.2px);
          opacity: 0.9;
          animation: pb-blast ${LAUNCH_ANIM_MS}ms ease-out forwards;
        }

        .pb-smoke {
          position: absolute;
          left: 50%;
          bottom: -10px;
          width: 14px;
          height: 14px;
          transform: translateX(-50%);
          opacity: 0;
          filter: blur(0.5px);
        }
        .pb-smoke--on {
          opacity: 1;
          animation: pb-smoke ${LAUNCH_ANIM_MS}ms ease-out forwards;
        }
        .pb-smoke::before,
        .pb-smoke::after {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          width: 90px;
          height: 90px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0) 65%);
        }
        .pb-smoke::after {
          width: 130px;
          height: 130px;
          opacity: 0.7;
        }
        @keyframes pb-smoke {
          0% {
            transform: translateX(-50%) translateY(0) scale(0.5);
            opacity: 0.9;
          }
          100% {
            transform: translateX(-50%) translateY(40px) scale(1.1);
            opacity: 0;
          }
        }

        @keyframes pb-flame {
          0% {
            transform: translateX(-50%) scaleY(0.7);
            opacity: 0.85;
          }
          15% {
            transform: translateX(-50%) scaleY(1.05);
            opacity: 1;
          }
          60% {
            transform: translateX(-50%) scaleY(1.25);
            opacity: 0.85;
          }
          100% {
            transform: translateX(-50%) scaleY(0.6);
            opacity: 0;
          }
        }

        @keyframes pb-blast {
          0% {
            transform: translateX(-50%) scale(0.35);
            opacity: 0.9;
          }
          35% {
            transform: translateX(-50%) scale(0.85);
            opacity: 0.8;
          }
          100% {
            transform: translateX(-50%) scale(1.15);
            opacity: 0;
          }
        }

        @keyframes pb-stage-shake {
          0% {
            transform: translateY(0) scale(1);
            filter: brightness(1);
          }
          10% {
            transform: translateY(1px) translateX(-1px);
            filter: brightness(1.05);
          }
          20% {
            transform: translateY(-1px) translateX(1px);
          }
          35% {
            transform: translateY(1px) translateX(1px);
            filter: brightness(1.07);
          }
          55% {
            transform: translateY(-1px) translateX(-1px);
          }
          100% {
            transform: translateY(0) translateX(0);
            filter: brightness(1);
          }
        }
      `}</style>
    </div>
  )
}


