import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const defaults = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const SearchIcon = (props: IconProps) => (
  <svg {...defaults} {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </svg>
)

export const LayersIcon = (props: IconProps) => (
  <svg {...defaults} {...props}>
    <path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z" />
    <path d="m4 12 8 4.5 8-4.5M4 16.5l8 4.5 8-4.5" />
  </svg>
)

export const ResetIcon = (props: IconProps) => (
  <svg {...defaults} {...props}>
    <path d="M4.7 9A8 8 0 1 1 5 16" />
    <path d="M4 4v5h5" />
  </svg>
)

export const PlusIcon = (props: IconProps) => (
  <svg {...defaults} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const MinusIcon = (props: IconProps) => (
  <svg {...defaults} {...props}>
    <path d="M5 12h14" />
  </svg>
)

export const CloseIcon = (props: IconProps) => (
  <svg {...defaults} {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
)

export const ChevronRightIcon = (props: IconProps) => (
  <svg {...defaults} {...props}>
    <path d="m9 5 7 7-7 7" />
  </svg>
)

export const InfoIcon = (props: IconProps) => (
  <svg {...defaults} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7h.01" />
  </svg>
)

export const Model3DIcon = (props: IconProps) => <svg {...defaults} {...props}><path d="m12 3 9 5v8l-9 5-9-5V8l9-5ZM3 8l9 5 9-5M12 13v8" /></svg>
export const Model2DIcon = (props: IconProps) => <svg {...defaults} {...props}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="m7 15 3-4 3 2 4-6" /></svg>
export const FullscreenIcon = ({ expanded, ...props }: IconProps & { expanded?: boolean }) => <svg {...defaults} {...props}><path d={expanded ? 'M9 3v6H3m18 0h-6V3M3 15h6v6m6 0v-6h6' : 'M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6'} /></svg>
export const ViewSettingsIcon = (props: IconProps) => <svg {...defaults} {...props}><path d="M4 7h16M4 17h16M9 4v6m6 4v6" /></svg>
export const PlayIcon = (props: IconProps) => <svg {...defaults} {...props}><path d="m8 5 11 7-11 7Z" /></svg>
export const PauseIcon = (props: IconProps) => <svg {...defaults} {...props}><path d="M8 5v14M16 5v14" /></svg>
export const PreviousIcon = (props: IconProps) => <svg {...defaults} {...props}><path d="M5 5v14m14-14L8 12l11 7Z" /></svg>
export const NextIcon = (props: IconProps) => <svg {...defaults} {...props}><path d="M19 5v14M5 5l11 7-11 7Z" /></svg>
export const StepsIcon = (props: IconProps) => <svg {...defaults} {...props}><path d="M10 6h10M10 12h10M10 18h10" /><text x="3" y="8" fill="currentColor" stroke="none" fontSize="7">1</text><text x="3" y="14" fill="currentColor" stroke="none" fontSize="7">2</text><text x="3" y="20" fill="currentColor" stroke="none" fontSize="7">3</text></svg>
export const BookIcon = (props: IconProps) => <svg {...defaults} {...props}><path d="M12 6c-3-3-7-3-9-2v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 2Zm0 0v14" /></svg>
export const RotatePhoneIcon = (props: IconProps) => <svg {...defaults} {...props}><rect x="6" y="2" width="12" height="20" rx="2" /><path d="M2 7V3h4m16 14v4h-4M2 3l4 4m16 14-4-4" /></svg>

export const ConnectionsIcon = (props: IconProps) => <svg {...defaults} {...props}><circle cx="5" cy="12" r="2.5" /><circle cx="18" cy="5" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m7 11 8.5-5M7 13l8.5 5" /></svg>

export const BrainMark = (props: IconProps) => (
  <svg {...defaults} viewBox="0 0 32 32" {...props}>
    <path d="M11.8 5.2a5 5 0 0 0-5 5 4.7 4.7 0 0 0-2 7.6 4.5 4.5 0 0 0 4.5 6.8c.8 1.6 2.5 2.7 4.4 2.7 1 0 1.8-.3 2.3-.8.6.5 1.4.8 2.3.8 2 0 3.7-1.1 4.5-2.8a4.5 4.5 0 0 0 4.4-6.7 4.7 4.7 0 0 0-2-7.6 5 5 0 0 0-8-4 5 5 0 0 0-5.4-1Z" />
    <path d="M16 6.3v20M10.5 10.5c2.2 0 3.7 1.4 3.7 3.2M21.5 10.5c-2.2 0-3.7 1.4-3.7 3.2M8.8 18c2-.6 4 .2 4.8 1.8M23.2 18c-2-.6-4 .2-4.8 1.8" />
  </svg>
)
