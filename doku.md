# 📘 **Projektdokumentation**

**Titel:** *Entwicklung einer Web-Applikation zur Verwaltung von Automatisierungs-Workflows*
**Autor:** Bayram Wilson

---

# **1. Einleitung**

Automatisierungsworkflows haben in den letzten Jahren eine zentrale Bedeutung in Unternehmen jeder Größe gewonnen. Plattformen wie n8n, Zapier, Make oder benutzerdefinierte Python-Skripte ermöglichen es Fachabteilungen und Entwicklern, komplexe Geschäftsprozesse zu automatisieren, Abläufe zu vereinfachen und Fehlerquellen zu reduzieren.

Mit der zunehmenden Verbreitung dieser Tools entsteht jedoch auch ein wachsender Bedarf an effizientem Austausch: Workflows sollen gekauft, verkauft, geteilt, versioniert, bewertet und unterstützt werden können. Bisher existiert für diese Anforderungen kein einheitliches, durchgängiges System, das sowohl Käufer- als auch Verkäuferprozesse abbildet und gleichzeitig Moderation, Support, Datenhaltung und sichere Verwaltung von Workflow-Dateien ermöglicht.

Im Rahmen dieses Projekts habe ich daher eine Web-Applikation entwickelt, die als Marktplatz und Verwaltungsplattform für Automatisierungs-Workflows dient. Das Projekt umfasst die vollständige Implementierung des Frontends mit React, TypeScript und Vite sowie die Verbindung zu einer Express-basierten REST-API und einer MySQL-Datenbank.

Der Schwerpunkt liegt dabei auf der Umsetzung eines funktionsfähigen Systems, das typische Marktplatz-Workflows wie Registrierung, Katalogsuche, Kauf, Download, Verkauf und Dateiverwaltung sauber unterstützt. Die Anwendung bildet die Grundlage für ein später vollwertiges SaaS-Produkt.

---

# **2. Ausgangssituation**

## **2.1 Problemstellung**

Unternehmen und Privatpersonen verwenden zunehmend Automatisierungsplattformen, um wiederkehrende Aufgaben effizienter zu erledigen. Doch der Austausch solcher Workflows ist oft umständlich:

* Workflows existieren nur als JSON-Dateien und müssen „per Hand“ geteilt werden.
* Es gibt keine Versionierung oder Qualitätskontrolle durch Moderation.
* Käufer haben keinen zentralen Ort für Updates, Support oder Bewertungen.
* Verkäufer haben keine Möglichkeit, ihre Workflows strukturiert anzubieten oder Einnahmen zu erzielen.
* Plattformen wie Zapier oder Make haben zwar interne „Template Stores“, diese sind jedoch proprietär und für freie Entwickler kaum nutzbar.
* Der Markt ist fragmentiert: ein Workflow auf n8n ist nicht kompatibel mit Make oder Zapier.

Die zentrale Frage lautete daher:

> **Wie kann eine Web-Applikation gestaltet werden, die den Austausch, Kauf und Verkauf von Automatisierungs-Workflows benutzerfreundlich, sicher und nachvollziehbar macht?**

---

## **2.2 Projektziel**

Das Ziel dieses Projekts bestand darin, eine vollständige Frontend-Anwendung zu entwickeln, die:

* den kompletten Lebenszyklus eines Workflows abbildet (Anlegen → Validieren → Veröffentlichen → Kaufen → Nutzen),
* Käufer und Verkäufer gleichermaßen unterstützt,
* eine moderne, performante Benutzeroberfläche bereitstellt,
* sicher mit Authentifizierung, Cookie-basierten Sessions, Validierungen und Schutzmechanismen arbeitet,
* auf einer soliden technischen Basis aufsetzt, die zukünftige Erweiterungen zulässt.

Dabei sollte die Anwendung sowohl funktionale Anforderungen (z. B. Kaufen, Download) als auch nicht-funktionale Anforderungen (z. B. Sicherheit, Performance) erfüllen.

