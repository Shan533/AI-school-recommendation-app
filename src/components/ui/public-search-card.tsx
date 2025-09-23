'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

interface PublicSearchCardProps {
  placeholder?: string
  helpText?: string
  searchParam?: string // URL parameter name, defaults to 'search'
  onSearch?: (searchTerm: string) => void // Callback for search term changes
}

export function PublicSearchCard({ 
  placeholder = "Search...", 
  helpText = "Enter search terms to filter results",
  searchParam = 'search',
  onSearch
}: PublicSearchCardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSearch = searchParams.get(searchParam) || ''
  const [searchValue, setSearchValue] = useState(currentSearch)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (onSearch) {
        onSearch(searchValue.trim())
      } else {
        const params = new URLSearchParams(searchParams.toString())
        
        if (searchValue.trim()) {
          params.set(searchParam, searchValue.trim())
        } else {
          params.delete(searchParam)
        }
        
        router.push(`?${params.toString()}`)
      }
    } catch (error) {
      console.error('Search navigation error:', error)
    }
  }

  const handleClear = () => {
    if (onSearch) {
      onSearch('')
    } else {
      const params = new URLSearchParams(searchParams.toString())
      params.delete(searchParam)
      setSearchValue('')
      router.push(`?${params.toString()}`)
    }
  }

  return (
    <Card className="mb-6 border-0 shadow-none">
      <CardContent className="px-0 py-0">
        <form onSubmit={handleSearch} className="flex gap-3 items-end">
          <div className="flex-1">
            <Label htmlFor="search"></Label>
            <Input
              id="search"
              name="search"
              placeholder={placeholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="mt-1"
              title={helpText} // Show help text as tooltip
            />
          </div>
          <Button type="submit">Search</Button>
          {currentSearch && (
            <Button type="button" variant="outline" onClick={handleClear}>
              Clear
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
