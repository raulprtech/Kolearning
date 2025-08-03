import * as React from "react"

export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
        <path d="M25 85V15H45V35L35 25L45 35V55L35 45L45 55V85H25Z" />
        <path d="M45 55L65 35L85 55L65 75L45 55Z" style={{ strokeWidth: 4 }}/>
        <path d="M65 35L80 20" style={{ strokeWidth: 4 }}/>
    </svg>
  )
}
