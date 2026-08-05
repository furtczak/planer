type IconProps = { size?: number; className?: string }

function svgProps({ size = 20, className }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
    'aria-hidden': true,
  }
}

export const IconBack = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
)

export const IconChevron = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M9 5l7 7-7 7" />
  </svg>
)

export const IconCompose = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M5 19h4l9.5-9.5a2.1 2.1 0 0 0-3-3L6 16v3Z" />
    <path d="M14 6.5 17.5 10" />
  </svg>
)

export const IconMore = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <circle cx="5.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
)

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

export const IconMaps = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <rect x="3" y="9" width="7" height="6" rx="2" />
    <rect x="15" y="4" width="6" height="5" rx="2" />
    <rect x="15" y="15" width="6" height="5" rx="2" />
    <path d="M10 12h2.5a1.5 1.5 0 0 0 1.5-1.5v-4M10 12h2.5a1.5 1.5 0 0 1 1.5 1.5v4" />
  </svg>
)

export const IconNote = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <rect x="4" y="3" width="16" height="18" rx="3" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
)

export const IconClock = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
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

export const IconGrid = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <rect x="4" y="4" width="7" height="7" rx="2" />
    <rect x="13" y="4" width="7" height="7" rx="2" />
    <rect x="4" y="13" width="7" height="7" rx="2" />
    <rect x="13" y="13" width="7" height="7" rx="2" />
  </svg>
)

export const IconList = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
  </svg>
)

export const IconChild = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <rect x="3" y="9.5" width="6" height="5" rx="2" />
    <rect x="15" y="9.5" width="6" height="5" rx="2" />
    <path d="M9 12h6" />
    <path d="M18 6.5v2M18 15.5v2" />
  </svg>
)

export const IconSibling = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <rect x="4" y="3.5" width="16" height="5" rx="2" />
    <rect x="4" y="15" width="16" height="5" rx="2" />
    <path d="M12 10.5v3" />
  </svg>
)

export const IconPalette = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6 0-.7.6-1.2 1.4-1.2h1.3a4 4 0 0 0 4-4c0-4-3.4-7.5-7.5-7.5Z" />
    <circle cx="8" cy="10" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15.8" cy="10" r="1.1" fill="currentColor" stroke="none" />
  </svg>
)

export const IconCollapse = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M9 6 4.5 12 9 18M15 6l4.5 6-4.5 6" />
  </svg>
)

export const IconExpand = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M5 6l4.5 6L5 18M19 6l-4.5 6 4.5 6" />
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

export const IconPin = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M9 4h6l-1 6 3 3H7l3-3-1-6Z" />
    <path d="M12 13v7" />
  </svg>
)

export const IconImage = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <rect x="3.5" y="5" width="17" height="14" rx="3" />
    <circle cx="8.5" cy="10" r="1.5" />
    <path d="m4.5 17 4.2-4.2a2 2 0 0 1 2.8 0l2.2 2.2m0 0 1.6-1.6a2 2 0 0 1 2.8 0l1.4 1.4m-5.8.2 2 2" />
  </svg>
)

export const IconFit = (p: IconProps) => (
  <svg {...svgProps(p)}>
    <path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15" />
  </svg>
)