---

## **2.3 Funktionale Anforderungen**

Die wichtigsten funktionalen Anforderungen, basierend auf Projektanalyse, Kundengesprächen und Datenbankmodell:

### **Benutzer & Auth**

* Registrierung mit E-Mail, Anzeigename und starkem Passwort
* Login & Logout über sicheren HttpOnly JWT-Cookie
* Profilbearbeitung (Display Name, Avatar, Bio)

### **Katalog**

* Workflow-Liste mit Suchfeld, Kategorie-Filter, Tags und Sortierung
* Detailansicht mit Beschreibung, Preis, Seller-Infos und Tags
* Anzeige von Kaufanzahl und Status

### **Kauf & Bibliothek**

* „Simulierter Checkout“ inkl. Order, OrderItem und WorkflowPurchase
* Bibliotheksübersicht mit gekauften Workflows
* Downloadfunktion inkl. Download-Zähler & Logging
* Anzeige des Kaufdatums

### **Verkauf / Seller Dashboard**

* Entwürfe anlegen
* Workflows bearbeiten (Preis, Plattformtyp, Kategorien, Tags, Beschreibung)
* Dateien hochladen
* Workflows validieren
* Publizieren & Depublizieren

### **Community & Support (optional vorbereitet)**

* Ratings
* Kommentare
* Follows
* Ticketsystem für Support

---

## **2.4 Nicht-funktionale Anforderungen**

### **Sicherheit**

* Passwort-Hashing mit Argon2id
* Sessionverwaltung über HttpOnly-Cookie
* Passwortstärke ≥ 12 Zeichen
* Validierung von Workflow-Artefakten (JSON-Parsing)

### **Benutzerfreundlichkeit**

* Konsistente UI (shadcn/ Radix UI)
* Responsive Design
* Schnell ladende SPAs durch Vite

### **Performance**

* Katalog mit serverseitiger Paginierung
* effiziente SQL-Queries
* Caching-Vorbereitung möglich

### **Robustheit**

* Nutzung von TypeScript im Frontend
* Nutzung von ts-node / TypeScript im Backend
* Fehlerzustandsmanagement im API-Client

---

## **2.5 Stakeholder**

| Rolle      | Beschreibung                                     |
| ---------- | ------------------------------------------------ |
| Käufer     | Sucht Workflows nach Kriterien und kauft diese   |
| Verkäufer  | Erstellt und verwaltet eigene Workflows          |
| Admin      | Moderiert Inhalte, unterstützt bei Supportfällen |
| System     | Express-API, MySQL-Datenbank, Dateisystem        |
| Entwickler | Verantwortlich für Implementierung & Architektur |

---

# **3. Ressourcen- und Ablaufplanung**

## **3.1 Technische Ressourcen**

* **Frontend**: React, TypeScript, Vite
* **UI**: TailwindCSS v4, shadcn components, Radix UI
* **Backend**: Node.js, Express 5, mysql2/promise
* **Datenbank**: MySQL / MariaDB
* **Tools**: ESLint, TypeScript, concurrently
* **Dateispeicher**: `storage/workflows/*` für JSON-Workflows
* **Diagramme**:

  * ![ERD](./assets/db/ERD.png)
  * ![UML](./assets/uml/UML.png)

---

## **3.2 Rollen und Systemübersicht**

Das System besteht aus:

* **Frontend SPA**
* **Backend API**
* **Database Layer** (MySQL)
* **File Storage Layer**

Jede Rolle interagiert mit unterschiedlichen Teilen der Anwendung:

* Käufer → Katalog, Detailseite, Kauf, Bibliothek
* Verkäufer → Dashboard, Editor, Upload, Publish
* Admin → zukünftig Moderation, Support
* Supportrolle → Ticketsystem

---

## **3.3 Abhängigkeiten**

### Zwischen Systemen:

