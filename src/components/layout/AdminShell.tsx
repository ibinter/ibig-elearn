'use client'

import { useState } from 'react'
import AdminSidebar from './AdminSidebar'

type Props = {
  userName: string
  userInitial: string
  userRole: string
  children: React.ReactNode
}

export default function AdminShell({ userName, userInitial, userRole, children }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar
        userName={userName}
        userInitial={userInitial}
        userRole={userRole}
        collapsed={collapsed}
        onCollapse={setCollapsed}
      />
      <div
        className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'lg:ml-[68px]' : 'lg:ml-60'}`}
      >
        <div className="h-[calc(3.5rem+env(safe-area-inset-top))] lg:hidden" />
        <main className="flex-1 min-w-0 p-4 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] animate-page-in">{children}</main>
      </div>
    </div>
  )
}
