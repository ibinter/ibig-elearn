type Variant = 'dashboard' | 'list' | 'public' | 'lesson'

export default function PageSkeleton({ variant = 'dashboard' }: { variant?: Variant }) {
  if (variant === 'lesson') {
    return (
      <div className="min-h-screen bg-[#1c1d1f]" aria-busy="true" aria-label="Chargement">
        <div className="h-[calc(3.5rem+env(safe-area-inset-top))] border-b border-white/10" />
        <div className="w-full aspect-video bg-black/60 max-w-5xl mx-auto" />
        <div className="bg-white min-h-[50vh] px-4 sm:px-6 py-6 space-y-4 max-w-3xl mx-auto">
          <div className="skeleton h-4 w-28" />
          <div className="skeleton h-7 w-4/5" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-11/12" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      </div>
    )
  }

  if (variant === 'public') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6" aria-busy="true" aria-label="Chargement">
        <div className="skeleton h-44 sm:h-64 w-full rounded-2xl" />
        <div className="skeleton h-6 w-2/3" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="skeleton aspect-video w-full" />
              <div className="skeleton h-4 w-4/5" />
              <div className="skeleton h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5" aria-busy="true" aria-label="Chargement">
      <div className="skeleton h-7 w-48" />
      {variant === 'dashboard' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24" />)}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-16 sm:h-20 w-full" />)}
      </div>
    </div>
  )
}