* frontend → backend: Via VITE_API_BASE_URL
* backend → database: Via MySQL Connection Pool
* backend → storage: Artefakte im Dateisystem
* frontend → cookies: Auth ist Cookie-basiert

### Zwischen Modulen:

* AuthProvider → API-Client
* Pages → API-Client
* Seller-Router → multer, fs/promises
* Library-Router → dateiabhängige Pfade

---

## **3.4 Projektablaufplan**

### Geplante Phasen

1. Authentifizierung & Profilverwaltung
2. Katalog & Workflow-Detailseite
3. Kaufprozess + Bibliothek
4. Upload & Seller Dashboard
5. Workflow-Editor
6. Validierung & Publish-Mechanismus
7. Optional: Community, Support, Moderation

### Zeitaufteilung (35h-Modell)

| Phase                         | Aufwand |
| ----------------------------- | ------- |
| Analyse & Planung             | 4h      |
| Implementierung Frontend      | 18h     |
| Implementierung Backend-bezug | 7h      |
| Tests, Optimierungen          | 2h      |
| Dokumentation                 | 4h      |

---

## **3.5 Meilensteine**

* **M1:** Login & Registrierung funktionsfähig
* **M2:** Katalog + Kategorien + Tags
* **M3:** Kaufprozess inkl. DB-Einträge
* **M4:** Bibliothek mit Download
* **M5:** Seller-Dashboard inkl. Publish
* **M6:** Workflow-Editor mit Upload
* **M7:** Validierung & Veröffentlichung

---

# **4. Auftragsbearbeitung**

Dieses Kapitel beschreibt den Kern der technischen Umsetzung. Es zeigt, welche Module entwickelt wurden, wirft einen Blick auf alle relevanten Prozesse und gibt einen Überblick über Datenmodelle, Algorithmen und Schnittstellen. Die Umsetzung erfolgte sowohl im Backend (Express, MySQL) als auch im Frontend (React, TypeScript, Vite).

---

## **4.1 Wichtigste Module**

### **4.1.1 Express API Server**

Der Express-Server bildet die zentrale Kommunikationsschicht zwischen Frontend und Datenbank. Er initialisiert einen MySQL-Connection-Pool, aktiviert CORS (inkl. Cookie-Weitergabe), bindet Middleware wie `cookie-parser` und JSON-Parsing ein und mountet alle Routen unter `/api`.
Darüber hinaus liest er sämtliche Umgebungskonfigurationen wie `DB_HOST`, `JWT_SECRET` und `ORIGIN` ein und startet anschließend den HTTP-Server.

---

### **4.1.2 AuthRouter**

Der AuthRouter stellt die typischen Authentifizierungsfunktionen bereit:

* Registrierung
* Login
* Logout
* Session-Wiederherstellung (`/api/me`)
* Profilaktualisierung

Passwörter werden ausschließlich als Argon2id-Hashes gespeichert.
Die Authentifizierung erfolgt über einen signierten JWT, der als HttpOnly-Cookie gesetzt wird. Dadurch wird eine sessionartige Anmeldung realisiert, ohne den Token im Browser-Speicher zu hinterlegen.

---

### **4.1.3 CatalogRouter**

Dieser Router liefert alle Informationen für den öffentlichen Workflow-Marktplatz. Er implementiert:

* das Browsen und Filtern von Workflows
* Paginierung
* Suche
* Tag- und Kategorie-Filter
* Detailinformationen zu einzelnen Workflows

Die Datenbankabfragen sind dynamisch aufgebaut: Bei jedem Request wird abhängig vom Query-Parameter ein individuelles SQL-Statement generiert (z. B. nur Workflows eines bestimmten Sellers, einer Kategorie oder mit bestimmten Tags).

---

### **4.1.4 LibraryRouter**

Der LibraryRouter verwaltet alle bereits gekauften Workflows eines Nutzers.
Er umfasst:

