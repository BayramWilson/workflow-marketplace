# Workflow‑Marktplatz – Frontend (React + TypeScript + Vite)

Dieses Projekt ist das Frontend für einen Marktplatz rund um Automatisierungs‑Workflows (zuerst n8n, später Zapier/Make/Python). Käufer erwerben Workflows als digitale Produkte; nach erfolgreicher Stripe‑Zahlung erscheinen diese in der persönlichen Bibliothek. Verkäufer können Workflows einstellen; Admins moderieren und betreuen Support.

Die zugehörigen Modelle sind dokumentiert in:
- `src/assets/uml/uml_model.md` (UML/Domain‑Modell für das Frontend)
- `src/assets/db/database_model.md` (DB‑Dokumentation, ER‑Diagramm)
- `db/schema.sql` (MySQL/MariaDB‑Schema)


## Inhalt
- Überblick & Funktionsumfang
- Tech‑Stack
- Projektstruktur
- Setup & Entwicklung
- UI‑Bibliothek mit shadcn (CLI und MCP)
- Datenbank einrichten (MySQL/MariaDB)
- Implementierungsfahrplan (Phasen)
- API‑Verträge (Beispiele)


## Überblick & Funktionsumfang
- Workflows als Produkte (Titel, Beschreibung, Preis, Kategorie, Tags, Status).
- Kaufen & Bezahlen via Stripe; Bibliothek nach Zahlung.
- Community‑Features: Follows, Bewertungen, Kommentare.
- Support‑Tickets inkl. Nachrichten‑Threads.
- Moderation durch Admins mit Protokollierung.
- Perspektivisch: Remote‑Hosting & Credential‑Handling pro Workflow/User.


## Tech‑Stack
- Build/Dev: Vite (React + TypeScript)
- Styling: Tailwind CSS v4 (Zero‑Config, `@tailwindcss/vite`)
- UI‑Komponenten: shadcn (Design: „new‑york“, Icons: lucide)
- Linting: ESLint


## Projektstruktur (Auszug)
- `src/`
  - `App.tsx`, `main.tsx` – App‑Bootstrap
  - `index.css` – Tailwind v4 Setup und Design‑Tokens
  - `components/` – UI‑Bausteine (z. B. `ui/` von shadcn)
  - `lib/` – Hilfsfunktionen, API‑Clients, Typen
  - `assets/uml/uml_model.md` – Frontend‑Domainmodell
  - `assets/db/database_model.md` – ER‑Modell
- `db/schema.sql` – MySQL/MariaDB‑Schema
- `vite.config.ts`, `tsconfig*.json` – Build/TypeScript‑Konfig
- `components.json` – shadcn‑Konfiguration


## Setup & Entwicklung
Voraussetzungen:
- Node.js ≥ 18
- npm oder pnpm
- MySQL/MariaDB (lokal oder via Docker)

Installation und Start:
```bash
# Abhängigkeiten installieren
npm install

# Entwicklung starten (http://localhost:5173)
npm run dev

# Linting
npm run lint

# Produktion bauen
npm run build

# Build lokal testen
npm run preview
```

Empfohlene Umgebungsvariablen (Vite liest `import.meta.env.VITE_*`):
```bash
# .env.local (Beispiel)
VITE_API_BASE_URL=http://localhost:3000
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```


## UI‑Bibliothek mit shadcn
Dieses Projekt nutzt shadcn‑Komponenten mit Tailwind v4.

- Konfiguration: siehe `components.json` (Style „new‑york“, Icons „lucide“, CSS `src/index.css`).
- Komponenten hinzufügen (CLI):
```bash
# Komponenten hinzufügen (Beispiele)
npx shadcn@latest add button card input textarea badge sheet dialog
```
Komponenten landen standardmäßig in `src/components/ui` (gemäß Aliases in `components.json`).

Optional in Cursor via MCP‑Server (falls konfiguriert):
- Komponenten suchen/hinzufügen direkt über den „shadcn MCP“ Workflow in der IDE.
- Vorteil: Demos/Varianten ansehen und mit einem Klick importieren.


