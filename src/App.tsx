import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { Separator } from "@/components/ui/separator"
import { AuthProvider, useAuth } from "@/lib/auth"
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from "react-router-dom"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-svh bg-background text-foreground">
          <SiteHeader />
          <main className="container mx-auto px-4">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/profile"
                element={
                  <Protected>
                    <ProfilePage />
                  </Protected>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <SiteFooter />
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

function SiteHeader() {
  const { user, logout } = useAuth()
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback>WM</AvatarFallback>
            </Avatar>
            <span className="font-semibold tracking-tight">Workflow‑Marktplatz</span>
          </Link>
        </div>
        <div className="hidden md:block">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink className="px-3 py-2 text-sm" asChild>
                  <Link to="/">Katalog</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink className="px-3 py-2 text-sm">Kategorien</NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink className="px-3 py-2 text-sm">Verkaufen</NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink className="px-3 py-2 text-sm">Support</NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Registrieren</Link>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/profile">{user.displayName || user.email}</Link>
              </Button>
              <Button size="sm" variant="outline" onClick={logout}>Logout</Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

function HomePage() {
  return (
    <>
      <HeroSection />
      <Separator className="my-10" />
      <FeaturesGrid />
    </>
  )
}

function HeroSection() {
  return (
    <section className="py-12 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <Badge className="mb-4" variant="secondary">Neu: n8n Workflows</Badge>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          Automatisierungs‑Workflows kaufen, verkaufen und skalieren
        </h1>
        <p className="mt-4 text-muted-foreground">
          Finde hochwertige n8n-, Zapier- oder Make‑Workflows. Einfach kaufen, sofort nutzen,
          optional mit Support und Updates.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg">Katalog ansehen</Button>
          <Button size="lg" variant="outline">Workflows verkaufen</Button>
        </div>
        <div className="mt-8 flex items-center gap-2">
          <Input className="w-full sm:w-96" placeholder="Suche nach Kategorien, Tags oder Plattformen..." />
          <Button variant="secondary">Suchen</Button>
        </div>
      </div>
    </section>
  )
}

function FeaturesGrid() {
  const features: Array<{ title: string; description: string; badge?: string }> = [
    {
      title: "Kuratiert & moderiert",
      description: "Alle Einreichungen werden geprüft. Qualität, Sicherheit und Mehrwert stehen im Fokus.",
      badge: "Qualität",
    },
    {
      title: "Sofort verfügbar",
      description: "Direkter Zugriff nach Kauf. Versionierung und Updates inklusive.",
      badge: "Schnellstart",
    },
    {
      title: "Community & Support",
      description: "Bewertungen, Kommentare und optionaler Premium‑Support durch Seller.",
      badge: "Community",
    },
  ]

  return (
    <section className="py-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{feature.title}</CardTitle>
                {feature.badge ? <Badge variant="outline">{feature.badge}</Badge> : null}
              </div>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                Jetzt entdecken und passende Workflows finden.
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function SiteFooter() {
  return (
    <footer className="mt-10 border-t">
      <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground md:flex-row">
        <p>© {new Date().getFullYear()} Workflow‑Marktplatz</p>
        <div className="flex items-center gap-4">
          <a className="hover:underline" href="#">Impressum</a>
          <a className="hover:underline" href="#">Datenschutz</a>
          <a className="hover:underline" href="#">Kontakt</a>
        </div>
      </div>
    </footer>
  )
}

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await login(email, password)
      navigate("/profile")
    } catch (err: any) {
      setError(err.message || "Fehler beim Login")
    }
  }

  return (
    <section className="mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Melde dich mit deiner E‑Mail und deinem Passwort an.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="text-sm text-destructive">{error}</div>
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium" htmlFor="email">E‑Mail</label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium" htmlFor="password">Passwort</label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button className="w-full" type="submit">Einloggen</Button>
            <div className="text-center text-sm text-muted-foreground">
              Kein Konto? <Link className="underline" to="/register">Registrieren</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}

function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = React.useState("")
  const [displayName, setDisplayName] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      await register(email, displayName, password)
      navigate("/profile")
    } catch (err: any) {
      setError(err.message || "Fehler bei der Registrierung")
    }
  }

  return (
    <section className="mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle>Registrieren</CardTitle>
          <CardDescription>Erstelle dein Konto, um Workflows zu kaufen und zu verkaufen.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="text-sm text-destructive">{error}</div>
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium" htmlFor="email">E‑Mail</label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium" htmlFor="displayName">Anzeigename</label>
              <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
            <div className="space-y-2 text-left">
              <label className="text-sm font-medium" htmlFor="password">Passwort</label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button className="w-full" type="submit">Konto erstellen</Button>
            <div className="text-center text-sm text-muted-foreground">
              Bereits ein Konto? <Link className="underline" to="/login">Login</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}

function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [displayName, setDisplayName] = React.useState(user?.displayName ?? "")
  const [avatarUrl, setAvatarUrl] = React.useState(user?.avatarUrl ?? "")
  const [bio, setBio] = React.useState(user?.bio ?? "")

  function onSave(e: React.FormEvent) {
    e.preventDefault()
    updateProfile({ displayName, avatarUrl, bio })
  }

  return (
    <section className="mx-auto max-w-2xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Bearbeite deinen Avatar, Anzeigenamen und deine Bio.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSave}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="displayName">Anzeigename</label>
                <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="avatarUrl">Avatar URL</label>
                <Input id="avatarUrl" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="bio">Bio</label>
              <textarea id="bio" className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" value={bio} onChange={(e) => setBio(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{(displayName || user?.email || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <Badge variant="outline">Vorschau</Badge>
            </div>
            <Button type="submit">Speichern</Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}

function Protected({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default App
