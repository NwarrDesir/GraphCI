'use client';

import { useState } from 'react';
import { Filters as FiltersType, PRODUCTS, CITIES } from '@/lib/types';
import { FaFilter, FaTimes } from 'react-icons/fa';

interface FiltersProps {
  filters: FiltersType;
  onChange: (filters: FiltersType) => void;
}

export default function Filters({ filters, onChange }: FiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed top-16 left-4 z-40">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition flex items-center space-x-2"
      >
        <FaFilter />
        <span>Filtres</span>
      </button>

      {/* Filters panel */}
      {isOpen && (
        <div className="mt-2 glass rounded-lg p-4 w-64 space-y-4 animate-slideUp">
          {/* Ville */}
          <div>
            <label className="block text-sm font-medium mb-2">Ville</label>
            <select
              value={filters.city || ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  city: e.target.value || undefined,
                })
              }
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-white/40"
            >
              <option value="">Toutes les villes</option>
              {CITIES.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* Produit */}
          <div>
            <label className="block text-sm font-medium mb-2">Produit</label>
            <select
              value={filters.product || ''}
              onChange={(e) =>
                onChange({
                  ...filters,
                  product: (e.target.value as any) || undefined,
                })
              }
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-white/40"
            >
              <option value="">Tous les produits</option>
              {PRODUCTS.map((product) => (
                <option key={product} value={product}>
                  {product.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Période */}
          <div>
            <label className="block text-sm font-medium mb-2">Période</label>
            <select
              onChange={(e) => {
                const value = e.target.value;
                if (!value) {
                  onChange({ ...filters, dateRange: undefined });
                  return;
                }

                const end = new Date();
                const start = new Date();
                
                if (value === '7') {
                  start.setDate(start.getDate() - 7);
                } else if (value === '30') {
                  start.setDate(start.getDate() - 30);
                } else if (value === '90') {
                  start.setDate(start.getDate() - 90);
                }

                onChange({
                  ...filters,
                  dateRange: { start, end },
                });
              }}
              className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-sm focus:outline-none focus:border-white/40"
            >
              <option value="">Toute la période</option>
              <option value="7">7 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="90">3 derniers mois</option>
            </select>
          </div>

          {/* Reset */}
          <button
            onClick={() =>
              onChange({
                city: undefined,
                product: undefined,
                dateRange: undefined,
              })
            }
            className="w-full px-3 py-2 text-sm border border-white/20 rounded hover:bg-white/10 transition flex items-center justify-center space-x-2"
          >
            <FaTimes />
            <span>Réinitialiser</span>
          </button>
        </div>
      )}
    </div>
  );
}
