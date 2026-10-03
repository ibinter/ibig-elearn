import { headers } from 'next/headers'
import type { Tenant } from '@/types/tenant'

// Server-side: read tenant injected by middleware
export async function getTenant(): Promise<Tenant | null> {
  const h = await headers()
  const raw = h.get('x-tenant-data')
  if (!raw) return null
  try {
    return JSON.parse(Buffer.from(raw, 'base64').toString('utf8')) as Tenant
  } catch {
    return null
  }
}

// CSS variables string from tenant theme
export function tenantCssVars(tenant: Tenant): string {
  return [
    `--tenant-primary: ${tenant.primary_color}`,
    `--tenant-secondary: ${tenant.secondary_color}`,
    `--tenant-bg: ${tenant.bg_color}`,
    `--tenant-text: ${tenant.text_color}`,
  ].join(';')
}
