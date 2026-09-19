'use client'

const COUNTRIES = [
  { name: "Côte d'Ivoire", flag: '🇨🇮' },
  { name: 'Sénégal', flag: '🇸🇳' },
  { name: 'Cameroun', flag: '🇨🇲' },
  { name: 'Mali', flag: '🇲🇱' },
  { name: 'Burkina Faso', flag: '🇧🇫' },
  { name: 'Guinée', flag: '🇬🇳' },
  { name: 'Congo', flag: '🇨🇬' },
  { name: 'Bénin', flag: '🇧🇯' },
  { name: 'Togo', flag: '🇹🇬' },
  { name: 'Niger', flag: '🇳🇪' },
  { name: 'Gabon', flag: '🇬🇦' },
  { name: 'RD Congo', flag: '🇨🇩' },
]

export default function CountriesMarquee() {
  const items = [...COUNTRIES, ...COUNTRIES]
  return (
    <div className="overflow-hidden py-4">
      <div className="flex animate-marquee gap-4 w-max">
        {items.map((c, i) => (
          <div key={`${c.name}-${i}`}
            className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-white text-sm flex-shrink-0 hover:bg-white/20 transition-colors cursor-default">
            <span className="text-xl">{c.flag}</span>
            <span>{c.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
