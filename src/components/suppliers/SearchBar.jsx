/**
 * Search Bar Component
 * Search input with autocomplete functionality
 */

import React, { useState, useEffect, useRef } from 'react'
import '../../styles/SearchBar.css'

function SearchBar({ query, onQueryChange, onSearch, placeholder }) {
  const [inputValue, setInputValue] = useState(query)
  const debounceTimer = useRef(null)

  useEffect(() => {
    setInputValue(query)
  }, [query])

  /**
   * Handle input change (no automatic search, only on Enter)
   */
  const handleChange = (e) => {
    const value = e.target.value
    setInputValue(value)
    // Update query state immediately but don't trigger search
    onQueryChange(value)
  }

  /**
   * Handle form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault()
    onQueryChange(inputValue)
    if (onSearch) {
      onSearch()
    }
  }

  /**
   * Clear search
   */
  const handleClear = () => {
    setInputValue('')
    onQueryChange('')
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <div className="search-bar-wrapper">
        <span className="search-icon" aria-hidden="true">🔍</span>
        <input
          type="search"
          className="search-input"
          value={inputValue}
          onChange={handleChange}
          placeholder={placeholder || 'Suchen...'}
          aria-label="Suche nach Lieferanten"
        />
        {inputValue && (
          <button
            type="button"
            className="search-clear"
            onClick={handleClear}
            aria-label="Suche löschen"
          >
            ✕
          </button>
        )}
      </div>
    </form>
  )
}

export default SearchBar
