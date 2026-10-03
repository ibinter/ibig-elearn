'use client'

import { useCurrency, type Currency } from '@/lib/currency-context'
import { useLocale } from '@/i18n/client'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface CurrencyOption {
  value: Currency
  label: string
  flag: string
  fr: string
  en: string
}

const GROUPS_DATA: { fr: string; en: string; options: CurrencyOption[] }[] = [
  {
    fr: 'Afrique de l\'Ouest',
    en: 'West Africa',
    options: [
      { value: 'XOF', label: 'XOF', flag: '🌍', fr: 'Franc CFA (UEMOA)', en: 'CFA Franc (UEMOA)' },
      { value: 'GNF', label: 'GNF', flag: '🇬🇳', fr: 'Franc guinéen', en: 'Guinean Franc' },
      { value: 'NGN', label: 'NGN', flag: '🇳🇬', fr: 'Naira nigérian', en: 'Nigerian Naira' },
      { value: 'GHS', label: 'GHS', flag: '🇬🇭', fr: 'Cedi ghanéen', en: 'Ghanaian Cedi' },
    ],
  },
  {
    fr: 'Afrique Centrale',
    en: 'Central Africa',
    options: [
      { value: 'XAF', label: 'XAF', flag: '🌍', fr: 'Franc CFA (CEMAC)', en: 'CFA Franc (CEMAC)' },
      { value: 'CDF', label: 'CDF', flag: '🇨🇩', fr: 'Franc congolais', en: 'Congolese Franc' },
    ],
  },
  {
    fr: 'Afrique du Nord',
    en: 'North Africa',
    options: [
      { value: 'MAD', label: 'MAD', flag: '🇲🇦', fr: 'Dirham marocain', en: 'Moroccan Dirham' },
      { value: 'DZD', label: 'DZD', flag: '🇩🇿', fr: 'Dinar algérien', en: 'Algerian Dinar' },
      { value: 'TND', label: 'TND', flag: '🇹🇳', fr: 'Dinar tunisien', en: 'Tunisian Dinar' },
      { value: 'EGP', label: 'EGP', flag: '🇪🇬', fr: 'Livre égyptienne', en: 'Egyptian Pound' },
    ],
  },
  {
    fr: 'Afrique de l\'Est & Sud',
    en: 'East & Southern Africa',
    options: [
      { value: 'KES', label: 'KES', flag: '🇰🇪', fr: 'Shilling kényan', en: 'Kenyan Shilling' },
      { value: 'ETB', label: 'ETB', flag: '🇪🇹', fr: 'Birr éthiopien', en: 'Ethiopian Birr' },
      { value: 'RWF', label: 'RWF', flag: '🇷🇼', fr: 'Franc rwandais', en: 'Rwandan Franc' },
      { value: 'ZAR', label: 'ZAR', flag: '🇿🇦', fr: 'Rand sud-africain', en: 'South African Rand' },
      { value: 'MGA', label: 'MGA', flag: '🇲🇬', fr: 'Ariary malgache', en: 'Malagasy Ariary' },
      { value: 'MUR', label: 'MUR', flag: '🇲🇺', fr: 'Roupie mauricienne', en: 'Mauritian Rupee' },
    ],
  },
  {
    fr: 'International',
    en: 'International',
    options: [
      { value: 'EUR', label: 'EUR', flag: '🇪🇺', fr: 'Euro', en: 'Euro' },
      { value: 'USD', label: 'USD', flag: '🇺🇸', fr: 'Dollar américain', en: 'US Dollar' },
    ],
  },
]

const ALL_OPTIONS = GROUPS_DATA.flatMap(g => g.options)

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()
  const { locale } = useLocale()
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
            {GROUPS_DATA.map(group => (
              <div key={group.en}>
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {locale === 'en' ? group.en : group.fr}
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
                    <span className="text-xs text-gray-400 truncate">{locale === 'en' ? opt.en : opt.fr}</span>
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
