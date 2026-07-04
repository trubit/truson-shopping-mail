import type { CSSProperties } from 'react'

export interface LogoProps {
  /** Visual size of the complete lockup */
  size?:      'lg' | 'md' | 'sm' | 'xs'
  /**
   * auto  — reads CSS custom properties, adapts to light/dark OS theme
   * light — fixed teal mark, dark wordmark (use on light backgrounds)
   * dark  — fixed gold mark, white wordmark (use on dark/brand backgrounds)
   */
  theme?:     'auto' | 'light' | 'dark'
  /** Render the mark only — no wordmark text */
  iconOnly?:  boolean
  className?: string
  style?:     CSSProperties
}

interface SizeConfig {
  svgPx: number
  cSW:   number
  mSW:   number
  wmPx:  number
  tagPx: number
  gap:   number
  tagMt: number
}

const SIZES: Record<NonNullable<LogoProps['size']>, SizeConfig> = {
  lg: { svgPx: 52, cSW: 1.8, mSW: 2.8, wmPx: 28, tagPx: 9,   gap: 20, tagMt: 7 },
  md: { svgPx: 36, cSW: 2.2, mSW: 3.4, wmPx: 20, tagPx: 6.5, gap: 14, tagMt: 5 },
  sm: { svgPx: 28, cSW: 2.8, mSW: 4.2, wmPx: 15, tagPx: 5,   gap: 10, tagMt: 3 },
  xs: { svgPx: 20, cSW: 3.5, mSW: 5.2, wmPx: 11, tagPx: 4,   gap: 7,  tagMt: 2 },
}

interface ColorConfig { mark: string; thin: string; bold: string; tag: string }

const COLORS: Record<NonNullable<LogoProps['theme']>, ColorConfig> = {
  dark:  { mark: '#C8A96A', thin: 'rgba(226,221,212,.78)', bold: '#FFFFFF',  tag: '#DBBF89' },
  light: { mark: '#0B2D3D', thin: '#091820',               bold: '#0B2D3D',  tag: '#A07C45' },
  auto:  {
    mark: 'var(--ts-logo-mark)',
    thin: 'var(--ts-logo-thin)',
    bold: 'var(--ts-logo-bold)',
    tag:  'var(--ts-logo-tag)',
  },
}

const WM_FONT = "'Helvetica Neue', Arial, sans-serif"

export default function Logo({
  size     = 'md',
  theme    = 'auto',
  iconOnly = false,
  className,
  style,
}: LogoProps) {
  const s = SIZES[size]
  const c = COLORS[theme]

  return (
    <span
      className={`ts-logo${className ? ` ${className}` : ''}`}
      style={{
        display:    'inline-flex',
        alignItems: 'center',
        gap:        s.gap,
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
      aria-label="TrusonShopp Mall"
      role="img"
    >
      {/* Logomark: outer circle + gateway arch (also reads as T-monogram) */}
      <svg
        width={s.svgPx}
        height={s.svgPx}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0, display: 'block' }}
      >
        <circle
          cx="50" cy="50" r="44"
          stroke={c.mark}
          strokeWidth={s.cSW}
        />
        {/* Arch: left base → up left pillar → semicircular arch → down right pillar → right base */}
        <path
          d="M 22 77 L 31 77 L 31 49 A 19 19 0 0 0 69 49 L 69 77 L 78 77"
          stroke={c.mark}
          strokeWidth={s.mSW}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Wordmark */}
      {!iconOnly && (
        <span style={{ display: 'flex', flexDirection: 'column' }}>
          {/* "Truson" thin + "Shopp" heavy on one baseline */}
          <span style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
            <span style={{
              fontSize:      s.wmPx,
              fontWeight:    200,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color:         c.thin,
              fontFamily:    WM_FONT,
              lineHeight:    1,
            }}>
              Truson
            </span>
            <span style={{
              fontSize:      s.wmPx,
              fontWeight:    800,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              color:         c.bold,
              fontFamily:    WM_FONT,
              lineHeight:    1,
            }}>
              Shopp
            </span>
          </span>

          {/* "MALL" category tag */}
          <span style={{
            fontSize:      s.tagPx,
            fontWeight:    400,
            letterSpacing: '0.52em',
            textTransform: 'uppercase',
            color:         c.tag,
            fontFamily:    WM_FONT,
            lineHeight:    1,
            marginTop:     s.tagMt,
          }}>
            Mall
          </span>
        </span>
      )}
    </span>
  )
}
