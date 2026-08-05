type IconProps = { size?: number; className?: string }

function svgProps({ size = 18, className }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  }
}

export const IconSearch = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

export const IconPlus = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
)

export const IconPin = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M9 4h6l-1 6 3 3H7l3-3-1-6Z" />
    <path d="M12 13v7" />
  </svg>
)

export const IconArchive = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <rect x="3" y="4" width="18" height="4" rx="1" />
    <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
    <path d="M10 12h4" />
  </svg>
)

export const IconTrash = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M4 7h16M10 11v6M14 11v6" />
    <path d="M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)

export const IconRestore = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M4 12a8 8 0 1 0 2.5-5.8" />
    <path d="M4 4v5h5" />
  </svg>
)

export const IconFolder = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M3 7a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7Z" />
  </svg>
)

export const IconNotes = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
)

export const IconGrid = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <rect x="4" y="4" width="7" height="7" rx="1" />
    <rect x="13" y="4" width="7" height="7" rx="1" />
    <rect x="4" y="13" width="7" height="7" rx="1" />
    <rect x="13" y="13" width="7" height="7" rx="1" />
  </svg>
)

export const IconList = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
  </svg>
)

export const IconMap = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <circle cx="12" cy="12" r="3" />
    <circle cx="5" cy="6" r="2" />
    <circle cx="19" cy="7" r="2" />
    <circle cx="18" cy="18" r="2" />
    <path d="M10 10 6.5 7.5M14 11l3-2.5M14 14l2.7 2.7" />
  </svg>
)

export const IconSun = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
)

export const IconMoon = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </svg>
)

export const IconClose = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
)

export const IconCheck = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="m5 13 4 4 10-10" />
  </svg>
)

export const IconTag = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M4 12V5a1 1 0 0 1 1-1h7l8 8-8 8-8-8Z" />
    <circle cx="8.5" cy="8.5" r="1.2" />
  </svg>
)

export const IconDownload = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M12 4v11M8 11l4 4 4-4" />
    <path d="M5 19h14" />
  </svg>
)

export const IconUpload = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M12 20V9M8 12l4-4 4 4" />
    <path d="M5 5h14" />
  </svg>
)

export const IconMenu = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
)

export const IconSparkles = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
    <path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
  </svg>
)
