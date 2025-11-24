import * as React from "react"
import { Link, useSearchParams } from "react-router-dom"
import { fetchCategories, fetchTags, fetchWorkflows, type WorkflowListItem } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [q, setQ] = React.useState(searchParams.get("q") ?? "")
  const [category, setCategory] = React.useState(searchParams.get("category") ?? "")
  const [tags, setTags] = React.useState<string[]>(searchParams.get("tags")?.split(",").filter(Boolean) ?? [])
  const [sort, setSort] = React.useState(searchParams.get("sort") ?? "newest")
  const [loading, setLoading] = React.useState(true)
  const [items, setItems] = React.useState<WorkflowListItem[]>([])
  const [total, setTotal] = React.useState(0)
  const [categories, setCategories] = React.useState<Array<{ id: number; name: string; slug: string }>>([])
  const [allTags, setAllTags] = React.useState<Array<{ id: number; name: string; slug: string }>>([])

  React.useEffect(() => {
    ;(async () => {
      const [cats, tgs] = await Promise.all([fetchCategories(), fetchTags()])
      setCategories(cats)
      setAllTags(tgs)
    })()
  }, [])

  React.useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const resp = await fetchWorkflows({
          q: q || undefined,
          category: category || undefined,
          tags: tags.length ? tags.join(",") : undefined,
          sort,
          status: "published",
          page: 1,
          pageSize: 24,
        })
        setItems(resp.items)
        setTotal(resp.total)
      } finally {
        setLoading(false)
      }
    })()
  }, [q, category, tags.join(","), sort])

  function applyFilters(e: React.FormEvent) {
    e.preventDefault()
    const next = new URLSearchParams()
    if (q) next.set("q", q)
    if (category) next.set("category", category)
    if (tags.length) next.set("tags", tags.join(","))
    if (sort) next.set("sort", sort)
    setSearchParams(next, { replace: true })
  }

  function toggleTag(slug: string) {
    setTags((prev) => (prev.includes(slug) ? prev.filter((t) => t !== slug) : [...prev, slug]))
  }

  return (
    <section className="py-8">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">Katalog</h1>
      <form onSubmit={applyFilters} className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input placeholder="Suche" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="h-9 rounded-md border bg-background px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Alle Kategorien</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <select className="h-9 rounded-md border bg-background px-3 text-sm" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Neueste</option>
          <option value="updated">Zuletzt aktualisiert</option>
          <option value="price_asc">Preis aufsteigend</option>
          <option value="price_desc">Preis absteigend</option>
        </select>
        <Button type="submit">Anwenden</Button>
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-2">
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

      {loading ? (
        <div className="text-sm text-muted-foreground">Lade Workflows…</div>
      ) : (
        <>
          <div className="mb-3 text-sm text-muted-foreground">{total} Ergebnisse</div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((wf) => (
              <Card key={wf.id} className="flex h-full flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">
                      <Link to={`/workflows/${wf.id}`} className="hover:underline">
                        {wf.title}
                      </Link>
                    </CardTitle>
                    <div className="text-sm font-semibold">
                      {wf.price.toFixed(2)} {wf.currency}
                    </div>
                  </div>
                  <CardDescription>{wf.shortDescription || "Keine Kurzbeschreibung"}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <div className="mb-2 text-xs text-muted-foreground">
                    by <span className="font-medium">{wf.seller.displayName}</span>
                    {wf.category ? <> • {wf.category.name}</> : null}
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
            ))}
          </div>
        </>
      )}
    </section>
  )
}


