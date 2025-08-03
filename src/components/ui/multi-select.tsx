import * as React from 'react'
import { X, ChevronDown } from 'lucide-react'
import { Badge } from './badge'
import { cn } from '../../lib/utils'

interface MultiSelectProps {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Auswählen...',
  disabled = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleSelectAll = () => {
    if (selected.length === options.length) {
      // Wenn alles schon ausgewählt: abwählen
      onChange([])
    } else {
      // Sonst alles auswählen
      onChange(options.map((opt) => opt.value))
    }
  }

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleUnselect = (value: string) => {
    onChange(selected.filter((item) => item !== value))
  }

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = options.filter(
    (option) => !selected.includes(option.value)
  )

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div
        className={cn(
          'group border border-gray-300 px-3 py-2 text-sm rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => !disabled && setOpen(!open)}
      >
        <div className='flex gap-1 flex-wrap min-h-[20px]'>
          {selected.map((selectedValue) => {
            const option = options.find((opt) => opt.value === selectedValue)
            return (
              <Badge
                key={selectedValue}
                variant='outline'
                className='rounded-sm px-1 font-normal'
              >
                {option?.label || selectedValue}
                <button
                  className='ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUnselect(selectedValue)
                  }}
                  disabled={disabled}
                >
                  <X className='h-3 w-3 text-muted-foreground hover:text-foreground' />
                </button>
              </Badge>
            )
          })}
          {selected.length === 0 && (
            <span className='text-gray-500'>{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform',
            open && 'rotate-180'
          )}
        />
      </div>

      {open && (
        <div className='absolute w-full z-10 top-full mt-1 rounded-md border border-gray-300 bg-white shadow-lg max-h-60 overflow-auto'>
          <div
            className='px-3 py-2 text-sm font-medium hover:bg-gray-100 cursor-pointer bg-gray-50 border-b'
            onClick={handleSelectAll}
          >
            {selected.length === options.length
              ? 'Alle abwählen'
              : 'Alle auswählen'}
          </div>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                className='px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer'
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </div>
            ))
          ) : (
            <div className='px-3 py-2 text-sm text-gray-500'>
              Keine weiteren Optionen verfügbar
            </div>
          )}
        </div>
      )}
    </div>
  )
}