* das Auslesen der persönlichen Bibliothek
* den Dateidownload
* das Aktualisieren von Download-Statistiken
* den simulierten Kaufprozess

Beim Download wird neben dem eigentlichen Datei-Stream gleichzeitig der Downloadzähler erhöht und das letzte Zugriffsdatum aktualisiert.

---

### **4.1.5 SellerRouter**

Der SellerRouter ermöglicht es Nutzern, selbst zu Verkäufern zu werden.
Er bietet Funktionen für:

* Anlegen neuer Workflow-Entwürfe
* Aktualisieren bestehender Workflows
* Upload von Workflow-Dateien
* Validieren von Workflows vor der Veröffentlichung
* Publizieren und Depublizieren

Tags werden dabei automatisch per Upsert-Logik verwaltet. Auch der Datei-Upload (z. B. eines n8n-Workflows) wird hier abgewickelt und in einer festen Verzeichnisstruktur im Projekt gespeichert.

---

## **4.2 Frontend-Module**

### **4.2.1 Frontend Bootstrap**

Die Einstiegspunkte `main.tsx` und `index.html` initialisieren die React-Anwendung.
Hier wird:

* die gesamte App per `createRoot` gerendert,
* der ThemeProvider eingebunden,
* Tailwind CSS geladen
* und das zentrale Layout geladen.

---

### **4.2.2 AuthProvider**

Der AuthProvider ist das wichtigste Frontend-Modul für Nutzeridentität.
Er übernimmt:

* Session-Management
* Laden von `/api/me` beim ersten App-Start
* Bereitstellung der Funktionen `login`, `register`, `logout`, `updateProfile`
* Halten des aktuellen Nutzers im Kontext

Damit wird die komplette Authentifizierung im Frontend gekapselt und zentral verwaltet.

---

### **4.2.3 API-Client**

Der API-Client stellt typisierte Funktionen bereit, die direkt mit der Express-API kommunizieren.
Er deckt das gesamte System ab, unter anderem:

* Workflows abrufen
* Kategorien & Tags laden
* Käufe durchführen
* Bibliothek abrufen
* Dateien herunterladen
* Verkäufer-Funktionen (Entwürfe, Upload, Validierung, Publish)

Dadurch bleibt der Zugriff auf API-Ressourcen einheitlich und typensicher.

---

### **4.2.4 UI-Komponenten**

Die wichtigsten UI-Bausteine wie Button, Card, Input, Badge, Avatar und NavigationMenu basieren auf Tailwind CSS und Radix UI.
Sie stellen das konsistente Erscheinungsbild der App sicher und ermöglichen eine saubere Trennung von Layout und Business-Logik.

---

## **4.3 Hauptprozesse**

### **4.3.1 Registrierung und Login**

Der Registrierungsprozess läuft wie folgt:

1. Nutzer füllt Formular aus
2. Frontend sendet Daten an POST `/api/auth/register`
3. Backend prüft:

   * Passwortstärke
   * Eindeutigkeit der Daten
4. Passwort wird gehasht
5. JWT-Cookie wird gesetzt
6. Nutzer ist eingeloggt

Beim Login erfolgt ein ähnlicher Ablauf, jedoch wird das Passwort verifiziert und nur ein bereits vorhandener Datensatz zurückgegeben.

---

### **4.3.2 Katalogsuche und Filterung**

Beim Öffnen der Katalogseite liest das Frontend zuerst:

* Kategorien
* Tags

Anschließend fragt es die Workflows ab.
Ändert der Nutzer Filter oder Suchtext, wird automatisch ein neuer Request an `/api/workflows` gesendet.
Die SQL-Abfragen werden je nach Parameter dynamisch aufgebaut, z. B.:

* Suchtext → LIKE-Filter
* Kategorie → WHERE + JOIN
* Tag-Filter → zusätzlicher JOIN + GROUP BY
* Sortierung → ORDER BY

Das Ergebnis wird paginiert zurückgegeben.

---

### **4.3.3 Kaufprozess**

