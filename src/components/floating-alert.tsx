'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type FloatingAlertProps = {
  title?: string
  description?: string
  durationMs?: number
  clearUrl?: string
}

export function FloatingAlert({ title = 'Welcome back! 🎉', description, durationMs = 3000, clearUrl = '/' }: FloatingAlertProps) {
  const [visible, setVisible] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => router.replace(clearUrl), 300)
    }, durationMs)
    return () => clearTimeout(timer)
  }, [durationMs, router, clearUrl])

  if (!visible) return null

  return (
    <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md">
      <Alert variant="success" className="shadow-lg transition-opacity duration-300">
        {title && <AlertTitle>{title}</AlertTitle>}
        {description && <AlertDescription>{description}</AlertDescription>}
      </Alert>
    </div>
  )
}


