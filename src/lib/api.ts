const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"

export type WorkflowListItem = {
  id: number
  sellerId: number
  categoryId: number | null
  title: string
  shortDescription: string | null
  description: string | null
  platformType: string | null
  price: number
  currency: string
  deliveryType: string | null
  status: string
  createdAt: string
  updatedAt: string
  seller: { id: number; displayName: string; avatarUrl?: string | null }
  category: { id: number; name: string; slug: string } | null
  tags: string[]
}

export type WorkflowListResponse = {
  items: WorkflowListItem[]
  page: number
  pageSize: number
  total: number
}

export async function fetchWorkflows(params: Record<string, string | number | undefined> = {}): Promise<WorkflowListResponse> {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) search.set(k, String(v))
  })
  const res = await fetch(`${API_BASE}/api/workflows?${search.toString()}`, { credentials: "include" })
  if (!res.ok) throw new Error(`Failed to fetch workflows: ${res.status}`)
  return res.json()
}

export async function fetchWorkflow(id: number | string): Promise<WorkflowListItem> {
  const res = await fetch(`${API_BASE}/api/workflows/${id}`, { credentials: "include" })
  if (!res.ok) throw new Error(`Failed to fetch workflow: ${res.status}`)
  return res.json()
}

export async function fetchCategories(): Promise<Array<{ id: number; name: string; slug: string; parentId: number | null; sortOrder: number }>> {
  const res = await fetch(`${API_BASE}/api/categories`, { credentials: "include" })
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`)
  return res.json()
}

export async function fetchTags(): Promise<Array<{ id: number; name: string; slug: string }>> {
  const res = await fetch(`${API_BASE}/api/tags`, { credentials: "include" })
  if (!res.ok) throw new Error(`Failed to fetch tags: ${res.status}`)
  return res.json()
}


