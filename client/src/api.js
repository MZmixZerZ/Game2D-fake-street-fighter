const BASE = 'http://localhost:3001'

export async function submitMatch(data) {
  try {
    const r = await fetch(`${BASE}/api/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return r.ok ? r.json() : { success: false }
  } catch { return { success: false } }
}
