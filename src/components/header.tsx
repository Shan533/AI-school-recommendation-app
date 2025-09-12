'use client'

import Link from 'next/link'
import { NavigationClient } from './navigation-client'

export function Header() {
  return (
    <header className={`shrink-0 border-b bg-gray-50`}>
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          AI School Recommend
        </Link>
        <NavigationClient />
      </div>
    </header>
  )
}
