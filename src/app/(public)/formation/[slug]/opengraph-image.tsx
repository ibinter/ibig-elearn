import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const alt = 'Formation IBIG E-LEARN'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('courses')
    .select('title, short_description, thumbnail_url, price_xof, instructor:profiles(full_name), category:categories(name)')
    .eq('slug', slug)
    .single()

  const title = data?.title ?? 'Formation professionnelle'
  const category = (data?.category as any)?.name ?? 'Formation'
  const instructor = (data?.instructor as any)?.full_name ?? 'Expert IBIG'
  const price = data?.price_xof === 0 ? 'Gratuit' : data?.price_xof ? `${data.price_xof.toLocaleString('fr-FR')} FCFA` : ''

  return new ImageResponse(
    (
      <div style={{
        background: 'linear-gradient(135deg, #020b1a 0%, #071e45 50%, #020b1a 100%)',
        width: '100%', height: '100%',
        display: 'flex',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}>
        {/* Thumbnail si disponible */}
        {data?.thumbnail_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={data.thumbnail_url}
            alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }}
          />
        )}

        {/* Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(135deg, rgba(2,11,26,0.92) 0%, rgba(7,30,69,0.85) 100%)',
        }} />

        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '60px', width: '100%',
        }}>
          {/* Top — logo + catégorie */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #0B3D91, #1a6cc4)',
                borderRadius: '12px', padding: '8px 16px',
                display: 'flex',
              }}>
                <span style={{ color: 'white', fontSize: '22px', fontWeight: 900 }}>IBIG</span>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '20px' }}>E-LEARN</span>
            </div>
            <div style={{
              background: 'rgba(255,165,0,0.15)',
              border: '1px solid rgba(255,165,0,0.35)',
              borderRadius: '100px', padding: '6px 18px',
              color: '#FFA500', fontSize: '18px', fontWeight: 700,
            }}>
              {category}
            </div>
          </div>

          {/* Titre */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h1 style={{
              color: 'white', fontSize: title.length > 50 ? '52px' : '64px',
              fontWeight: 900, lineHeight: 1.1, margin: 0,
              maxWidth: '900px',
            }}>
              {title}
            </h1>
            <p style={{ color: 'rgba(147,197,253,0.75)', fontSize: '24px', margin: 0 }}>
              par {instructor}
            </p>
          </div>

          {/* Bottom */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '100px', padding: '8px 20px',
                color: 'rgba(255,255,255,0.8)', fontSize: '18px',
              }}>
                📜 Certificat inclus
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '100px', padding: '8px 20px',
                color: 'rgba(255,255,255,0.8)', fontSize: '18px',
              }}>
                📱 Mobile Money
              </div>
            </div>
            {price && (
              <div style={{
                background: 'linear-gradient(90deg, #FFA500, #FFD700)',
                borderRadius: '16px', padding: '10px 28px',
                color: 'black', fontSize: '26px', fontWeight: 900,
              }}>
                {price}
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
