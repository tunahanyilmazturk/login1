import { Activity, UserPlus, CheckCircle, FileText, AlertTriangle, ArrowRight } from 'lucide-react'

const recentActivities = [
  { text: 'Personel kaydı oluşturuldu', detail: 'Ahmet Yılmaz · İş Güvenliği Uzmanı', time: '2 dk önce', type: 'add' as const },
  { text: 'Eğitim tamamlandı', detail: 'Temel İş Sağlığı · 18 katılımcı', time: '15 dk önce', type: 'complete' as const },
  { text: 'Denetim raporu yayınlandı', detail: 'Şantiye A · 3 bulgu tespit edildi', time: '1 saat önce', type: 'report' as const },
  { text: 'Evrak süresi doldu', detail: 'Yangın Söndürme Sertifikası', time: '2 saat önce', type: 'alert' as const },
]

const config = {
  add: { icon: UserPlus, color: '#3b82f6' },
  complete: { icon: CheckCircle, color: '#10b981' },
  report: { icon: FileText, color: '#8b5cf6' },
  alert: { icon: AlertTriangle, color: '#ef4444' },
}

export default function ActivityFeed() {
  return (
    <section className="card activity-card">
      <div className="card-title-row">
        <h3><Activity size={16} strokeWidth={1.8} /> Son Aktiviteler</h3>
        <button className="card-link">Tümü <ArrowRight size={14} /></button>
      </div>
      <ul className="activity-list">
        {recentActivities.map((item, i) => {
          const { icon: Icon, color } = config[item.type]
          return (
            <li key={i} className="activity-item">
              <span className="activity-icon" style={{ background: `${color}14`, color }}>
                <Icon size={14} strokeWidth={1.8} />
              </span>
              <div className="activity-body">
                <strong>{item.text}</strong>
                <span>{item.detail}</span>
              </div>
              <time>{item.time}</time>
            </li>
          )
        })}
      </ul>
    </section>
  )
}