Der Kauf erfolgt in dieser Version simuliert, d. h. Stripe ist angelegt, aber nicht aktiv.
Der Prozess:

1. Nutzer klickt “Kaufen”
2. Request an `/api/purchase/:workflowId`
3. Backend prüft:

   * Existiert der Workflow?
   * Ist er veröffentlicht?
   * Wurde er bereits gekauft?
4. Es entstehen:

   * Order
   * OrderItem
   * WorkflowPurchase
5. Der Workflow erscheint sofort in der Bibliothek

Diese vereinfachte Simulation bildet dennoch den kompletten technischen Flow nach.

---

### **4.3.4 Download eines Workflows**

Beim Download prüft das Backend:

1. Gehört der Kauf dem eingeloggten Nutzer?
2. Existiert die Datei?
3. Handelt es sich tatsächlich um eine Datei und keinen Ordner?

Danach wird die Datei per Stream übertragen und gleichzeitig:

* `download_count` erhöht
* `last_accessed_at` aktualisiert

Diese Mechanik ermöglicht außerdem ein zukünftiges Lizenz-Tracking.

---

### **4.3.5 Lebenszyklus eines Verkäufer-Workflows**

Ein Workflow durchläuft folgende Zustände:

* **DRAFT**
* **PUBLISHED**
* **UNPUBLISHED**

Der Editor ermöglicht:

* Bearbeiten aller Felder
* Hochladen einer JSON-Datei
* Validieren
* Publizieren

Die Validierung umfasst:

* Titel gesetzt?
* Preis gültig?
* Delivery-Typ korrekt?
* Datei vorhanden?
* JSON syntaktisch korrekt?

Erst danach kann ein Workflow veröffentlicht werden.

---

## **4.4 Wichtigste Klassen & Verantwortlichkeiten**

Die wichtigsten Klassen basieren auf dem UML-Modell:

* **User**: Käufer oder Verkäufer, Profilinformationen
* **Workflow**: Produkt, das verkauft und gekauft wird
* **WorkflowCategory**: hierarchische Kategorie
* **WorkflowTag**: Schlagwort
* **WorkflowPurchase**: Besitz eines Workflows
* **Order / OrderItem**: Kaufvorgänge
* **WorkflowReview**: Kundenbewertungen
* **WorkflowComment**: Diskussionen / Threads
* **SupportTicket**: Problemfälle
* **WorkflowModerationLog**: Dokumentation der Admin-Entscheidungen

Damit entsteht ein flexibles, aber klar strukturiertes Domain-Modell.

---

## **4.5 Endpunkte der API**

Die API umfasst u. a.:

* `/api/auth/...`
* `/api/workflows`
* `/api/categories`
* `/api/tags`
* `/api/library/...`
* `/api/purchase/...`
* `/api/seller/workflows/...`

Jeder Endpunkt folgt einem klaren Schema:

* Request validieren
* SQL-Abfrage durchführen
* Ergebnis als JSON zurückgeben
* Fehler konsistent behandeln

---

## **4.6 Datenmodelle**

### **4.6.1 Relationales Datenbankmodell**

Die Datenbank basiert auf MySQL/MariaDB mit vollständigen Normalformen und Fremdschlüsseln. Tabellen wie `workflows`, `orders`, `workflow_purchases` und `workflow_tags` bilden den kompletten Marktplatz ab.

---

### **4.6.2 Frontend-Modelle**

Die TypeScript-Modelle spiegeln das Backend-Modell wider und ermöglichen typsichere Kommunikation zwischen API und UI.

---

## **4.7 Datenflüsse**

Typische Flüsse:

* **Registrierung** → AuthRouter → users
* **Login** → JWT-Cookie → Session
* **Katalog** → dynamic SQL → Workflows
* **Kauf** → orders → order_items → workflow_purchases
* **Download** → Dateisystem → Logging
* **Seller-Workflow** → workflows → workflow_tag_assignments

