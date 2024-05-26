// app/providers.tsx
'use client'

import { NextUIProvider } from '@nextui-org/react'
import { ThemeProvider as NextThemesProvider, ThemeProvider } from 'next-themes'
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <ThemeProvider attribute='class' defaultTheme='dark'>
        <div className="w-screen h-screen">
          {children}
        </div>
      </ThemeProvider>
    </NextUIProvider>
  )
}