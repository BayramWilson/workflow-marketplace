import * as React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  fetchCategories,
  fetchTags,
  fetchWorkflow,
  updateWorkflow,
  uploadWorkflowArtifact,
  validateWorkflow,
  publishWorkflow,
  type WorkflowListItem,
} from "@/lib/api"

export default function WorkflowEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const wfId = Number(id)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [wf, setWf] = React.useState<WorkflowListItem | null>(null)
  const [categories, setCategories] = React.useState<Array<{ id: number; name: string; slug: string }>>([])
  const [allTags, setAllTags] = React.useState<Array<{ id: number; name: string; slug: string }>>([])
  const [issues, setIssues] = React.useState<string[]>([])

  // local form state
  const [title, setTitle] = React.useState("")
  const [shortDescription, setShortDescription] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [platformType, setPlatformType] = React.useState("")
  const [deliveryType, setDeliveryType] = React.useState("")
  const [price, setPrice] = React.useState<string>("0")
  const [currency, setCurrency] = React.useState("USD")
  const [categoryId, setCategoryId] = React.useState<string>("")
  const [tags, setTags] = React.useState<string[]>([])

  React.useEffect(() => {
    ;(async () => {
      if (!wfId) return
      setLoading(true)
      try {
        const [cats, tagList, w] = await Promise.all([fetchCategories(), fetchTags(), fetchWorkflow(wfId)])
        setCategories(cats)
        setAllTags(tagList)
        setWf(w)
        // seed form
        setTitle(w.title || "")
        setShortDescription(w.shortDescription || "")
        setDescription(w.description || "")
        setPlatformType(w.platformType || "")
        setDeliveryType(w.deliveryType || "")
        setPrice(String(w.price ?? 0))
        setCurrency(w.currency || "USD")
        setCategoryId(w.category?.id ? String(w.category.id) : "")
        setTags(w.tags || [])
      } finally {
        setLoading(false)
      }
    })()
  }, [wfId])

  async function onSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateWorkflow(wfId, {
        title,
        shortDescription,
        description,
        platformType: platformType || null,
        deliveryType: deliveryType || null,
        price: Number(price || 0),
        currency,
        categoryId: categoryId ? Number(categoryId) : null,
        tags,
      })
      const updated = await fetchWorkflow(wfId)
      setWf(updated)
    } catch (e: any) {
      alert(e?.message || "Speichern fehlgeschlagen")
    } finally {
      setSaving(false)
    }
  }

  async function onUploadChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadWorkflowArtifact(wfId, file)
      const updated = await fetchWorkflow(wfId)
      setWf(updated)
      alert("Datei hochgeladen")
    } catch (e: any) {
      alert(e?.message || "Upload fehlgeschlagen")
    } finally {
      e.currentTarget.value = ""
    }
  }

  async function onValidate() {
    try {
      const res = await validateWorkflow(wfId)
      setIssues(res.issues)
      if (res.ok) alert("Validierung erfolgreich")
    } catch (e: any) {
      alert(e?.message || "Validierung fehlgeschlagen")
    }
  }

  async function onPublish() {
    try {
      await publishWorkflow(wfId)
      alert("Veröffentlicht")
      navigate("/seller")
    } catch (e: any) {
      alert(e?.message || "Publizieren fehlgeschlagen")
    }
  }

  function toggleTag(slug: string) {
    setTags((prev) => (prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug]))
  }

  if (loading) return <div className="py-8 text-sm text-muted-foreground">Lade Editor…</div>
  if (!wf) return <div className="py-8 text-sm text-muted-foreground">Nicht gefunden</div>

  return (
    <section className="py-8">
      <Card>
        <CardHeader>
          <CardTitle>Workflow bearbeiten</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSave}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="title">Titel</label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="price">Preis</label>
                <Input id="price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="currency">Währung</label>
                <Input id="currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="platformType">Plattform</label>
                <Input id="platformType" value={platformType} onChange={(e) => setPlatformType(e.target.value)} placeholder="z.B. n8n, Zapier" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="deliveryType">Delivery‑Typ</label>
                <select
                  id="deliveryType"
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value)}
                >
                  <option value="">Bitte wählen…</option>
                  <option value="FILE">Datei‑Download</option>
                  <option value="REMOTE">Externer Host</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="category">Kategorie</label>
                <select
                  id="category"
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Keine</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="short">Kurzbeschreibung</label>
              <Input id="short" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="desc">Beschreibung</label>
              <textarea
                id="desc"
                className="min-h-[160px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Tags</div>
              <div className="flex flex-wrap gap-2">
                {allTags.map((t) => (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => toggleTag(t.slug)}
                    className={`rounded-md border px-2 py-1 text-xs ${tags.includes(t.slug) ? "bg-primary text-primary-foreground" : "bg-background"}`}
                  >
                    #{t.slug}
                  </button>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                Ausgewählt:&nbsp;
                {tags.length ? tags.map((t) => <Badge key={t} className="mr-1" variant="outline">{t}</Badge>) : "—"}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Artefakt hochladen</div>
              <input type="file" onChange={onUploadChange} />
              <div className="text-xs text-muted-foreground">
                Aktueller Zustand: {wf?.deliveryType?.toUpperCase() === "FILE" ? (wf ? "Datei erwartet" : "—") : "Kein Dateiupload erforderlich"}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" disabled={saving}>Speichern</Button>
              <Button type="button" variant="outline" onClick={onValidate}>Validieren</Button>
              <Button type="button" onClick={onPublish}>Publizieren</Button>
            </div>

            {issues.length > 0 ? (
              <div className="mt-4 rounded-md border p-3 text-sm">
                <div className="mb-1 font-medium">Validierungsfehler</div>
                <ul className="list-inside list-disc text-destructive">
                  {issues.map((i, idx) => (
                    <li key={idx}>{i}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </section>
  )
}