Alle Flüsse sind klar voneinander getrennt und modular aufgebaut.

---

## **4.8 Algorithmen & Logik**

Besondere Logik:

* Passwortstärkeprüfung
* Hashing mit Argon2id
* JWT-Authentifizierung
* SQL-Query-Builder
* Tag-Upsert
* Validierungslogik für JSON-Workflows
* Downloadzähler & letzter Zugriff

Diese Mechanismen gewährleisten Sicherheit und Datenintegrität.

---

# **5. Durchführung**

Im folgenden Abschnitt wird beschrieben, wie das Projekt tatsächlich umgesetzt wurde und welche Schritte chronologisch erfolgt sind.

---

## **5.1 Chronologischer Ablauf**

1. Datenbankmodell fertiggestellt
2. Erstellung der Tabellen im Schema
3. Seed-Daten eingespielt
4. Express-Server aufgebaut
5. Authentifizierung implementiert
6. Katalogfunktionen entwickelt
7. Bibliotheksfunktionen entwickelt
8. Simulierter Kaufprozess umgesetzt
9. Verkäuferbereich programmiert
10. Workflow-Editor entwickelt
11. UI-Komponenten erstellt
12. Tests auf Funktion & UX
13. Optimierungen & Endabnahme

---

## **5.2 Technische Entscheidungen**

Die Technologieauswahl wurde anhand folgender Gründe getroffen:

* **React + TypeScript:** hohe Wiederverwendbarkeit, starke Typsicherheit
* **Express:** schlank, flexibel, weit verbreitet
* **MySQL:** relationales Modell mit klaren Abhängigkeiten
* **JWT im HttpOnly-Cookie:** sicher, keine Speicherung im LocalStorage
* **Tailwind CSS + shadcn:** schnelle UI-Entwicklung
* **Argon2id:** moderne Passwortsicherheit

---

## **5.3 Probleme und Abweichungen**

* Stripe-Checkout nicht implementiert → simuliert
* Community-Features vorhanden, aber nicht umgesetzt
* Moderations- und Supportsystem vorbereitet, aber nicht produktiv
* Fokus auf Kernprozesse des Marktplatzes
* Zeitplanung erschwert durch parallele Arbeit an Backend & Frontend

---

# **6. Projektergebnisse**

In diesem Kapitel werden die im Projekt erzielten Ergebnisse den geplanten Anforderungen gegenübergestellt. Zudem wird die Qualitätssicherung erläutert und bewertet, inwiefern die im Projekt definierten Ziele erreicht wurden.

---

## **6.1 Erreichte Funktionalitäten**

Im Rahmen des Projekts wurde eine voll funktionsfähige Webapplikation zur Verwaltung und Vermarktung von Automatisierungs-Workflows entwickelt. Die wichtigsten Features im Überblick:

### **6.1.1 Authentifizierung & Benutzerverwaltung**

* Registrieren neuer Nutzer mit Passwortstärke-Prüfung
* Login mit Argon2id-Verifizierung
* Sichere Session mittels JWT im HttpOnly-Cookie
* Profilverwaltung (Anzeige-Name, Avatar, Biografie)

Diese Funktionen bilden das Fundament der Plattform und ermöglichen sowohl Käufern als auch Verkäufern die Nutzung aller Marktplatzfunktionen.

---

### **6.1.2 Workflow-Marktplatz**

* Durchsuchbarer und filterbarer Katalog
* Kategorien und Tags zur strukturierten Navigation
* Detailansicht für einzelne Workflows
* Anzeigen von Preis, Beschreibung, Tags, Plattform und Verkäufer

Dadurch entsteht ein vollwertiges Marketplace-Erlebnis.

---

### **6.1.3 Kaufprozess (simuliert)**

Obwohl Stripe nicht vollständig integriert wurde, unterstützt das System:

* Erstellen von Orders
* Erstellen von OrderItems
* Anlegen von WorkflowPurchases
* Erhöhen der Kaufanzahl pro Workflow

