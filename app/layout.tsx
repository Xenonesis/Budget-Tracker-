import './globals.css'
import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import { Inter } from 'next/font/google'

// Optimize font loading with display swap
const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap'
})

// Define viewport config separately
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#121212' }
  ],
  colorScheme: 'light dark'
}

// Improve metadata for better SEO and performance
export const metadata: Metadata = {
  title: 'Budget Tracker - Smart Financial Management',
  description: 'Take control of your finances with our intuitive budget tracking tool. Set budgets, track expenses, and visualize your financial journey.',
  applicationName: 'Budget Tracker',
  authors: [{ name: 'Budget Tracker Team' }],
  keywords: ['budget tracking', 'personal finance', 'expense management', 'money tracker', 'savings goals', 'financial dashboard'],
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://budget-tracker.com',
    title: 'Budget Tracker - Smart Financial Management',
    description: 'Take control of your finances with our intuitive budget tracking tool.',
    siteName: 'Budget Tracker',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Budget Tracker - Smart Financial Management',
    description: 'Take control of your finances with our intuitive budget tracking tool.',
    creator: '@budgettracker',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180' },
    ]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
} 