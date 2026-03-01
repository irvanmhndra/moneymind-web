import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Clock,
  Filter,
  X,
  ArrowRight,
  DollarSign,
  Calendar,
  Hash,
  Users,
  Target,
  CreditCard,
  Folder
} from 'lucide-react';
import { searchService } from '../../services/search';
import type { SearchResult, SearchFilters } from '../../services/search';
import { useDebounce } from '../../hooks/useDebounce';

interface SearchBoxProps {
  className?: string;
  placeholder?: string;
  onResultSelect?: (result: SearchResult) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  className = '',
  placeholder = 'Search expenses, categories, accounts...',
  onResultSelect
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const debouncedQuery = useDebounce(query, 300);

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await searchService.globalSearch(searchQuery, filters);
      setResults(searchResults);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Load suggestions
  const loadSuggestions = useCallback(async (searchQuery: string) => {
    try {
      const searchSuggestions = await searchService.getSearchSuggestions(searchQuery);
      setSuggestions(searchSuggestions);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      setSuggestions([]);
    }
  }, []);

  // Effect for debounced search
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
    }

    loadSuggestions(debouncedQuery);
  }, [debouncedQuery, performSearch, loadSuggestions]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);

    if (value.trim()) {
      setIsOpen(true);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setIsOpen(false);
    searchService.saveSearch(suggestion);
    performSearch(suggestion);
  };

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    searchService.saveSearch(query);

    if (onResultSelect) {
      onResultSelect(result);
    } else {
      navigate(result.url);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const allItems = [...suggestions, ...results];
    const maxIndex = allItems.length - 1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < maxIndex ? prev + 1 : 0));
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
        break;

      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (selectedIndex < suggestions.length) {
            handleSuggestionClick(suggestions[selectedIndex]);
          } else {
            const resultIndex = selectedIndex - suggestions.length;
            if (results[resultIndex]) {
              handleResultSelect(results[resultIndex]);
            }
          }
        } else if (query.trim()) {
          // Perform search on enter if no item is selected
          searchService.saveSearch(query);
          performSearch(query);
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'expense':
        return <DollarSign className="w-4 h-4" />;
      case 'category':
        return <Folder className="w-4 h-4" />;
      case 'account':
        return <CreditCard className="w-4 h-4" />;
      case 'budget':
        return <Target className="w-4 h-4" />;
      case 'goal':
        return <Target className="w-4 h-4" />;
      case 'split-expense':
        return <Users className="w-4 h-4" />;
      default:
        return <Hash className="w-4 h-4" />;
    }
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
        />

        {/* Clear and Filter buttons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 space-x-1">
          {query && (
            <button
              onClick={clearSearch}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1 rounded ${
              showFilters ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Dropdown */}
      {isOpen && (query || suggestions.length > 0 || results.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto">
          {/* Loading state */}
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          )}

          {/* Suggestions */}
          {!isLoading && suggestions.length > 0 && (
            <div className="border-b border-gray-100">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Suggestions
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full px-3 py-2 text-left flex items-center space-x-3 hover:bg-gray-50 ${
                    selectedIndex === index ? 'bg-blue-50' : ''
                  }`}
                >
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </button>
              ))}
            </div>
          )}

          {/* Search Results */}
          {!isLoading && results.length > 0 && (
            <div>
              <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Results ({results.length})
              </div>
              {results.map((result, index) => {
                const adjustedIndex = suggestions.length + index;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleResultSelect(result)}
                    className={`w-full px-3 py-3 text-left hover:bg-gray-50 ${
                      selectedIndex === adjustedIndex ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        style={{ backgroundColor: result.color }}
                      >
                        {result.icon || getTypeIcon(result.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {result.title}
                          </h4>
                          {result.amount && (
                            <span className="text-sm font-medium text-green-600">
                              {formatCurrency(result.amount, result.currency)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-xs text-gray-500 truncate">
                            {result.subtitle}
                          </p>
                          {result.date && (
                            <span className="text-xs text-gray-400 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(result.date)}
                            </span>
                          )}
                        </div>

                        {result.description && (
                          <p className="text-xs text-gray-400 truncate mt-1">
                            {result.description}
                          </p>
                        )}
                      </div>

                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* No results */}
          {!isLoading && query && suggestions.length === 0 && results.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm">No results found for "{query}"</p>
              <p className="text-xs text-gray-400 mt-1">
                Try searching for expenses, categories, or accounts
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !query && suggestions.length === 0 && results.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="text-sm">Start typing to search</p>
              <p className="text-xs text-gray-400 mt-1">
                Search expenses, categories, accounts, budgets, and goals
              </p>
            </div>
          )}
        </div>
      )}

      {/* Search Filters Panel */}
      {showFilters && (
        <div className="absolute z-40 w-full mt-12 bg-white border border-gray-200 rounded-md shadow-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Search Filters</h4>

          {/* Type Filters */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-700 mb-2 block">Types</label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'expense', label: 'Expenses' },
                { value: 'category', label: 'Categories' },
                { value: 'account', label: 'Accounts' },
                { value: 'budget', label: 'Budgets' },
                { value: 'goal', label: 'Goals' },
                { value: 'split-expense', label: 'Split Expenses' }
              ].map(type => (
                <label key={type.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={!filters.types || filters.types.includes(type.value)}
                    onChange={(e) => {
                      const currentTypes = filters.types || [];
                      if (e.target.checked) {
                        const newTypes = currentTypes.includes(type.value)
                          ? currentTypes
                          : [...currentTypes, type.value];
                        setFilters(prev => ({ ...prev, types: newTypes }));
                      } else {
                        const newTypes = currentTypes.filter(t => t !== type.value);
                        setFilters(prev => ({ ...prev, types: newTypes.length > 0 ? newTypes : undefined }));
                      }
                    }}
                    className="mr-1 text-blue-600"
                  />
                  <span className="text-xs text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                setFilters({});
                setShowFilters(false);
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear filters
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBox;