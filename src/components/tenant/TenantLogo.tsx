import Image from 'next/image'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
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
  const iconSize = size === 'sm' ? 'w-7 h-7' : 'w-9 h-9'
  const textSize = size === 'sm' ? 'text-sm' : 'text-base'
  return (
    <Link href="/" className="flex items-center gap-2 flex-shrink-0">
      <div className={`${iconSize} rounded-lg ibig-gradient flex items-center justify-center shadow-sm`}>
        <BookOpen className={size === 'sm' ? 'w-4 h-4 text-white' : 'w-5 h-5 text-white'} />
      </div>
      <div className="hidden sm:flex flex-col leading-none">
        <span className={`font-black text-[var(--tenant-primary,#0B3D91)] ${textSize} tracking-tight`}>
          {tenant ? tenant.name.split(' ')[0] : 'IBIG'}
        </span>
        <span className={`font-black text-[var(--tenant-secondary,#FFA500)] ${textSize} tracking-tight -mt-1`}>
          {tenant ? tenant.name.split(' ').slice(1).join(' ') || 'E-LEARNING' : 'E-LEARNING'}
        </span>
      </div>
    </Link>
  )
}
