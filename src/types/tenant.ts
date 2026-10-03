export interface Tenant {
  id: string
  subdomain: string
  custom_domain: string | null
  name: string
  logo_url: string | null
  favicon_url: string | null
  primary_color: string
  secondary_color: string
  bg_color: string
  text_color: string
  hide_ibig_branding: boolean
  custom_footer: string | null
  allowed_categories: string[] | null
  is_active: boolean
  created_at: string
  updated_at: string
}
