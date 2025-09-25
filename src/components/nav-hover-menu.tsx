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

  // Popular categories with display name and search term mapping
  const popularCategories = [
    { display: 'Computer Science', search: 'Computer Science' },
    { display: 'Data Science', search: 'Data Science' },
    { display: 'Human-Computer Interaction', search: 'Human-Computer Interaction' },
    { display: 'Machine Learning', search: 'Machine Learning' }
  ]

  // Popular careers grouped by type
  const careersByType = [
    {
      type: 'Software Engineering',
      careers: [
        { display: 'Software Engineer', search: 'Software Engineer' },
        { display: 'Frontend Developer', search: 'Frontend' },
        { display: 'Backend Developer', search: 'Backend' }
      ]
    },
    {
      type: 'Data & Analytics',
      careers: [
        { display: 'Data Scientist', search: 'Data Scientist' },
        { display: 'Data Analyst', search: 'Data Analyst' }
      ]
    },
    {
      type: 'AI & Machine Learning',
      careers: [
        { display: 'ML Engineer', search: 'Machine Learning' },
        { display: 'AI Researcher', search: 'Research' }
      ]
    },
    {
      type: 'Product & Design',
      careers: [
        { display: 'Product Manager', search: 'Product Manager' },
        { display: 'UX Designer', search: 'Designer' }
      ]
    }
  ]

  return (
    <div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button asChild variant="ghost">
            <Link href={baseHref}>{label}</Link>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className={label === "Schools" ? "w-[300px]" : "w-[600px]"}>
          {label === "Schools" ? (
            /* Schools dropdown - only regions */
            <div className="p-2">
              <div className="px-2 py-1.5 text-sm font-semibold text-gray-800 bg-gray-100">
                By Region
              </div>
              <DropdownMenuItem asChild>
                <Link href={baseHref} className="text-primary font-semibold">
                  All Regions
                </Link>
              </DropdownMenuItem>
              {regions.map((region) => (
                <DropdownMenuItem key={region} asChild>
                  <Link href={`${baseHref}?search=${encodeURIComponent(region)}`}>
                    {region}
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
          ) : (
            /* Programs dropdown - full content */
            <div className="grid grid-cols-2 gap-0">
              {/* Left Column - Regions & Categories */}
              <div className="p-2 border-r border-gray-200">
                {/* By Region Section */}
                <div className="px-2 py-1.5 text-sm font-semibold text-gray-800 bg-gray-100">
                  By Region
                </div>
                <DropdownMenuItem asChild>
                  <Link href={baseHref} className="text-primary font-semibold">
                    All Regions
                  </Link>
                </DropdownMenuItem>
                {regions.map((region) => (
                  <DropdownMenuItem key={region} asChild>
                    <Link href={`${baseHref}?search=${encodeURIComponent(region)}`}>
                      {region}
                    </Link>
                  </DropdownMenuItem>
                ))}
                
                <div className="h-4"></div>
                
                {/* By Category Section */}
                <div className="px-2 py-1.5 text-sm font-semibold text-gray-800 bg-gray-100">
                  By Program Category
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/categories" className="text-primary font-semibold">
                    All Categories
                  </Link>
                </DropdownMenuItem>
                {popularCategories.map((category) => (
                  <DropdownMenuItem key={category.display} asChild>
                    <Link href={`/categories?search=${encodeURIComponent(category.search)}`}>
                      {category.display}
                    </Link>
                  </DropdownMenuItem>
                ))}
                
                <DropdownMenuItem asChild>
                  <Link href="/categories" className="pl-4 text-sm text-gray-500 hover:text-gray-700">
                    Other Categories
                  </Link>
                </DropdownMenuItem>
              </div>
              
              {/* Right Column - Careers */}
              <div className="p-2">
                {/* By Career Section */}
                <div className="px-2 py-1.5 text-sm font-semibold text-gray-800 bg-gray-100">
                  By Career Path
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/careers" className="text-primary font-semibold">
                    All Careers
                  </Link>
                </DropdownMenuItem>
                
                {careersByType.map((typeGroup) => (
                  <div key={typeGroup.type}>
                    <DropdownMenuItem asChild>
                      <Link href={`/careers?type=${encodeURIComponent(typeGroup.type.toLowerCase())}`} className="px-2 py-1 text-xs font-medium text-gray-600 uppercase tracking-wide bg-gray-50 hover:bg-gray-100">
                        {typeGroup.type}
                      </Link>
                    </DropdownMenuItem>
                    {typeGroup.careers.map((career) => (
                      <DropdownMenuItem key={career.display} asChild>
                        <Link href={`/careers?search=${encodeURIComponent(career.search)}`} className="pl-4">
                          {career.display}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                ))}
                
                <DropdownMenuItem asChild>
                  <Link href="/careers" className="pl-4 text-sm text-gray-500 hover:text-gray-700">
                    Other Careers
                  </Link>
                </DropdownMenuItem>
              </div>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}


