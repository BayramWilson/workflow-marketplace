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
  purchaseCount?: number
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

export async function purchaseWorkflow(workflowId: number): Promise<{ purchaseId: number }> {
  const res = await fetch(`${API_BASE}/api/purchase/${workflowId}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) throw new Error(`Purchase failed: ${res.status}`)
  return res.json()
}

export type LibraryItem = {
  purchaseId: number
  workflow: {
    id: number
    title: string
    price: number
    currency: string
  }
  purchasedAt: string
  downloadCount: number
  lastAccessedAt?: string | null
}

export async function fetchLibrary(): Promise<LibraryItem[]> {
  const res = await fetch(`${API_BASE}/api/library`, { credentials: "include" })
  if (!res.ok) throw new Error(`Failed to fetch library: ${res.status}`)
  return res.json()
}

export async function downloadPurchaseBlob(purchaseId: number): Promise<{ blob: Blob; filename: string }> {
  const res = await fetch(`${API_BASE}/api/library/${purchaseId}/download`, {
    method: "GET",
    credentials: "include",
  })
  if (!res.ok) throw new Error(`Download failed: ${res.status}`)
  const disp = res.headers.get("content-disposition") || ""
  const match = /filename="([^"]+)"/i.exec(disp)
  const filename = match?.[1] || `workflow-${purchaseId}.json`
  const blob = await res.blob()
  return { blob, filename }
}


