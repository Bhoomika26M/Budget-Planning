const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  let payload = null

  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    const detail = payload?.detail

    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg).join(', ')
      : detail || 'The budget request failed.'

    throw new Error(message)
  }

  return payload
}

export function getBudgets() {
  return request('/budgets')
}

export function createBudget(data) {
  return request('/budgets', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateBudget(id, data) {
  return request(`/budgets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteBudget(id) {
  return request(`/budgets/${id}`, {
    method: 'DELETE',
  })
}

export function getBudgetAlerts() {
  return request('/budgets/alerts')
}