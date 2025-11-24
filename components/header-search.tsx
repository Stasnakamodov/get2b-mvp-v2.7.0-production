'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface HeaderSearchProps {
  onSearch?: (query: string) => void
  placeholder?: string
}

export function HeaderSearch({
  onSearch,
  placeholder = 'Поиск по каталогу...'
}: HeaderSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      onSearch?.(searchQuery)
    }
  }

  const handleClear = () => {
    setSearchQuery('')
    setIsOpen(false)
  }

  return (
    <div ref={searchRef} className="relative">
      {!isOpen ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="text-gray-300 hover:text-white hover:bg-white/10"
        >
          <Search className="h-4 w-4" />
        </Button>
      ) : (
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              autoFocus
              className="w-64 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:bg-white/20"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            className="text-gray-300 hover:text-white hover:bg-white/10"
          >
            Найти
          </Button>
        </form>
      )}
    </div>
  )
}
