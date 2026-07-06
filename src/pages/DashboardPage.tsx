import { Calendar } from 'lucide-react'
import StatCards from '../components/dashboard/StatCards'
import ActivityFeed from '../components/dashboard/ActivityFeed'
import QuickActions from '../components/dashboard/QuickActions'
import OverviewCards from '../components/dashboard/OverviewCards'

export default function DashboardPage() {
  return (
    <div className="page-content">
      <div className="content-top">
        <div>
          <h2>Genel Bakış</h2>
          <p className="content-subtitle">OSGB operasyonlarına genel bakış</p>
        </div>
        <div className="date-badge">
          <Calendar size={14} strokeWidth={1.8} />
          <span>{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      <StatCards />

      <div className="dashboard-panels">
        <ActivityFeed />
        <div className="panels-right">
          <QuickActions />
          <OverviewCards />
        </div>
      </div>
    </div>
  )
}