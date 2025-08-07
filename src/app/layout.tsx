import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/providers'

export const metadata: Metadata = {
  title: {
    default: '국어 디지털 교과서 - AI 기반 맞춤형 학습 플랫폼',
    template: '%s | 국어 디지털 교과서'
  },
  description: 'AI 기반 맞춤형 국어 학습 플랫폼으로 학생과 교사를 위한 혁신적인 디지털 교육 솔루션을 제공합니다. 실시간 AI 튜터, 맞춤형 퀴즈, 협업 도구가 포함된 차세대 교육 플랫폼입니다.',
  keywords: [
    '국어',
    '디지털 교과서',
    'AI 학습',
    '맞춤형 교육',
    '한국어 교육',
    'e-learning',
    '온라인 학습',
    '교육 플랫폼',
    '학습 관리 시스템',
    'LMS',
    'AI 튜터',
    '교육 기술',
    'EdTech',
    '언어 학습',
    '한국어 문법',
    '독해',
    '작문',
    '문학',
    '학교 교육',
    '스마트 교육'
  ].join(', '),
  authors: [{ name: 'Digital Book Team', url: 'https://digitalbook.kr' }],
  creator: 'Digital Book Team',
  publisher: 'Digital Book Korea',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '디지털 교과서',
    startupImage: [
      {
        url: '/splash/launch-1668x2388.png',
        media: '(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
      },
      {
        url: '/splash/launch-1668x2224.png',
        media: '(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
      },
      {
        url: '/splash/launch-2048x2732.png',
        media: '(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)'
      }
    ]
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
  openGraph: {
    type: 'website',
    title: '국어 디지털 교과서 - AI 기반 맞춤형 학습 플랫폼',
    description: 'AI 기반 맞춤형 국어 학습 플랫폼으로 학생과 교사를 위한 혁신적인 디지털 교육 솔루션을 제공합니다.',
    siteName: '국어 디지털 교과서',
    locale: 'ko_KR',
    url: 'https://digitalbook.kr',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '국어 디지털 교과서 - AI 기반 학습 플랫폼',
        type: 'image/png',
      },
      {
        url: '/og-image-square.png',
        width: 1200,
        height: 1200,
        alt: '국어 디지털 교과서 로고',
        type: 'image/png',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@DigitalBookKR',
    creator: '@DigitalBookKR',
    title: '국어 디지털 교과서 - AI 기반 맞춤형 학습 플랫폼',
    description: 'AI 기반 맞춤형 국어 학습 플랫폼으로 학생과 교사를 위한 혁신적인 디지털 교육 솔루션을 제공합니다.',
    images: ['/twitter-image.png'],
  },
  category: 'education',
  classification: 'Educational Technology',
  other: {
    'mobile-web-app-capable': 'yes',
    'application-name': '국어 디지털 교과서',
    'msapplication-TileColor': '#6366f1',
    'msapplication-config': '/browserconfig.xml',
    'google-site-verification': process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  }
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin=""
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="디지털교과서" />
        <link rel="apple-touch-startup-image" href="/splash/launch-1668x2388.png" media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/launch-1668x2224.png" media="(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/launch-2048x2732.png" media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="canonical" href="https://digitalbook.kr" />
        <link rel="alternate" hrefLang="ko" href="https://digitalbook.kr" />
        <link rel="alternate" hrefLang="en" href="https://digitalbook.kr/en" />
        <link rel="alternate" hrefLang="x-default" href="https://digitalbook.kr" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "국어 디지털 교과서",
              "description": "AI 기반 맞춤형 국어 학습 플랫폼으로 학생과 교사를 위한 혁신적인 디지털 교육 솔루션을 제공합니다.",
              "url": "https://digitalbook.kr",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "All",
              "browserRequirements": "Requires JavaScript. Requires HTML5.",
              "softwareVersion": "1.0",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "reviewCount": "1250"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "KRW",
                "availability": "https://schema.org/InStock"
              },
              "author": {
                "@type": "Organization",
                "name": "Digital Book Team",
                "url": "https://digitalbook.kr"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Digital Book Korea",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://digitalbook.kr/logo.png"
                }
              },
              "screenshot": [
                "https://digitalbook.kr/screenshots/student-view.png",
                "https://digitalbook.kr/screenshots/teacher-dashboard.png"
              ],
              "featureList": [
                "AI 기반 맞춤형 학습",
                "실시간 AI 튜터",
                "협업 학습 도구",
                "진도 관리 시스템",
                "멀티미디어 콘텐츠",
                "오프라인 학습 지원"
              ]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Digital Book Korea",
              "url": "https://digitalbook.kr",
              "logo": "https://digitalbook.kr/logo.png",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+82-2-1234-5678",
                "contactType": "customer service",
                "availableLanguage": ["Korean", "English"]
              },
              "sameAs": [
                "https://www.facebook.com/DigitalBookKR",
                "https://twitter.com/DigitalBookKR",
                "https://www.linkedin.com/company/digitalbookkorea"
              ]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Course",
              "name": "AI 기반 국어 디지털 교과서 과정",
              "description": "인공지능을 활용한 맞춤형 국어 학습 과정",
              "provider": {
                "@type": "Organization",
                "name": "Digital Book Korea"
              },
              "educationalLevel": "초등학교, 중학교, 고등학교",
              "courseMode": "online",
              "hasCourseInstance": {
                "@type": "CourseInstance",
                "courseMode": "online",
                "instructor": {
                  "@type": "Person",
                  "name": "AI 튜터"
                }
              }
            })
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}