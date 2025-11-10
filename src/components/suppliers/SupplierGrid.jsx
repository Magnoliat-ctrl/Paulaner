/**
 * Supplier Grid Component
 * Displays suppliers in a card grid layout
 */

import React from 'react'
import SupplierCard from './SupplierCard'
import '../../styles/SupplierGrid.css'

function SupplierGrid({ suppliers, navigateTo, emptyMessage }) {
  if (!suppliers || suppliers.length === 0) {
    return (
      <div className="supplier-grid-empty">
        <div className="empty-state">
          <span className="empty-icon" aria-hidden="true">📭</span>
          <p className="empty-message">{emptyMessage || 'Keine Lieferanten gefunden'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="supplier-grid">
      {suppliers.map(supplier => (
        <SupplierCard
          key={supplier.id}
          supplier={supplier}
          onClick={() => navigateTo('profile', { supplierId: supplier.id })}
        />
      ))}
    </div>
  )
}

export default SupplierGrid
