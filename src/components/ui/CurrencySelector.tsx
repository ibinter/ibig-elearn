'use client'

import { useCurrency, type Currency } from '@/lib/currency-context'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface CurrencyOption {
  value: Currency
  label: string
  flag: string
  name: string
}

const GROUPS: { title: string; options: CurrencyOption[] }[] = [
  {
    title: 'Afrique de l\'Ouest',
    options: [
      { value: 'XOF', label: 'XOF', flag: '🌍', name: 'Franc CFA (UEMOA)' },
      { value: 'GNF', label: 'GNF', flag: '🇬🇳', name: 'Franc guinéen' },
      { value: 'NGN', label: 'NGN', flag: '🇳🇬', name: 'Naira nigérian' },
      { value: 'GHS', label: 'GHS', flag: '🇬🇭', name: 'Cedi ghanéen' },
    ],
  },
  {
    title: 'Afrique Centrale',
    options: [
      { value: 'XAF', label: 'XAF', flag: '🌍', name: 'Franc CFA (CEMAC)' },
      { value: 'CDF', label: 'CDF', flag: '🇨🇩', name: 'Franc congolais' },
    ],
  },
  {
    title: 'Afrique du Nord',
    options: [
      { value: 'MAD', label: 'MAD', flag: '🇲🇦', name: 'Dirham marocain' },
      { value: 'DZD', label: 'DZD', flag: '🇩🇿', name: 'Dinar algérien' },
      { value: 'TND', label: 'TND', flag: '🇹🇳', name: 'Dinar tunisien' },
      { value: 'EGP', label: 'EGP', flag: '🇪🇬', name: 'Livre égyptienne' },
    ],
  },
  {
    title: 'Afrique de l\'Est & Sud',
    options: [
      { value: 'KES', label: 'KES', flag: '🇰🇪', name: 'Shilling kényan' },
      { value: 'ETB', label: 'ETB', flag: '🇪🇹', name: 'Birr éthiopien' },
      { value: 'RWF', label: 'RWF', flag: '🇷🇼', name: 'Franc rwandais' },
      { value: 'ZAR', label: 'ZAR', flag: '🇿🇦', name: 'Rand sud-africain' },
      { value: 'MGA', label: 'MGA', flag: '🇲🇬', name: 'Ariary malgache' },
      { value: 'MUR', label: 'MUR', flag: '🇲🇺', name: 'Roupie mauricienne' },
    ],
  },
  {
    title: 'International',
    options: [
      { value: 'EUR', label: 'EUR', flag: '🇪🇺', name: 'Euro' },
      { value: 'USD', label: 'USD', flag: '🇺🇸', name: 'Dollar américain' },
    ],
  },
]

const ALL_OPTIONS = GROUPS.flatMap(g => g.options)

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()
  const [open, setOpen] = useState(false)
  const current = ALL_OPTIONS.find(o => o.value === currency) ?? ALL_OPTIONS[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
        aria-label="Sélectionner la devise"
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 max-h-[420px] overflow-y-auto">
            {GROUPS.map(group => (
              <div key={group.title}>
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {group.title}
                </p>
                {group.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setCurrency(opt.value); setOpen(false) }}
                    className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors ${
                      currency === opt.value
                        ? 'bg-[#0B3D91]/10 text-[#0B3D91] font-semibold'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-base">{opt.flag}</span>
                    <span className="font-medium w-9 flex-shrink-0">{opt.label}</span>
                    <span className="text-xs text-gray-400 truncate">{opt.name}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
