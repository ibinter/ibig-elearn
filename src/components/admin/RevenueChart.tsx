'use client'

import { useState } from 'react'

interface MonthData {
  label: string
  xof: number
  count: number
}

interface Props {
  data: MonthData[]
  maxRevenue: number
}

export default function RevenueChart({ data, maxRevenue }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)
  const h = 160
  const barW = 28
  const gap = 8
  const total = data.length
  const svgW = total * (barW + gap)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 text-sm">Revenus mensuels (XOF)</h3>
        <span className="text-xs text-gray-400">12 derniers mois</span>
      </div>

      <div className="relative overflow-x-auto">
        <svg width={svgW} height={h + 32} className="overflow-visible">
          {data.map((m, i) => {
            const barH = maxRevenue > 0 ? Math.max((m.xof / maxRevenue) * h, m.xof > 0 ? 4 : 0) : 0
            const x = i * (barW + gap)
            const y = h - barH
            const isHovered = hovered === i
            return (
              <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                {/* Barre */}
                <rect
                  x={x} y={y} width={barW} height={barH}
                  rx={4}
                  fill={isHovered ? '#0B3D91' : m.xof > 0 ? '#3B82F6' : '#E5E7EB'}
                  className="transition-colors duration-150 cursor-pointer"
                />
                {/* Label mois */}
                <text
                  x={x + barW / 2} y={h + 18}
                  textAnchor="middle" fontSize={9} fill={isHovered ? '#0B3D91' : '#9CA3AF'}
                  fontWeight={isHovered ? 700 : 400}
                >
                  {m.label}
                </text>
                {/* Tooltip */}
                {isHovered && m.xof > 0 && (
                  <g>
                    <rect x={x - 20} y={y - 36} width={barW + 40} height={28} rx={6} fill="#0B3D91" />
                    <text x={x + barW / 2} y={y - 22} textAnchor="middle" fontSize={9} fill="white" fontWeight={700}>
                      {m.xof.toLocaleString('fr')} XOF
                    </text>
                    <text x={x + barW / 2} y={y - 12} textAnchor="middle" fontSize={8} fill="#BAC8FF">
                      {m.count} paiement{m.count !== 1 ? 's' : ''}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Résumé rapide */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
        <span>Total : <strong className="text-gray-900">{data.reduce((s, m) => s + m.xof, 0).toLocaleString('fr')} XOF</strong></span>
        <span>Transactions : <strong className="text-gray-900">{data.reduce((s, m) => s + m.count, 0)}</strong></span>
      </div>
    </div>
  )
}
