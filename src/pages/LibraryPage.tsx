import * as React from "react"
import { downloadPurchaseBlob, fetchLibrary, type LibraryItem } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function LibraryPage() {
  const [items, setItems] = React.useState<LibraryItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [downloadingId, setDownloadingId] = React.useState<number | null>(null)

  React.useEffect(() => {
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchLibrary()
        setItems(data)
      } catch (e: any) {
        setError(e?.message || "Fehler beim Laden der Bibliothek")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function onDownload(purchaseId: number) {
    setDownloadingId(purchaseId)
    try {
      const { blob, filename } = await downloadPurchaseBlob(purchaseId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      // Optimistically bump counters locally
      setItems(prev =>
        prev.map(it =>
          it.purchaseId === purchaseId
            ? { ...it, downloadCount: it.downloadCount + 1, lastAccessedAt: new Date().toISOString() }
            : it
        )
      )
    } catch (e: any) {
      alert(e?.message || "Download fehlgeschlagen")
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <section className="mx-auto max-w-5xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Meine Bibliothek</h1>
        <p className="text-muted-foreground">Gekaufte Workflows und Downloads</p>
      </div>
      {loading ? (
        <div>Wird geladen…</div>
      ) : error ? (
        <div className="text-destructive">{error}</div>
      ) : items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Keine Käufe</CardTitle>
            <CardDescription>Deine Bibliothek ist leer. Kaufe einen Workflow im Katalog.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((it) => (
            <Card key={it.purchaseId} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{it.workflow.title}</CardTitle>
                  <Badge variant="outline">
                    {new Intl.NumberFormat(undefined, { style: "currency", currency: it.workflow.currency || "USD" }).format(it.workflow.price)}
                  </Badge>
                </div>
                <CardDescription>Kauf: {new Date(it.purchasedAt).toLocaleString()}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 items-end justify-between gap-3">
                <div className="text-sm text-muted-foreground">Kaufdatum: {new Date(it.purchasedAt).toLocaleString()}</div>
                <Button size="sm" onClick={() => onDownload(it.purchaseId)} disabled={downloadingId === it.purchaseId}>
                  {downloadingId === it.purchaseId ? "Lädt…" : "Download"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}


