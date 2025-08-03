import * as React from "react"

export function KoliAvatar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <radialGradient id="koli-gradient" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
          <stop offset="0%" style={{ stopColor: "hsl(var(--primary-foreground))", stopOpacity: 0.8 }} />
          <stop offset="20%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 1 }} />
          <stop offset="80%" style={{ stopColor: "hsl(var(--accent))", stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 1 }} />
        </radialGradient>
        <filter id="koli-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
        </filter>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="url(#koli-gradient)"
        filter="url(#koli-glow)"
      />
    </svg>
  )
}
