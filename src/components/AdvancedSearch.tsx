'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Filter, X, History, TrendingUp, Book, User, FileText, Calendar, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useDebounce } from '@/hooks/useDebounce'
import { useAccessibility } from './AccessibilityProvider'

interface SearchFilters {
  contentType: string[]
  subject: string[]
  difficulty: string[]
  dateRange: string
  author: string[]
  tags: string[]
  rating: number
  hasAI: boolean
  hasMultimedia: boolean
}

interface SearchSuggestion {
  id: string
  text: string
  type: 'query' | 'content' | 'author' | 'tag'
  metadata?: {
    resultCount?: number
    category?: string
    popularity?: number
  }
}

interface SearchResult {
  id: string
  title: string
  type: 'textbook' | 'assignment' | 'quiz' | 'note'
  description: string
  author: string
  subject: string
  difficulty: string
  rating: number
  tags: string[]
  createdAt: Date
  thumbnail?: string
  hasAI: boolean
  hasMultimedia: boolean
}

const defaultFilters: SearchFilters = {
  contentType: [],
  subject: [],
  difficulty: [],
  dateRange: 'all',
  author: [],
  tags: [],
  rating: 0,
  hasAI: false,
  hasMultimedia: false,
}

const contentTypes = [
  { value: 'textbook', label: '교과서', icon: Book },
  { value: 'assignment', label: '과제', icon: FileText },
  { value: 'quiz', label: '퀴즈', icon: Star },
  { value: 'note', label: '노트', icon: FileText },
]

const subjects = [
  '국어', '수학', '영어', '과학', '사회', '역사', '지리', '음악', '미술', '체육'
]

const difficulties = [
  { value: 'beginner', label: '초급' },
  { value: 'intermediate', label: '중급' },
  { value: 'advanced', label: '고급' },
]