So kann der komplette Kaufprozess durchlaufen werden, ohne eine externe Payment-Integration zu benötigen.

---

### **6.1.4 Persönliche Bibliothek**

* Auflistung der gekauften Workflows
* Downloadfunktion mit Logging
* Aktualisierung von Downloadzähler und letztem Zugriff

Damit ist der Mehrwert des Marktplatzes — der tatsächliche Zugriff auf die gekauften Inhalte — vollständig gegeben.

---

### **6.1.5 Verkäufer-Funktionen**

Verkäufer können:

* neue Workflows anlegen
* bestehende bearbeiten
* Dateien hochladen
* Kategorien setzen
* Tags zuordnen
* Workflows veröffentlichen oder depublizieren
* Validierungen ausführen

Dies bildet ein vollständiges „Seller Dashboard“ ab.

---

### **6.1.6 Datenmodell & Architektur**

* Vollständig normalisierte relationale Datenbank
* Ausgereiftes Domain-Modell (inkl. Support, Reviews, Moderation etc.)
* Typisierte API im Frontend
* Konsistentes UI-Framework

Auch wenn noch nicht alle Features implementiert sind, ist die Grundlage bereits produktionsreif.

---

## **6.2 Nicht umgesetzte Features**

Für spätere Versionsstände vorgesehen, aber nicht umgesetzt:

* **Stripe-Zahlungsintegration**
* **Community-Features** (Bewertungen, Follows, Kommentare)
* **Support-Ticketsystem**
* **Moderation & Admin-Workflow**
* **Credential-Management & gehostete Workflows**

Diese Punkte sind im Datenmodell berücksichtigt, jedoch in der Funktionalität nicht implementiert worden.
Im Rahmen der Projektzeit (35 Stunden) war das vollständige Abdecken aller Funktionen nicht realistisch, weshalb der Fokus auf Kernfeatures lag.

---

## **6.3 Soll-Ist-Vergleich**

| Kategorie              | Soll        | Ist             |
| ---------------------- | ----------- | --------------- |
| Authentifizierung      | ✔︎          | ✔︎              |
| Profilbearbeitung      | ✔︎          | ✔︎              |
| Workflow-Katalog       | ✔︎          | ✔︎              |
| Workflow-Details       | ✔︎          | ✔︎              |
| Kaufvorgang            | ✔︎ (Stripe) | ✔︎ (simuliert)  |
| Persönliche Bibliothek | ✔︎          | ✔︎              |
| Datei-Downloads        | ✔︎          | ✔︎              |
| Verkäufer-Tools        | ✔︎          | ✔︎              |
| Moderation             | optional    | nur Datenmodell |
| Support                | optional    | nur Datenmodell |
| Reviews/Kommentare     | optional    | nur Tabellen    |
| Credential-Handling    | optional    | nur Tabellen    |

Der Kern des Projekts — **die Verwaltung, der Kauf, der Upload, die Einsicht und der Download von Workflows** — wurde vollständig umgesetzt.

---

## **6.4 Qualitätssicherung**

### **6.4.1 Manuelle Tests**

Folgende Bereiche wurden intensiv getestet:

* Registrierung & Login
* Session-Wiederherstellung
* Katalogfilter (Kategorie, Suche, Tags)
* Kaufprozess & Mehrfachkäufe
* Downloadberechtigungen
* Uploads & Dateiformat-Prüfungen
* Seller-Dashboard Abläufe
* Validierung & Publizieren
* Datenbankkonsistenz

### **6.4.2 Linting & Statische Analyse**

Das Projekt nutzt:

* **TypeScript** (strikter Typmodus)
* **ESLint**
* automatische Formatierung gemäß shadcn-Konventionen
* Tailwind-Merge zur Vermeidung redundanter Styles

### **6.4.3 Sicherheit**

