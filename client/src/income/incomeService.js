const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

async function readResponse(response, fallback) {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || fallback);
  }
  return response.json();
}

export async function getIncome(token) {
  const response = await fetch(`${API_BASE_URL}/income/`, {
    headers: authHeaders(token),
  });
  return readResponse(response, "Failed to fetch income");
}

export async function addIncome(incomeData, token) {
  const response = await fetch(`${API_BASE_URL}/income/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(incomeData),
  });
  return readResponse(response, "Failed to add income");
}

export async function deleteIncome(incomeId, token) {
  const response = await fetch(`${API_BASE_URL}/income/${incomeId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (response.status === 204) return;
  return readResponse(response, "Failed to delete income");
}

export async function getIncomeSources(token) {
  const response = await fetch(`${API_BASE_URL}/income/sources`, {
    headers: authHeaders(token),
  });
  return readResponse(response, "Failed to fetch income sources");
}

export async function addIncomeSource(sourceData, token) {
  const response = await fetch(`${API_BASE_URL}/income/sources`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    body: JSON.stringify(sourceData),
  });
  return readResponse(response, "Failed to add income source");
}

export async function deleteIncomeSource(sourceId, token) {
  const response = await fetch(`${API_BASE_URL}/income/sources/${sourceId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (response.status === 204) return;
  return readResponse(response, "Failed to delete income source");
}