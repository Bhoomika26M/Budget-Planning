const API_BASE_URL = "http://127.0.0.1:8000";

export async function getIncome(userId) {
  const response = await fetch(`${API_BASE_URL}/income/${userId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch income");
  }

  return response.json();
}

export async function addIncome(incomeData) {
  const response = await fetch(`${API_BASE_URL}/income/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(incomeData),
  });

  if (!response.ok) {
    throw new Error("Failed to add income");
  }

  return response.json();
}

export async function deleteIncome(incomeId, userId) {
  const response = await fetch(
    `${API_BASE_URL}/income/${incomeId}?user_id=${userId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete income");
  }

  return response.json();
}

export async function getIncomeSources(userId) {
  const response = await fetch(
    `${API_BASE_URL}/income/sources/${userId}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch income sources");
  }

  return response.json();
}

export async function addIncomeSource(sourceData) {
  const response = await fetch(`${API_BASE_URL}/income/sources`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sourceData),
  });

  if (!response.ok) {
    throw new Error("Failed to add income source");
  }

  return response.json();
}

export async function deleteIncomeSource(sourceId, userId) {
  const response = await fetch(
    `${API_BASE_URL}/income/sources/${sourceId}?user_id=${userId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete income source");
  }

  return response.json();
}