* Hashing: Argon2id
* Speicherung in HttpOnly-Cookies
* Kein LocalStorage für Tokens
* Validierung aller Eingaben
* Prüfung der Dateipfade beim Download

### **6.4.4 Code-Qualität**

Der Code wurde modular und wartbar strukturiert:

* Router im Backend
* Typisierte API-Funktionen
* Wiederverwendbare UI-Komponenten
* Services und Utility-Funktionen

---

## **6.5 Projekterfolg**

Das Projekt kann als erfolgreich bewertet werden, da:

* alle Kernprozesse vollständig funktionieren
* die technische Basis für spätere Erweiterungen gelegt wurde
* die Plattform bereits nutzbar ist (Kauf, Bibliothek, Upload, Katalog)
* Architektur und Datenmodell langfristig erweiterbar sind

---

# **7. Fazit und Reflexion**

## **7.1 Zielerreichung**

Das Ziel bestand darin, eine Web-Applikation zur Verwaltung und Vermarktung von Automatisierungs-Workflows zu entwickeln. Dieses Ziel wurde erreicht.
Es existiert nun eine funktionierende Plattform, die End-to-End alle relevanten Schritte abbildet:

* Nutzer können sich registrieren und anmelden
* Workflows im Marktplatz durchsuchen
* Workflows kaufen (simuliert)
* Workflows herunterladen
* Eigene Workflows verwalten, bearbeiten und veröffentlichen

Damit bildet die Anwendung ein vollständiges MVP eines Workflow-Marktplatzes.

---

## **7.2 Erkenntnisse**

Während des Projekts wurden mehrere wichtige Erkenntnisse gewonnen:

### **Technische Lerneffekte**

* Aufbau einer skalierbaren REST-API
* Umgang mit MySQL/relationalen Datenmodellen
* Sichere Authentifizierung (JWT + HttpOnly-Cookies)
* Datei-Uploads und Stream-basierte Downloads
* Dynamische SQL-Abfragen
* Vollständige React-SPA mit Routing, State-Management und typisierten API-Calls
* Strukturierte UI-Entwicklung mit shadcn / Tailwind

### **Organisatorische Lerneffekte**

* Komplexe Projekte profitieren stark von einer klaren Aufteilung in Module
* Ein gutes Datenmodell spart später massiv Zeit
* Priorisierung ist essenziell, um ein funktionierendes MVP zu bauen
* Dokumentation (laufend, nicht nachträglich) beschleunigt Arbeitsprozesse

---

## **7.3 Herausforderungen**

Besonders anspruchsvoll waren:

* parallele Entwicklung von Frontend und Backend
* sichere Implementierung der Authentifizierung
* dynamische SQL-Filterlogik im Katalog
* Upload und Validierung von JSON-Workflow-Dateien
* Zeitbegrenzung des Projekts

Die Herausforderungen konnten durch iteratives Arbeiten und Priorisierung erfolgreich gelöst werden.

---

## **7.4 Ausblick**

Für die Zukunft ist geplant:

* vollständige Stripe-Integration
* Veröffentlichung von Workflows durch Admin-Moderation
* Community-Features (Kommentare, Bewertungen, Follow-System)
* Support-Ticketsystem
* gehostete Workflows (z. B. n8n-Instanzen je Nutzer)
* Credential-Management mit Verschlüsselung

Die Softwarearchitektur ist bewusst so gestaltet, dass diese Erweiterungen ohne größere Umbauten möglich sind.

---

## **7.5 Schlussbetrachtung**

Das Projekt liefert eine funktionale Plattform, die bereits reale Nutzer bedienen könnte.
Es erfüllt alle zentralen Ziele und bildet die Basis für einen produktiven Marktplatz.

Insbesondere die Kombination aus solider Datenbankarchitektur, sauberem API-Design und moderner Frontend-Implementierung zeigt, dass die Anwendung auf Erweiterbarkeit und langfristigen Einsatz ausgelegt ist.

---