export function AdvancedSearch({ onSearch, className }: {
  onSearch?: (query: string, filters: SearchFilters) => void
  className?: string
}) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  
  const debouncedQuery = useDebounce(query, 300)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  
  const { announceToScreenReader } = useAccessibility()

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent-searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to parse recent searches:', error)
      }
    }
  }, [])

  // Save recent searches to localStorage
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10)
    setRecentSearches(updated)
    localStorage.setItem('recent-searches', JSON.stringify(updated))
  }

  // Fetch suggestions based on query
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      fetchSuggestions(debouncedQuery)
    } else {
      setSuggestions([])
    }
  }, [debouncedQuery])

  const fetchSuggestions = async (searchQuery: string) => {
    try {
      // Mock API call - replace with actual API
      const mockSuggestions: SearchSuggestion[] = [
        {
          id: '1',
          text: `${searchQuery} 관련 교과서`,
          type: 'content',
          metadata: { resultCount: 15, category: '교과서' }
        },
        {
          id: '2',
          text: `${searchQuery} 문법`,
          type: 'query',
          metadata: { popularity: 89 }
        },
        {
          id: '3',
          text: `${searchQuery} 작가`,
          type: 'author',
          metadata: { resultCount: 3 }
        },
        {
          id: '4',
          text: `#${searchQuery}`,
          type: 'tag',
          metadata: { resultCount: 8 }
        },
      ]
      
      setSuggestions(mockSuggestions)
      
      // Announce to screen reader
      announceToScreenReader(
        `${mockSuggestions.length}개의 검색 제안이 표시되었습니다. 화살표 키로 탐색하세요.`
      )
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
      setSuggestions([])
    }
  }

  const handleSearch = useCallback((searchQuery?: string, searchFilters?: SearchFilters) => {
    const finalQuery = searchQuery || query
    const finalFilters = searchFilters || filters
    
    if (!finalQuery.trim()) return
    
    saveRecentSearch(finalQuery)
    setIsSuggestionsOpen(false)
    
    onSearch?.(finalQuery, finalFilters)
    
    announceToScreenReader(`"${finalQuery}"에 대한 검색을 실행합니다.`)
  }, [query, filters, onSearch, announceToScreenReader])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isSuggestionsOpen || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch()
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveSuggestionIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (activeSuggestionIndex >= 0) {
          const suggestion = suggestions[activeSuggestionIndex]
          handleSuggestionSelect(suggestion)
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setIsSuggestionsOpen(false)
        setActiveSuggestionIndex(-1)
        break
    }
  }

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    handleSearch(suggestion.text)
  }

  const updateFilter = <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K]
  ) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    
    // Auto-search when filters change if there's a query
    if (query.trim()) {
      handleSearch(query, newFilters)
    }
  }

  const clearAllFilters = () => {
    setFilters(defaultFilters)
    announceToScreenReader('모든 필터가 초기화되었습니다.')
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.contentType.length > 0) count++
    if (filters.subject.length > 0) count++
    if (filters.difficulty.length > 0) count++
    if (filters.dateRange !== 'all') count++
    if (filters.author.length > 0) count++
    if (filters.tags.length > 0) count++
    if (filters.rating > 0) count++
    if (filters.hasAI) count++
    if (filters.hasMultimedia) count++
    return count
  }

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'content': return Book
      case 'author': return User
      case 'tag': return Star
      default: return Search
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Main Search Input */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="교과서, 과제, 퀴즈 검색..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsSuggestionsOpen(true)
              setActiveSuggestionIndex(-1)
            }}
            onFocus={() => setIsSuggestionsOpen(true)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-20"
            aria-label="검색어 입력"
            aria-expanded={isSuggestionsOpen}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            aria-describedby="search-help"
            role="combobox"
          />
          
          {/* Filter Button */}
          <div className="absolute right-2 flex items-center gap-1">
            <Dialog open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2"
                  aria-label={`검색 필터 ${getActiveFiltersCount() > 0 ? `(${getActiveFiltersCount()}개 적용됨)` : ''}`}
                >
                  <Filter className="h-4 w-4" />
                  {getActiveFiltersCount() > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 text-xs">
                      {getActiveFiltersCount()}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>검색 필터</DialogTitle>
                  <DialogDescription>
                    원하는 조건으로 검색 결과를 필터링하세요
                  </DialogDescription>
                </DialogHeader>
                
                <SearchFilters 
                  filters={filters} 
                  onFilterChange={updateFilter}
                  onClearAll={clearAllFilters}
                />
              </DialogContent>
            </Dialog>
            
            <Button
              onClick={() => handleSearch()}
              size="sm"
              className="h-8 px-3"
              disabled={!query.trim()}
            >
              검색
            </Button>
          </div>
        </div>
        
        <div id="search-help" className="sr-only">
          검색어를 입력하고 엔터를 누르거나 검색 버튼을 클릭하세요. 
          필터 버튼으로 검색 옵션을 설정할 수 있습니다.
        </div>
      </div>

      {/* Search Suggestions */}
      {isSuggestionsOpen && (query || recentSearches.length > 0) && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {/* Recent Searches */}
            {!query && recentSearches.length > 0 && (
              <div className="p-3 border-b">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <History className="h-4 w-4" />
                  최근 검색어
                </div>
                <div className="space-y-1">
                  {recentSearches.slice(0, 5).map((search, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-2 py-1 text-sm hover:bg-accent rounded-sm"
                      onClick={() => {
                        setQuery(search)
                        handleSearch(search)
                      }}
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                role="listbox"
                aria-label="검색 제안"
              >
                {suggestions.map((suggestion, index) => {
                  const Icon = getSuggestionIcon(suggestion.type)
                  const isActive = index === activeSuggestionIndex
                  
                  return (
                    <button
                      key={suggestion.id}
                      role="option"
                      aria-selected={isActive}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent ${
                        isActive ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {suggestion.text}
                        </div>
                        {suggestion.metadata && (
                          <div className="text-xs text-muted-foreground">
                            {suggestion.metadata.resultCount && 
                              `${suggestion.metadata.resultCount}개 결과`}
                            {suggestion.metadata.category && 
                              ` • ${suggestion.metadata.category}`}
                          </div>
                        )}
                      </div>
                      {suggestion.metadata?.popularity && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="h-3 w-3" />
                          {suggestion.metadata.popularity}%
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* No results */}
            {query && suggestions.length === 0 && (
              <div className="p-3 text-center text-sm text-muted-foreground">
                검색 제안이 없습니다
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Active Filters Display */}
      {getActiveFiltersCount() > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {filters.contentType.map(type => (
            <Badge key={type} variant="secondary" className="gap-1">
              {contentTypes.find(ct => ct.value === type)?.label}
              <button
                onClick={() => updateFilter('contentType', 
                  filters.contentType.filter(t => t !== type)
                )}
                className="ml-1 hover:bg-destructive/20 rounded-full"
                aria-label={`${type} 필터 제거`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {filters.subject.map(subject => (
            <Badge key={subject} variant="secondary" className="gap-1">
              {subject}
              <button
                onClick={() => updateFilter('subject', 
                  filters.subject.filter(s => s !== subject)
                )}
                className="ml-1 hover:bg-destructive/20 rounded-full"
                aria-label={`${subject} 필터 제거`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {getActiveFiltersCount() > 2 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 px-2 text-xs"
            >
              모든 필터 제거
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

// Search Filters Component
function SearchFilters({ 
  filters, 
  onFilterChange, 
  onClearAll 
}: {
  filters: SearchFilters
  onFilterChange: <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => void
  onClearAll: () => void
}) {
  return (
    <div className="space-y-6">
      {/* Content Type */}
      <div>
        <h3 className="font-medium mb-3">콘텐츠 유형</h3>
        <div className="grid grid-cols-2 gap-2">
          {contentTypes.map(type => {
            const Icon = type.icon
            return (
              <label
                key={type.value}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <Checkbox
                  checked={filters.contentType.includes(type.value)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onFilterChange('contentType', [...filters.contentType, type.value])
                    } else {
                      onFilterChange('contentType', filters.contentType.filter(t => t !== type.value))
                    }
                  }}
                />
                <Icon className="h-4 w-4" />
                <span className="text-sm">{type.label}</span>
              </label>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Subject */}
      <div>
        <h3 className="font-medium mb-3">과목</h3>
        <div className="grid grid-cols-3 gap-2">
          {subjects.map(subject => (
            <label
              key={subject}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <Checkbox
                checked={filters.subject.includes(subject)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onFilterChange('subject', [...filters.subject, subject])
                  } else {
                    onFilterChange('subject', filters.subject.filter(s => s !== subject))
                  }
                }}
              />
              <span className="text-sm">{subject}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Difficulty */}
      <div>
        <h3 className="font-medium mb-3">난이도</h3>
        <div className="grid grid-cols-3 gap-2">
          {difficulties.map(difficulty => (
            <label
              key={difficulty.value}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <Checkbox
                checked={filters.difficulty.includes(difficulty.value)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onFilterChange('difficulty', [...filters.difficulty, difficulty.value])
                  } else {
                    onFilterChange('difficulty', filters.difficulty.filter(d => d !== difficulty.value))
                  }
                }}
              />
              <span className="text-sm">{difficulty.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Separator />

      {/* Date Range */}
      <div>
        <h3 className="font-medium mb-3">생성일</h3>
        <Select
          value={filters.dateRange}
          onValueChange={(value) => onFilterChange('dateRange', value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="today">오늘</SelectItem>
            <SelectItem value="week">이번 주</SelectItem>
            <SelectItem value="month">이번 달</SelectItem>
            <SelectItem value="year">올해</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Features */}
      <div>
        <h3 className="font-medium mb-3">기능</h3>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={filters.hasAI}
              onCheckedChange={(checked) => onFilterChange('hasAI', Boolean(checked))}
            />
            <span className="text-sm">AI 기능 포함</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <Checkbox
              checked={filters.hasMultimedia}
              onCheckedChange={(checked) => onFilterChange('hasMultimedia', Boolean(checked))}
            />
            <span className="text-sm">멀티미디어 콘텐츠</span>
          </label>
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClearAll}>
          필터 초기화
        </Button>
      </div>
    </div>
  )
}