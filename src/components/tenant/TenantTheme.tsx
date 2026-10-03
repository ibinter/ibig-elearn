import type { Tenant } from '@/types/tenant'
import { tenantCssVars } from '@/lib/tenant'

interface Props {
  tenant: Tenant
}

// Injecte les couleurs du tenant comme variables CSS globales
export default function TenantTheme({ tenant }: Props) {
  const vars = tenantCssVars(tenant)
  return (
    <style dangerouslySetInnerHTML={{ __html: `
      :root { ${vars} }
      .ibig-gradient { background: linear-gradient(135deg, var(--tenant-primary), color-mix(in srgb, var(--tenant-primary) 70%, #000)); }
    `}} />
  )
}
