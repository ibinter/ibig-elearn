'use client'
import { useState } from 'react'
import { Printer, Download, Loader2 } from 'lucide-react'

export default function PrintButton() {
  const [generating, setGenerating] = useState(false)

  async function downloadPDF() {
    setGenerating(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      const el = document.getElementById('certificate')
      if (!el) return

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      // A4 paysage : 297 x 210 mm
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = pdf.internal.pageSize.getHeight()
      const ratio = Math.min(pdfW / canvas.width, pdfH / canvas.height)
      const imgW = canvas.width * ratio
      const imgH = canvas.height * ratio
      const x = (pdfW - imgW) / 2
      const y = (pdfH - imgH) / 2
      pdf.addImage(imgData, 'PNG', x, y, imgW, imgH)
      pdf.save('certificat-ibig-elearn.pdf')
    } catch (e) {
      console.error(e)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={downloadPDF} disabled={generating}
        className="flex items-center gap-2 ibig-gradient text-white text-sm font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity">
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        {generating ? 'Génération...' : 'Télécharger PDF'}
      </button>
      <button onClick={() => window.print()}
        className="flex items-center gap-2 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
        <Printer className="w-4 h-4" /> Imprimer
      </button>
    </div>
  )
}
