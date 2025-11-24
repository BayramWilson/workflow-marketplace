import * as React from "react"
import { useParams } from "react-router-dom"
import { fetchWorkflow, type WorkflowListItem } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function WorkflowDetailPage() {
  const { id } = useParams()
  const [loading, setLoading] = React.useState(true)
  const [wf, setWf] = React.useState<WorkflowListItem | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    ;(async () => {
      if (!id) return
      setLoading(true)
      setError(null)
      try {
        const w = await fetchWorkflow(id)
        setWf(w)
      } catch (e: any) {
        setError(e?.message || "Fehler beim Laden")
      } finally {
        setLoading(false)
      }
    })()
  }, [id])

  if (loading) return <div className="py-8 text-sm text-muted-foreground">Lade Workflow…</div>
  if (error) return <div className="py-8 text-sm text-destructive">{error}</div>
  if (!wf) return <div className="py-8 text-sm text-muted-foreground">Nicht gefunden</div>

  return (
    <section className="py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{wf.title}</span>
            <span className="text-base font-semibold">
              {wf.price.toFixed(2)} {wf.currency}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            von <span className="font-medium">{wf.seller.displayName}</span>
            {wf.category ? <> • {wf.category.name}</> : null}
            {wf.platformType ? <> • {wf.platformType}</> : null}
          </div>
          <div className="prose max-w-none whitespace-pre-wrap text-sm">
            {wf.description || wf.shortDescription || "Keine Beschreibung"}
          </div>
          <div className="flex flex-wrap gap-1">
            {wf.tags.map((t) => (
              <Badge key={t} variant="outline">
                {t}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}


