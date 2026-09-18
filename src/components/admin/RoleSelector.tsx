'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const ROLES = ['apprenant', 'formateur', 'coordinateur', 'admin']
const COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700 border-red-200',
  coordinateur: 'bg-purple-100 text-purple-700 border-purple-200',
  formateur: 'bg-blue-100 text-blue-700 border-blue-200',
  apprenant: 'bg-gray-100 text-gray-600 border-gray-200',
}

export default function RoleSelector({ userId, currentRole }: { userId: string; currentRole: string }) {
  const [role, setRole] = useState(currentRole)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function handleChange(newRole: string) {
    if (newRole === role) return
    setSaving(true)
    const res = await fetch('/api/admin/users/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    })
    setSaving(false)
    if (res.ok) { setRole(newRole); router.refresh() }
  }

  return (
    <div className="flex items-center gap-2">
      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
      <select
        value={role}
        onChange={e => handleChange(e.target.value)}
        disabled={saving}
        className={`text-xs px-2.5 py-1 rounded-full font-medium border cursor-pointer focus:outline-none ${COLORS[role] ?? COLORS.apprenant}`}
      >
        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
    </div>
  )
}
