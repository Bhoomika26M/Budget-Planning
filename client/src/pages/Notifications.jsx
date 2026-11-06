import React, { useEffect, useState } from 'react'
import { AlertCircle, Bell, Check, CheckCheck } from 'lucide-react'
import api from '../services/api'
import AppLayout from '../components/AppLayout'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadNotifications = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/notifications')
      setNotifications(response.data.notifications || [])
      setUnreadCount(response.data.unread_count || 0)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Unable to load notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const markRead = async (notificationId) => {
    await api.patch(`/notifications/${notificationId}/read`)
    await loadNotifications()
  }

  const markAllRead = async () => {
    await api.patch('/notifications/read-all')
    await loadNotifications()
  }

  return (
    <AppLayout>
      <div style={{ paddingTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1E293B' }}>Notifications</h1>
            <p style={{ color: '#64748B', marginTop: 4 }}>{unreadCount} unread</p>
          </div>
          {unreadCount > 0 && (
            <button className="btn-primary" type="button" onClick={markAllRead}>
              <CheckCheck size={18} /> Mark all as read
            </button>
          )}
        </div>

        {loading && <div style={{ color: '#64748B' }}>Loading notifications...</div>}
        {error && (
          <div style={{ padding: 16, borderRadius: 12, background: '#FEF2F2', color: '#991B1B', display: 'flex', gap: 8 }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', borderRadius: 16, background: '#fff', color: '#94A3B8' }}>
            <Bell size={28} style={{ marginBottom: 12 }} />
            <p>No notifications yet.</p>
          </div>
        )}

        {!loading && (
          <div style={{ display: 'grid', gap: 12 }}>
            {notifications.map((notification) => (
              <article key={notification.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: 18,
                borderRadius: 14, background: notification.is_read ? '#fff' : '#EFF6FF',
                border: `1px solid ${notification.is_read ? '#E2E8F0' : '#BFDBFE'}`,
              }}>
                <Bell size={20} color={notification.is_read ? '#94A3B8' : '#2563EB'} />
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: 15, color: '#1E293B', marginBottom: 4 }}>{notification.title}</h2>
                  <p style={{ fontSize: 13, color: '#64748B' }}>{notification.message}</p>
                </div>
                {!notification.is_read && (
                  <button
                    type="button"
                    aria-label={`Mark ${notification.title} as read`}
                    onClick={() => markRead(notification.id)}
                    style={{ padding: 10, borderRadius: 8, background: '#fff', color: '#2563EB' }}
                  >
                    <Check size={18} />
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
