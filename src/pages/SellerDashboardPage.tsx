import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  listMyWorkflows,
  publishWorkflow,
  unpublishWorkflow,
  type SellerWorkflow,
  createWorkflowDraft,
} from "@/lib/api"

export default function SellerDashboardPage() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = React.useState<string>("")
  const [loading, setLoading] = React.useState(true)
  const [items, setItems] = React.useState<SellerWorkflow[]>([])
  const [error, setError] = React.useState<string | null>(null)
  const [newTitle, setNewTitle] = React.useState("")

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const resp = await listMyWorkflows({ status: statusFilter || undefined })
      setItems(resp.items)
    } catch (e: any) {
      setError(e?.message || "Fehler beim Laden")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    ;(async () => {
      await load()
    })()
  }, [statusFilter])

  async function onCreateDraft(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setLoading(true)
    try {
      const { id } = await createWorkflowDraft({ title: newTitle.trim(), price: 0 })
      navigate(`/seller/workflows/${id}/edit`)
    } catch (e: any) {
      alert(e?.message || "Entwurf konnte nicht erstellt werden")
    } finally {
      setLoading(false)
    }
  }

  async function togglePublish(wf: SellerWorkflow) {
    try {
      if (String(wf.status).toUpperCase() === "PUBLISHED") {
        await unpublishWorkflow(wf.id)
      } else {
        await publishWorkflow(wf.id)
      }
      await load()
    } catch (e: any) {
      alert(e?.message || "Aktion fehlgeschlagen")
    }
  }

  return (
    <section className="py-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Verkäufer‑Dashboard</h1>
        <form onSubmit={onCreateDraft} className="flex items-center gap-2">
          <Input
            className="w-64"
            placeholder="Neuer Workflow‑Titel"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <Button type="submit">Entwurf anlegen</Button>
        </form>
      </div>
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm">Status</label>
        <select
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Alle</option>
          <option value="DRAFT">Entwurf</option>
          <option value="PUBLISHED">Veröffentlicht</option>
        </select>
      </div>
      {error ? <div className="mb-4 text-sm text-destructive">{error}</div> : null}
      {loading ? (
        <div className="text-sm text-muted-foreground">Lade…</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((wf) => (
            <Card key={wf.id} className="flex h-full flex-col">
              <CardHeader>
                <CardTitle className="text-base">{wf.title}</CardTitle>
              </CardHeader>
              <CardContent className="mt-auto space-y-2 text-sm">
                <div className="text-muted-foreground">
                  {wf.price.toFixed(2)} {wf.currency} • {wf.status}
                </div>
                <div className="text-muted-foreground">Käufe: <span className="font-medium text-foreground">{(wf as any).purchaseCount ?? 0}</span></div>
                <div className="text-muted-foreground">Downloads: <span className="font-medium text-foreground">{(wf as any).downloadTotal ?? 0}</span></div>
                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/seller/workflows/${wf.id}/edit`}>Bearbeiten</Link>
                  </Button>
                  <Button size="sm" onClick={() => togglePublish(wf)}>
                    {String(wf.status).toUpperCase() === "PUBLISHED" ? "Depublizieren" : "Publizieren"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}


