import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Supabase
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      then: jest.fn(),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        getPublicUrl: jest.fn(),
      })),
    },
  },
}))

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    button: ({ children, ...props }) => <button {...props}>{children}</button>,
    form: ({ children, ...props }) => <form {...props}>{children}</form>,
    input: ({ ...props }) => <input {...props} />,
    textarea: ({ children, ...props }) => <textarea {...props}>{children}</textarea>,
    label: ({ children, ...props }) => <label {...props}>{children}</label>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
    h4: ({ children, ...props }) => <h4 {...props}>{children}</h4>,
    h5: ({ children, ...props }) => <h5 {...props}>{children}</h5>,
    h6: ({ children, ...props }) => <h6 {...props}>{children}</h6>,
    ul: ({ children, ...props }) => <ul {...props}>{children}</ul>,
    li: ({ children, ...props }) => <li {...props}>{children}</li>,
    nav: ({ children, ...props }) => <nav {...props}>{children}</nav>,
    header: ({ children, ...props }) => <header {...props}>{children}</header>,
    footer: ({ children, ...props }) => <footer {...props}>{children}</footer>,
    main: ({ children, ...props }) => <main {...props}>{children}</main>,
    section: ({ children, ...props }) => <section {...props}>{children}</section>,
    article: ({ children, ...props }) => <article {...props}>{children}</article>,
    aside: ({ children, ...props }) => <aside {...props}>{children}</aside>,
    table: ({ children, ...props }) => <table {...props}>{children}</table>,
    thead: ({ children, ...props }) => <thead {...props}>{children}</thead>,
    tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
    tr: ({ children, ...props }) => <tr {...props}>{children}</tr>,
    th: ({ children, ...props }) => <th {...props}>{children}</th>,
    td: ({ children, ...props }) => <td {...props}>{children}</td>,
    img: ({ ...props }) => <img {...props} />,
    svg: ({ children, ...props }) => <svg {...props}>{children}</svg>,
    path: ({ ...props }) => <path {...props} />,
    circle: ({ ...props }) => <circle {...props} />,
    rect: ({ ...props }) => <rect {...props} />,
    line: ({ ...props }) => <line {...props} />,
    polyline: ({ ...props }) => <polyline {...props} />,
    polygon: ({ ...props }) => <polygon {...props} />,
    ellipse: ({ ...props }) => <ellipse {...props} />,
    g: ({ children, ...props }) => <g {...props}>{children}</g>,
    defs: ({ children, ...props }) => <defs {...props}>{children}</defs>,
    clipPath: ({ children, ...props }) => <clipPath {...props}>{children}</clipPath>,
    linearGradient: ({ children, ...props }) => <linearGradient {...props}>{children}</linearGradient>,
    radialGradient: ({ children, ...props }) => <radialGradient {...props}>{children}</radialGradient>,
    stop: ({ ...props }) => <stop {...props} />,
    pattern: ({ children, ...props }) => <pattern {...props}>{children}</pattern>,
    mask: ({ children, ...props }) => <mask {...props}>{children}</mask>,
    filter: ({ children, ...props }) => <filter {...props}>{children}</filter>,
    feGaussianBlur: ({ ...props }) => <feGaussianBlur {...props} />,
    feOffset: ({ ...props }) => <feOffset {...props} />,
    feComposite: ({ ...props }) => <feComposite {...props} />,
    feMerge: ({ children, ...props }) => <feMerge {...props}>{children}</feMerge>,
    feMergeNode: ({ ...props }) => <feMergeNode {...props} />,
    feColorMatrix: ({ ...props }) => <feColorMatrix {...props} />,
    feBlend: ({ ...props }) => <feBlend {...props} />,
    feConvolveMatrix: ({ ...props }) => <feConvolveMatrix {...props} />,
    feDisplacementMap: ({ ...props }) => <feDisplacementMap {...props} />,
    feFlood: ({ ...props }) => <feFlood {...props} />,
    feImage: ({ ...props }) => <feImage {...props} />,
    feMorphology: ({ ...props }) => <feMorphology {...props} />,
    feTile: ({ ...props }) => <feTile {...props} />,
    feTurbulence: ({ ...props }) => <feTurbulence {...props} />,
    feDistantLight: ({ ...props }) => <feDistantLight {...props} />,
    fePointLight: ({ ...props }) => <fePointLight {...props} />,
    feSpotLight: ({ ...props }) => <feSpotLight {...props} />,
    feFuncR: ({ ...props }) => <feFuncR {...props} />,
    feFuncG: ({ ...props }) => <feFuncG {...props} />,
    feFuncB: ({ ...props }) => <feFuncB {...props} />,
    feFuncA: ({ ...props }) => <feFuncA {...props} />,
    feComponentTransfer: ({ children, ...props }) => <feComponentTransfer {...props}>{children}</feComponentTransfer>,
    feDropShadow: ({ ...props }) => <feDropShadow {...props} />,
    feSpecularLighting: ({ children, ...props }) => <feSpecularLighting {...props}>{children}</feSpecularLighting>,
    feDiffuseLighting: ({ children, ...props }) => <feDiffuseLighting {...props}>{children}</feDiffuseLighting>,
    feDisplacementMap: ({ ...props }) => <feDisplacementMap {...props} />,
    feFlood: ({ ...props }) => <feFlood {...props} />,
    feImage: ({ ...props }) => <feImage {...props} />,
    feMorphology: ({ ...props }) => <feMorphology {...props} />,
    feTile: ({ ...props }) => <feTile {...props} />,
    feTurbulence: ({ ...props }) => <feTurbulence {...props} />,
    feDistantLight: ({ ...props }) => <feDistantLight {...props} />,
    fePointLight: ({ ...props }) => <fePointLight {...props} />,
    feSpotLight: ({ ...props }) => <feSpotLight {...props} />,
    feFuncR: ({ ...props }) => <feFuncR {...props} />,
    feFuncG: ({ ...props }) => <feFuncG {...props} />,
    feFuncB: ({ ...props }) => <feFuncB {...props} />,
    feFuncA: ({ ...props }) => <feFuncA {...props} />,
    feComponentTransfer: ({ children, ...props }) => <feComponentTransfer {...props}>{children}</feComponentTransfer>,
    feDropShadow: ({ ...props }) => <feDropShadow {...props} />,
    feSpecularLighting: ({ children, ...props }) => <feSpecularLighting {...props}>{children}</feSpecularLighting>,
    feDiffuseLighting: ({ children, ...props }) => <feDiffuseLighting {...props}>{children}</feDiffuseLighting>,
  },
  AnimatePresence: ({ children }) => children,
}))

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.KONTUR_ENI_API_KEY = 'test-kontur-key'
process.env.KONTUR_ENI_ORG_ID = 'test-org-id'

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

global.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
})) 