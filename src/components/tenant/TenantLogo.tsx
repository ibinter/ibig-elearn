import Image from 'next/image'
import Link from 'next/link'
import type { Tenant } from '@/types/tenant'

interface Props {
  tenant: Tenant | null
  size?: 'sm' | 'md'
}

export default function TenantLogo({ tenant, size = 'md' }: Props) {
  const h = size === 'sm' ? 32 : 40

  if (tenant?.logo_url) {
    return (
      <Link href="/" className="flex items-center gap-2">
        <Image src={tenant.logo_url} alt={tenant.name} height={h} width={h * 4} style={{ height: h, width: 'auto', objectFit: 'contain' }} />
        {!tenant.hide_ibig_branding && (
          <span className="text-xs text-gray-400 border-l border-gray-200 pl-2 ml-1">
            Powered by IBIG E-LEARNING
          </span>
        )}
      </Link>
    )
  }

  // Default IBIG logo
  const logoH = size === 'sm' ? 32 : 40
  return (
    <Link href="/" className="flex items-center flex-shrink-0">
      <Image src="/logo-full.webp" alt="IBIG E-LEARNING" width={140} height={logoH} style={{ height: logoH, width: 'auto' }} />
    </Link>
  )
}
