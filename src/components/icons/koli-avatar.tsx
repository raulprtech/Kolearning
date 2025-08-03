import * as React from "react"

export function KoliAvatar(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <radialGradient id="koli-gradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: "hsl(0 0% 100%)", stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: "hsl(var(--primary))", stopOpacity: 0.3 }} />
        </radialGradient>
        <filter id="koli-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
      </defs>
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="url(#koli-gradient)"
        filter="url(#koli-glow)"
      >
        <animate 
            attributeName="r" 
            values="40;42;40" 
            dur="3s" 
            repeatCount="indefinite" />
        <animate 
            attributeName="opacity" 
            values="1;0.8;1" 
            dur="3s" 
            repeatCount="indefinite" />
      </circle>
    </svg>
  )
}
