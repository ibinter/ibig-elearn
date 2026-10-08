'use client'

import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()}
      className="inline-flex items-center gap-2 bg-[#0B3D91] text-white font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-blue-800">
      <Printer className="w-4 h-4" /> Télécharger en PDF / imprimer
    </button>
  )
}
