'use client'

import { useState } from 'react'
import { Download, Printer, FileText, Loader2 } from 'lucide-react'

interface Props {
  cohortId: string
  bcNumber: string | null
}

export default function DocumentButtons({ cohortId, bcNumber }: Props) {
  const [loading, setLoading] = useState(false)

  async function downloadPDF() {
    setLoading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const element = document.getElementById('bon-de-commande')
      if (!element) return

      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      let y = 0
      const pageHeight = pdf.internal.pageSize.getHeight()
      while (y < pdfHeight) {
        if (y > 0) pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, -y, pdfWidth, pdfHeight)
        y += pageHeight
      }

      pdf.save(`${bcNumber ?? 'bon-de-commande'}.pdf`)
    } catch (e) {
      console.error('[pdf]', e)
    }
    setLoading(false)
  }

  return (
    <div className="flex gap-3 flex-wrap">
      <button
        onClick={downloadPDF}
        disabled={loading}
        className="flex items-center gap-2 ibig-gradient text-white text-sm font-semibold px-4 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération...</> : <><Download className="w-4 h-4" /> Télécharger PDF</>}
      </button>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
      >
        <Printer className="w-4 h-4" /> Imprimer
      </button>
    </div>
  )
}
