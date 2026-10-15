const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function getAnalytics(userId) {
  const query = userId ? `?user_id=${encodeURIComponent(userId)}` : ''
  const response = await fetch(`${API_BASE_URL}/api/analytics${query}`)
  if (!response.ok) {
    throw new Error(`Analytics request failed (${response.status})`)
  }
  return response.json()
}
