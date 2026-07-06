import { Outlet }            from 'react-router-dom'
import DashboardSidebar      from '../../../components/dashboard/DashboardSidebar/index.js'
import { useDashboardSummary, useUnreadCount } from '../../../hooks/useDashboard.js'
import { useSocket }         from '../../../hooks/useSocket.js'

export default function DashboardLayout() {
  const { data } = useDashboardSummary()

  // Keeps unread count hydrated in the store and polls every 60s
  useUnreadCount()

  // Real-time push: invalidates caches on notification:new and order:updated events
  useSocket(data?.user?._id?.toString())

  return (
    <div className="dashboard-layout">
      <DashboardSidebar user={data?.user} />
      <div className="dashboard-content">
        <Outlet />
      </div>
    </div>
  )
}
