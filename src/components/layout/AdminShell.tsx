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
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'lg:ml-[68px]' : 'lg:ml-60'}`}
      >
        <div className="h-14 lg:hidden" />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
