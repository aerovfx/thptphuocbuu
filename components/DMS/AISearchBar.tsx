'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Sparkles, X, Loader2, FileText, Inbox, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchResult {
  id: string
  title: string
  type: 'incoming' | 'outgoing' | 'general'
  documentNumber?: string | null
  summary?: string | null
  sender?: string | null
  recipient?: string | null
  score?: number
  status?: string
}

interface AISearchBarProps {
  onResultClick?: (result: SearchResult) => void
  placeholder?: string
  className?: string
}

export default function AISearchBar({
  onResultClick,
  placeholder = 'Tìm kiếm văn bản bằng AI...',
  className = '',
}: AISearchBarProps) {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const [searchType, setSearchType] = useState<'text' | 'semantic' | 'hybrid'>('hybrid')
  const searchRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const performSearch = async (searchQuery: string, type: 'text' | 'semantic' | 'hybrid' = 'hybrid') => {
    if (!searchQuery.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    setShowResults(true)

    try {
      // Try semantic search first if available
      if (type === 'semantic' || type === 'hybrid') {
        try {
          const semanticResponse = await fetch('/api/ai/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: searchQuery, type: 'hybrid' }),
          })

          if (semanticResponse.ok) {
            const semanticData = await semanticResponse.json()
            if (semanticData.results && semanticData.results.length > 0) {
              setResults(semanticData.results)
              setIsSearching(false)
              return
            }
          }
        } catch (error) {
          console.error('Semantic search error:', error)
          // Fall through to text search
        }
      }

      // Fallback to text search
      const textResponse = await fetch(`/api/dms/documents/search?q=${encodeURIComponent(searchQuery)}&searchType=text`)
      if (textResponse.ok) {
        const textData = await textResponse.json()
        const formattedResults: SearchResult[] = (textData.documents || []).map((doc: any) => ({
          id: doc.id,
          title: doc.title,
          type: 'incoming' as const,
          documentNumber: doc.documentNumber,
          summary: doc.summary,
          sender: doc.sender,
          score: 1.0,
          status: doc.status,
        }))
        setResults(formattedResults)
      }
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setShowResults(false)
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(query, searchType)
    }, 300)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchType])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
  }

  const handleResultClick = (result: SearchResult) => {
    if (onResultClick) {
      onResultClick(result)
    } else {
      // Default navigation
      if (result.type === 'incoming') {
        router.push(`/dashboard/dms/incoming/${result.id}`)
      } else if (result.type === 'outgoing') {
        router.push(`/dashboard/dms/outgoing/${result.id}`)
      } else {
        router.push(`/dashboard/documents`)
      }
    }
    setShowResults(false)
    setQuery('')
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incoming':
        return <Inbox className="w-4 h-4" />
      case 'outgoing':
        return <Send className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'incoming':
        return 'Văn bản đến'
      case 'outgoing':
        return 'Văn bản đi'
      default:
        return 'Tài liệu'
    }
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true)
            }
          }}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-poppins"
        />
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
          {query && (
            <button
              onClick={() => {
                setQuery('')
                setResults([])
                setShowResults(false)
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded text-xs text-blue-400">
            <Sparkles className="w-3 h-3" />
            <span>AI</span>
          </div>
        </div>
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute z-50 w-full mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-poppins">Đang tìm kiếm...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              <div className="px-4 py-2 border-b border-gray-800">
                <p className="text-xs text-gray-400 font-poppins">
                  Tìm thấy {results.length} kết quả
                </p>
              </div>
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-b-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-blue-400">
                      {getTypeIcon(result.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-white font-poppins truncate">
                          {result.title}
                        </h4>
                        <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300 font-poppins">
                          {getTypeLabel(result.type)}
                        </span>
                        {result.score && result.score < 1.0 && (
                          <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400 font-poppins">
                            {Math.round(result.score * 100)}% match
                          </span>
                        )}
                      </div>
                      {result.documentNumber && (
                        <p className="text-xs text-gray-400 mb-1 font-poppins">
                          Số: {result.documentNumber}
                        </p>
                      )}
                      {result.summary && (
                        <p className="text-xs text-gray-500 line-clamp-2 font-poppins">
                          {result.summary}
                        </p>
                      )}
                      {(result.sender || result.recipient) && (
                        <p className="text-xs text-gray-500 mt-1 font-poppins">
                          {result.sender ? `Từ: ${result.sender}` : `Đến: ${result.recipient}`}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="p-8 text-center">
              <FileText className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400 font-poppins">Không tìm thấy kết quả</p>
              <p className="text-xs text-gray-500 mt-1 font-poppins">
                Thử tìm kiếm với từ khóa khác
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