## Datenbank einrichten (MySQL/MariaDB)
Das vollständige Schema liegt in `db/schema.sql` und erzeugt standardmäßig die Datenbank `my_app_db`.

Lokale Einrichtung (Beispiel, interaktive Passwortabfrage):
```bash
mysql -u root -p < db/schema.sql
```

Docker‑basierte Einrichtung (Beispiel):
```bash
# MySQL starten (Daten dauerhaft in ./mysql-data)
docker run --name myapp-mysql -e MYSQL_ROOT_PASSWORD=secret \
  -p 3306:3306 -v $(pwd)/mysql-data:/var/lib/mysql -d mysql:8

# Schema anwenden
docker exec -i myapp-mysql mysql -uroot -psecret < db/schema.sql
```

Hinweise:
- Passe den DB‑Namen in `db/schema.sql` bei Bedarf an (`CREATE DATABASE my_app_db;`).
- Das Frontend spricht typischerweise mit einem Backend (REST/GraphQL/tRPC), das auf diese DB zugreift.


## Implementierungsfahrplan (Phasen)
1) Auth & User‑Profil
- Registrierung/Login (z. B. JWT oder Session), Profilseiten, Avatar/Bio.

2) Katalog & Suche
- Listen/Filter nach Kategorien/Tags, Workflow‑Details mit Seller‑Infos.

3) Checkout (Stripe)
- Warenkorb/Einzelkauf, Redirect/Checkout‑Session, Webhook‑Verarbeitung im Backend.
- Nach Zahlung: Eintrag in `workflow_purchases`, Anzeige in „Meine Bibliothek“.

4) Bibliothek & Download
- Gekaufte Workflows listen, Download/Access zählen (`download_count`, `last_accessed_at`).

5) Community
- Follows (`user_follows`), Bewertungen (`workflow_reviews`), Kommentare/Threads (`workflow_comments`).

6) Moderation & Admin
- Einreichungen prüfen (`status`, `approved_by/at`), Gründe dokumentieren (`workflow_moderation_logs`).

7) Support
- Tickets (`support_tickets`) & Nachrichtenverläufe (`support_messages`).

8) Optional: Hosting & Credentials
- Remote‑Hosting, Credential‑Anforderungen (`workflow_credential_requirements`) und Speicherung pro User (`user_workflow_credentials`).


## API‑Verträge (Beispiele)
Die UML‑Datei enthält passende TypeScript‑Interfaces. Beispielhafte REST‑Antworten:

- GET `/api/workflows?status=published&category=marketing`
```json
[
  {
    "id": 123,
    "sellerId": 45,
    "categoryId": 7,
    "title": "n8n: Gmail → Slack Alert",
    "shortDescription": "Benachrichtigt bei neuen Mails",
    "description": "...",
    "platformType": "n8n",
    "price": 19.99,
    "currency": "EUR",
    "deliveryType": "file_download",
    "status": "published",
    "createdAt": "2025-01-01T12:00:00Z",
    "updatedAt": "2025-01-02T09:00:00Z"
  }
]
```

- GET `/api/library` (eingeloggter User)
```json
[
  {
    "purchaseId": 999,
    "workflow": {
      "id": 123,
      "title": "n8n: Gmail → Slack Alert",
      "price": 19.99,
      "currency": "EUR"
    },
    "purchasedAt": "2025-01-02T09:15:00Z",
    "downloadCount": 3
  }
]
```


## Nützliche Dateien
- `src/assets/uml/uml_model.md` – vollständiges Frontend‑Domainmodell inkl. Mermaid‑Diagramm.
- `src/assets/db/database_model.md` – ER‑Diagramm + Tabellenbeschreibung.
- `db/schema.sql` – produktionsnahes MySQL/MariaDB‑Schema.


## Lizenz
MIT (falls nicht anders angegeben).


