import { useId } from 'react'
import type { ChurchTheme } from '../types'

export function ChurchMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="church-mark"
    >
      <path
        d="M9 40V24.5C9 16.492 15.716 10 24 10s15 6.492 15 14.5V40"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path d="M24 6v9M19.5 10.5h9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M19 40V29.8c0-2.65 2.239-4.8 5-4.8s5 2.15 5 4.8V40"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path d="M9 40h30" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  )
}

interface ChurchArtProps {
  theme: ChurchTheme
  variant?: number
  className?: string
}

export function ChurchArt({ theme, variant = 0, className }: ChurchArtProps) {
  const rawId = useId()
  const gid = rawId.replace(/[^a-zA-Z0-9]/g, '')
  const sky = `sky-${gid}`
  const stone = `stone-${gid}`
  const glow = `glow-${gid}`
  const floor = `floor-${gid}`

  const twinTowers = variant % 2 === 0
  const pointed = variant % 3 === 0

  const windowShape = pointed ? (
    <path
      d="M196 286V247c0-14 6.5-23 14-30 7.5 7 14 16 14 30v39Z"
      fill={theme.deep}
      stroke={theme.accent}
      strokeWidth="1.6"
    />
  ) : (
    <circle cx="210" cy="254" r="31" fill={theme.deep} stroke={theme.accent} strokeWidth="1.6" />
  )

  const windowDetail = pointed ? (
    <g stroke={theme.accent} strokeWidth="1.2" opacity="0.7">
      <path d="M210 217v69M196 253h28M200 232h20" />
      <path d="M203 284h14" />
    </g>
  ) : (
    <g stroke={theme.accent} strokeWidth="1.2" opacity="0.75">
      <circle cx="210" cy="254" r="19" />
      <path d="M210 223v62M179 254h62M188 232l44 44M232 232l-44 44" />
    </g>
  )

  return (
    <svg
      viewBox="0 0 420 520"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      role="img"
      aria-label="Ilustración de la fachada de la iglesia"
    >
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor={theme.deep} />
          <stop offset="0.55" stopColor={theme.primary} />
          <stop offset="1" stopColor={theme.deep} />
        </linearGradient>
        <linearGradient id={stone} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor={theme.soft} />
          <stop offset="0.7" stopColor={theme.tint} />
          <stop offset="1" stopColor={theme.soft} />
        </linearGradient>
        <linearGradient id={floor} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={theme.deep} stopOpacity="0.1" />
          <stop offset="1" stopColor={theme.deep} stopOpacity="0.65" />
        </linearGradient>
        <radialGradient id={glow}>
          <stop offset="0" stopColor={theme.accent} stopOpacity="0.55" />
          <stop offset="1" stopColor={theme.accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="420" height="520" fill={`url(#${sky})`} />
      <circle cx="302" cy="124" r="150" fill={`url(#${glow})`} opacity="0.55" />
      <circle cx="302" cy="124" r="47" fill={theme.accent} opacity="0.22" />

      <g opacity="0.32" fill="none" stroke={theme.accent} strokeWidth="1">
        <path d="M-20 92c48-24 92-24 140 0s92 24 140 0 92-24 140 0 92 24 140 0" />
        <path d="M-20 120c48-24 92-24 140 0s92 24 140 0 92-24 140 0 92 24 140 0" />
      </g>

      <g fill={theme.soft} opacity="0.1">
        <circle cx="62" cy="78" r="1.5" />
        <circle cx="112" cy="52" r="1" />
        <circle cx="354" cy="206" r="1.4" />
        <circle cx="384" cy="76" r="1" />
        <circle cx="36" cy="170" r="1.1" />
        <circle cx="332" cy="42" r="1.2" />
      </g>

      <path
        d="M0 426c52-20 92-16 136 2s95 18 145-2 96-20 139 0v94H0Z"
        fill={theme.deep}
        opacity="0.35"
      />
      <path
        d="M48 412c10-38 32-52 56-54-4 18 0 36 10 50Zm82-40c8-24 26-36 44-38-2 14 2 28 10 38Z"
        fill={theme.deep}
        opacity="0.42"
      />
      <path
        d="M296 402c8-32 28-46 50-48-4 16 0 32 9 46Zm74-22c6-20 20-30 34-32-2 12 2 24 8 32Z"
        fill={theme.deep}
        opacity="0.32"
      />

      {twinTowers && (
        <>
          <g>
            <rect x="60" y="206" width="58" height="228" fill={`url(#${stone})`} />
            <path d="M60 206h58v10H60Z" fill={theme.primary} opacity="0.28" />
            <path d="M74 226h30v5H74Z" fill={theme.primary} opacity="0.35" />
            <path
              d="M74 254h30v50H74Z"
              fill={theme.deep}
              opacity="0.85"
              stroke={theme.accent}
              strokeWidth="1.2"
            />
            <path d="M89 254v50M74 279h30" stroke={theme.accent} strokeWidth="1" opacity="0.6" />
            <path
              d="M78 404c0-9 5-15 11-15s11 6 11 15v30H78Z"
              fill={theme.deep}
              opacity="0.8"
            />
            <path d="M89 184v22M80 194h18" stroke={theme.accent} strokeWidth="2.2" />
            <path d="M68 196h42l-6 10H74Z" fill={theme.primary} opacity="0.55" />
          </g>
          <g>
            <rect x="302" y="206" width="58" height="228" fill={`url(#${stone})`} />
            <path d="M302 206h58v10h-58Z" fill={theme.primary} opacity="0.28" />
            <path d="M316 226h30v5h-30Z" fill={theme.primary} opacity="0.35" />
            <path
              d="M316 254h30v50h-30Z"
              fill={theme.deep}
              opacity="0.85"
              stroke={theme.accent}
              strokeWidth="1.2"
            />
            <path d="M331 254v50M316 279h30" stroke={theme.accent} strokeWidth="1" opacity="0.6" />
            <path
              d="M320 404c0-9 5-15 11-15s11 6 11 15v30h-22Z"
              fill={theme.deep}
              opacity="0.8"
            />
            <path d="M331 184v22M322 194h18" stroke={theme.accent} strokeWidth="2.2" />
            <path d="M310 196h42l-6 10h-30Z" fill={theme.primary} opacity="0.55" />
          </g>
        </>
      )}

      <g>
        <path d="M132 214h156v220H132Z" fill={`url(#${stone})`} />
        <path d="M132 214h156v12H132Z" fill={theme.primary} opacity="0.24" />
        <path
          d={pointed ? 'M132 214l78-38 78 38Z' : 'M132 214c0-20 35-36 78-36s78 16 78 36Z'}
          fill={theme.primary}
          opacity="0.5"
        />
        <path
          d="M154 238h112v196H154Z"
          fill="none"
          stroke={theme.primary}
          strokeWidth="1.4"
          opacity="0.3"
        />
        <path d="M166 224h88v6h-88Z" fill={theme.primary} opacity="0.3" />
        {windowShape}
        {windowDetail}
        <path d="M210 214v12M204 220h12" stroke={theme.accent} strokeWidth="1.5" />
        <path
          d="M178 408v-48c0-18 14-32 32-32s32 14 32 32v48Z"
          fill={theme.deep}
          stroke={theme.accent}
          strokeWidth="1.5"
        />
        <path d="M210 328v80" stroke={theme.accent} strokeWidth="1.2" opacity="0.7" />
        <path
          d="M196 340v68M224 340v68"
          stroke={theme.accent}
          strokeWidth="1"
          opacity="0.35"
        />
        <circle cx="201" cy="374" r="2" fill={theme.accent} />
        <circle cx="219" cy="374" r="2" fill={theme.accent} />
        <g opacity="0.8">
          <path d="M140 258h18v34h-18Z" fill={theme.deep} opacity="0.7" />
          <path d="M140 292c0-9 4-16 9-16s9 7 9 16Z" fill={theme.deep} opacity="0.7" />
          <path d="M262 258h18v34h-18Z" fill={theme.deep} opacity="0.7" />
          <path d="M262 292c0-9 4-16 9-16s9 7 9 16Z" fill={theme.deep} opacity="0.7" />
        </g>
        <path d="M210 126v52M198 144h24" stroke={theme.accent} strokeWidth="2.6" />
        <path d="M198 158h24" stroke={theme.accent} strokeWidth="1.2" opacity="0.6" />
      </g>

      <g>
        <path d="M108 434h204l28 28H80Z" fill={theme.soft} opacity="0.85" />
        <path d="M80 462h260v10H80Z" fill={theme.soft} opacity="0.55" />
        <path d="M62 472h296v48H62Z" fill={`url(#${floor})`} />
      </g>

      <g fill={theme.accent} opacity="0.55">
        <circle cx="44" cy="300" r="2" />
        <circle cx="382" cy="286" r="1.6" />
        <path d="M46 340l4-8 4 8-4-2Z" />
        <path d="M370 340l5-9 5 9-5-2Z" />
      </g>
      <g stroke={theme.soft} strokeWidth="1.2" opacity="0.45" fill="none">
        <path d="M56 158c6-5 11-5 17 0M70 148c5-3 9-3 14 0" />
        <path d="M318 380c6-5 12-5 18 0M330 370c5-3 9-3 14 0" />
      </g>
    </svg>
  )
}
