'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type NavHoverMenuProps = {
  label: string
  baseHref: string
  regions: readonly string[]
}

export function NavHoverMenu({ label, baseHref, regions }: NavHoverMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button asChild variant="ghost">
            <Link href={baseHref}>{label}</Link>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {regions.map((r) => (
            <DropdownMenuItem key={r} asChild>
              <Link href={`${baseHref}?search=${encodeURIComponent(r)}`}>{r}</Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem asChild>
            <Link href={baseHref}>All Regions</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}


