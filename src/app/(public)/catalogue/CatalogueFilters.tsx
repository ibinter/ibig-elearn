'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SlidersHorizontal, X, Search, ChevronDown, ChevronUp } from 'lucide-react'
import type { Category } from '@/types'

interface Props {
  categories: Category[]
  params: Record<string, string | undefined>
  buildUrl: (overrides: Record<string, string | undefined>) => string
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
      <button onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full font-semibold text-sm text-gray-800 mb-3">
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && children}
    </div>
  )
}

export default function CatalogueFilters({ categories, params, buildUrl }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filterContent = (
    <div className="space-y-0">
      {/* Recherche */}
      <FilterSection title="Rechercher">
        <form action="/catalogue" method="get" className="flex gap-2">
          {Object.entries(params).filter(([k]) => k !== 'q' && k !== 'page').map(([k, v]) =>
            v ? <input key={k} type="hidden" name={k} value={v} /> : null
          )}
          <input name="q" type="text" defaultValue={params.q ?? ''}
            placeholder="Mot-clé…"
            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0B3D91]" />
          <button type="submit" className="bg-[#0B3D91] text-white rounded-xl px-3 py-2 hover:bg-[#0B3D91]/90 transition-colors">
            <Search className="w-4 h-4" />
          </button>
        </form>
      </FilterSection>

      {/* Catégories */}
      <FilterSection title="Domaine">
        <div className="space-y-1">
          <Link href={buildUrl({ categorie: undefined })}
            className={`block text-sm px-2 py-1.5 rounded-lg transition-colors ${!params.categorie ? 'bg-[#0B3D91] text-white font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
            Tous les domaines
          </Link>
          {categories?.map(cat => (
            <Link key={cat.id} href={buildUrl({ categorie: cat.slug })}
              className={`block text-sm px-2 py-1.5 rounded-lg transition-colors ${params.categorie === cat.slug ? 'bg-[#0B3D91] text-white font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              {cat.name}
            </Link>
          ))}
        </div>
      </FilterSection>

      {/* Niveau */}
      <FilterSection title="Niveau">
        <div className="space-y-1">
          {[
            { value: undefined, label: 'Tous niveaux' },
            { value: 'debutant', label: 'Débutant' },
            { value: 'intermediaire', label: 'Intermédiaire' },
            { value: 'avance', label: 'Avancé' },
          ].map(item => (
            <Link key={item.label} href={buildUrl({ niveau: item.value })}
              className={`block text-sm px-2 py-1.5 rounded-lg transition-colors ${params.niveau === item.value ? 'bg-[#0B3D91] text-white font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              {item.label}
            </Link>
          ))}
        </div>
      </FilterSection>

      {/* Prix */}
      <FilterSection title="Prix">
        <div className="space-y-1">
          {[
            { value: undefined, label: 'Tous les prix' },
            { value: 'gratuit', label: 'Gratuit' },
            { value: '0-20000', label: 'Moins de 20 000 FCFA' },
            { value: '20000-50000', label: '20 000 – 50 000 FCFA' },
            { value: '50000+', label: 'Plus de 50 000 FCFA' },
          ].map(item => (
            <Link key={item.label} href={buildUrl({ prix: item.value })}
              className={`block text-sm px-2 py-1.5 rounded-lg transition-colors ${params.prix === item.value ? 'bg-[#0B3D91] text-white font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              {item.label}
            </Link>
          ))}
        </div>
      </FilterSection>

      {/* Durée */}
      <FilterSection title="Durée">
        <div className="space-y-1">
          {[
            { value: undefined, label: 'Toutes durées' },
            { value: '0-5', label: 'Moins de 5 heures' },
            { value: '5-20', label: '5 à 20 heures' },
            { value: '20+', label: 'Plus de 20 heures' },
          ].map(item => (
            <Link key={item.label} href={buildUrl({ duree: item.value })}
              className={`block text-sm px-2 py-1.5 rounded-lg transition-colors ${params.duree === item.value ? 'bg-[#0B3D91] text-white font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              {item.label}
            </Link>
          ))}
        </div>
      </FilterSection>

      {/* Langue */}
      <FilterSection title="Langue">
        <div className="space-y-1">
          {[
            { value: undefined, label: 'Toutes les langues' },
            { value: 'fr', label: 'Français' },
            { value: 'en', label: 'Anglais' },
            { value: 'ar', label: 'Arabe' },
          ].map(item => (
            <Link key={item.label} href={buildUrl({ langue: item.value })}
              className={`block text-sm px-2 py-1.5 rounded-lg transition-colors ${params.langue === item.value ? 'bg-[#0B3D91] text-white font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              {item.label}
            </Link>
          ))}
        </div>
      </FilterSection>

      {/* À la une */}
      <div className="mt-2">
        <Link href={buildUrl({ featured: params.featured === 'true' ? undefined : 'true' })}
          className={`w-full flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl border transition-colors ${params.featured === 'true' ? 'bg-[#FFA500] text-black border-[#FFA500]' : 'border-gray-200 text-gray-600 hover:border-[#FFA500] hover:text-[#FFA500]'}`}>
          ⭐ Formations à la une
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Bouton mobile */}
      <div className="lg:hidden mb-2">
        <button onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 bg-[#0B3D91] text-white text-sm font-medium px-4 py-2.5 rounded-xl">
          <SlidersHorizontal className="w-4 h-4" />
          Filtrer les formations
        </button>
      </div>

      {/* Drawer mobile */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 flex items-center justify-between px-5 py-4 z-10">
              <h2 className="font-bold text-gray-900">Filtres</h2>
              <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              {filterContent}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4">
              <button onClick={() => setDrawerOpen(false)}
                className="w-full bg-[#0B3D91] text-white font-semibold py-3 rounded-xl hover:bg-[#0B3D91]/90 transition-colors">
                Voir les résultats
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#0B3D91]" />
              Filtres
            </h2>
            {Object.entries(params).some(([k, v]) => k !== 'tri' && k !== 'page' && v) && (
              <Link href="/catalogue" className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors">
                Tout effacer
              </Link>
            )}
          </div>
          {filterContent}
        </div>
      </aside>
    </>
  )
}
