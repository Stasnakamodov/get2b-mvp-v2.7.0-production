'use client'

import { useState, useEffect } from 'react'
import { DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface PriceFilterPopoverProps {
  minPrice?: number
  maxPrice?: number
  onApply: (min?: number, max?: number) => void
}

export function PriceFilterPopover({ minPrice, maxPrice, onApply }: PriceFilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const [min, setMin] = useState(minPrice?.toString() || '')
  const [max, setMax] = useState(maxPrice?.toString() || '')

  useEffect(() => {
    setMin(minPrice?.toString() || '')
    setMax(maxPrice?.toString() || '')
  }, [minPrice, maxPrice])

  const isActive = minPrice !== undefined || maxPrice !== undefined

  const handleApply = () => {
    const minVal = min ? Number(min) : undefined
    const maxVal = max ? Number(max) : undefined
    onApply(minVal, maxVal)
    setOpen(false)
  }

  const handleReset = () => {
    setMin('')
    setMax('')
    onApply(undefined, undefined)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={isActive ? 'default' : 'outline'}
          size="sm"
          className={`h-9 rounded-xl text-xs shrink-0 ${isActive ? 'bg-gray-900 hover:bg-gray-800 text-white' : ''}`}
        >
          <DollarSign className="h-3.5 w-3.5 mr-1" />
          Цена
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="start">
        <div className="space-y-3">
          <p className="text-sm font-medium">Диапазон цен</p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="От"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              className="h-8 text-sm"
              min={0}
            />
            <span className="text-gray-400 text-sm">—</span>
            <Input
              type="number"
              placeholder="До"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              className="h-8 text-sm"
              min={0}
            />
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'до 1 000', min: undefined, max: 1000 },
              { label: '1-5 тыс', min: 1000, max: 5000 },
              { label: '5-20 тыс', min: 5000, max: 20000 },
              { label: '20+ тыс', min: 20000, max: undefined },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setMin(preset.min?.toString() || '')
                  setMax(preset.max?.toString() || '')
                }}
                className="px-2.5 py-1 text-xs rounded-full border border-gray-200 shadow-sm hover:border-gray-400 hover:bg-gray-50 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            {isActive && (
              <Button variant="ghost" size="sm" className="h-8 text-xs flex-1" onClick={handleReset}>
                Сбросить
              </Button>
            )}
            <Button size="sm" className="h-8 text-xs flex-1 bg-gray-900 text-white hover:bg-gray-800" onClick={handleApply}>
              Применить
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default PriceFilterPopover
