import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/explore',
          '/auth/login',
          '/auth/signup',
          '/guest',
          '/guest/textbook/*',
        ],
        disallow: [
          '/api/',
          '/student/',
          '/teacher/',
          '/auth/dashboard',
          '/auth/assignments',
          '/auth/progress',
          '/auth/textbooks',
          '/_next/',
          '/admin/',
          '/private/',
        ],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/explore',
          '/auth/login',
          '/auth/signup',
          '/guest',
          '/guest/textbook/*',
        ],
        disallow: [
          '/api/',
          '/student/',
          '/teacher/',
          '/auth/dashboard',
          '/auth/assignments',
          '/auth/progress',
          '/auth/textbooks',
          '/_next/',
          '/admin/',
          '/private/',
        ],
      },
      {
        userAgent: 'Bingbot',
        allow: [
          '/',
          '/explore',
          '/auth/login',
          '/auth/signup',
          '/guest',
          '/guest/textbook/*',
        ],
        disallow: [
          '/api/',
          '/student/',
          '/teacher/',
          '/auth/dashboard',
          '/auth/assignments',
          '/auth/progress',
          '/auth/textbooks',
          '/_next/',
          '/admin/',
          '/private/',
        ],
      },
    ],
    sitemap: 'https://digitalbook.kr/sitemap.xml',
    host: 'https://digitalbook.kr',
  }
}