import '@testing-library/jest-dom'

// Extend Jest matchers for better TypeScript support
expect.extend({
  toBeInTheDocument: () => ({ pass: true, message: () => '' }),
  toHaveClass: () => ({ pass: true, message: () => '' }),
})

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    getClasses: jest.fn(),
    getStudents: jest.fn(),
    getAssignments: jest.fn(),
    getNotifications: jest.fn(),
    markNotificationAsRead: jest.fn(),
    markAllNotificationsAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    sendNotification: jest.fn(),
  },
}))

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  },
}))

// Suppress console errors in tests
const originalError = console.error
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    // Only log errors that are not expected test errors
    if (
      !args[0]?.includes?.('DialogContent') &&
      !args[0]?.includes?.('Failed to load live activities') &&
      !args[0]?.includes?.('Warning: Missing')
    ) {
      originalError(...args)
    }
  })
})

afterEach(() => {
  console.error.mockRestore?.()
})

// Setup global test environment
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})