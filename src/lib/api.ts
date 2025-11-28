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

// Seller APIs
export type SellerWorkflow = WorkflowListItem

export async function listMyWorkflows(params: { status?: string } = {}): Promise<{ items: SellerWorkflow[] }> {
  const search = new URLSearchParams()
  if (params.status) search.set("status", params.status)
  const res = await fetch(`${API_BASE}/api/seller/workflows?${search.toString()}`, { credentials: "include" })
  if (!res.ok) throw new Error(`Failed to load seller workflows: ${res.status}`)
  return res.json()
}

export async function createWorkflowDraft(payload: {
  title: string
  shortDescription?: string | null
  description?: string | null
  platformType?: string | null
  deliveryType?: string | null
  price: number
  currency?: string
  categoryId?: number | null
  tags?: string[]
}): Promise<{ id: number }> {
  const res = await fetch(`${API_BASE}/api/seller/workflows`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Failed to create draft: ${res.status}`)
  return res.json()
}

export async function updateWorkflow(id: number, updates: Partial<{
  title: string
  shortDescription: string | null
  description: string | null
  platformType: string | null
  deliveryType: string | null
  price: number
  currency: string
  categoryId: number | null
  tags: string[]
}>): Promise<void> {
  const res = await fetch(`${API_BASE}/api/seller/workflows/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error(`Update failed: ${res.status}`)
}

export async function uploadWorkflowArtifact(id: number, file: File): Promise<{ path: string; size: number }> {
  const form = new FormData()
  form.set("file", file)
  const res = await fetch(`${API_BASE}/api/seller/workflows/${id}/artifact`, {
    method: "POST",
    credentials: "include",
    body: form,
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  return res.json()
}

export async function validateWorkflow(id: number): Promise<{ ok: boolean; issues: string[] }> {
  const res = await fetch(`${API_BASE}/api/seller/workflows/${id}/validate`, {
    method: "POST",
    credentials: "include",
  })
  if (!res.ok) throw new Error(`Validation failed: ${res.status}`)
  return res.json()
}

export async function publishWorkflow(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/seller/workflows/${id}/publish`, {
    method: "POST",
    credentials: "include",
  })
  if (!res.ok) throw new Error(`Publish failed: ${res.status}`)
}

export async function unpublishWorkflow(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/seller/workflows/${id}/unpublish`, {
    method: "POST",
    credentials: "include",
  })
  if (!res.ok) throw new Error(`Unpublish failed: ${res.status}`)
}


