import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'IBIG E-LEARNING — Formation professionnelle en Afrique'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #020b1a 0%, #071e45 50%, #020b1a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          padding: '60px',
          position: 'relative',
        }}
      >
        {/* Grid pattern overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
        }} />

        {/* Logo + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0B3D91, #1a6cc4)',
            borderRadius: '16px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
          }}>
            <span style={{ color: 'white', fontSize: '28px', fontWeight: 900, letterSpacing: '-0.5px' }}>IBIG</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '28px', fontWeight: 300 }}>|</span>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '24px', fontWeight: 600 }}>E-LEARNING</span>
        </div>

        {/* Titre principal */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '0',
        }}>
          <h1 style={{
            color: 'white',
            fontSize: '72px',
            fontWeight: 900,
            lineHeight: 1.05,
            textAlign: 'center',
            margin: 0,
          }}>
            La plateforme qui forme
          </h1>
          <h1 style={{
            fontSize: '72px',
            fontWeight: 900,
            lineHeight: 1.05,
            textAlign: 'center',
            margin: 0,
            background: 'linear-gradient(90deg, #FFA500, #FFD700)',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}>
            l&apos;Afrique de demain.
          </h1>
        </div>

        {/* Sous-titre */}
        <p style={{
          color: 'rgba(147, 197, 253, 0.8)',
          fontSize: '28px',
          textAlign: 'center',
          marginTop: '24px',
          marginBottom: '40px',
          maxWidth: '800px',
        }}>
          184+ formations certifiantes · 12 pays · Mobile Money
        </p>

        {/* Badges */}
        <div style={{ display: 'flex', gap: '16px' }}>
          {['✅ Certificats vérifiables', '📱 Mobile Money', '🌍 12 pays'].map(badge => (
            <div key={badge} style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '100px',
              padding: '8px 20px',
              color: 'rgba(255,255,255,0.85)',
              fontSize: '20px',
            }}>
              {badge}
            </div>
          ))}
        </div>

        {/* URL */}
        <p style={{
          position: 'absolute',
          bottom: '32px',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '18px',
        }}>
          ibig-elearning.com
        </p>
      </div>
    ),
    { ...size },
  )
}
