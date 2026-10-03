# Open Numeric API

Backend NestJS + Prisma 7 + PostgreSQL pour le site **Open Numeric** et son
dashboard d'administration.

---

## 📖 Table des matières

- [Stack technique](#-stack-technique)
- [Démarrage rapide](#-démarrage-rapide)
- [Architecture](#-architecture)
- [Authentification](#-authentification)
- [Endpoints — Vue d'ensemble](#-endpoints--vue-densemble)
- [Endpoints publics (site)](#-endpoints-publics-site)
- [Endpoints admin (dashboard)](#-endpoints-admin-dashboard)
- [Modèle de données](#-modèle-de-données)
- [Sécurité](#-sécurité)
- [Variables d'environnement](#-variables-denvironnement)
- [Scripts NPM](#-scripts-npm)
- [Roadmap](#-roadmap)

---

## 🛠 Stack technique

| Composant | Version | Rôle |
|---|---|---|
| **NestJS** | 12 | Framework HTTP |
| **Prisma** | 7 | ORM + migrations |
| **PostgreSQL** | Prisma Cloud | Base de données |
| **Passport JWT** | 12 | Authentification |
| **bcrypt** | 6 | Hachage des mots de passe |
| **@nestjs/throttler** | 6 | Rate limiting |
| **@nestjs/swagger** | 12 | Documentation auto |
| **Multer** | 2 | Upload de fichiers |
| **class-validator** | 0.15 | Validation DTOs |
| **TypeScript** | 6 | Typage strict |

---

## 🚀 Démarrage rapide

### 1. Installation

```bash
npm install
```

### 2. Configuration

Crée un fichier `.env` à la racine :

```env
# APP
NODE_ENV=development
PORT=5000

# DATABASE (Prisma Cloud)
DATABASE_URL="postgres://...@pooled.db.prisma.io:5432/postgres?sslmode=require"
DIRECT_URL="postgres://...@db.prisma.io:5432/postgres?sslmode=require"

# JWT
JWT_ACCESS_SECRET=open-numeric-jwt-access-secret-token
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=open-numeric-jwt-refresh-secret-token
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=http://localhost:3000

# SWAGGER
SWAGGER_ENABLED=true

# RATE LIMIT
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100

# SEED (à retirer en prod)
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_PASSWORD=ChangeMe123!
SEED_ADMIN_DISPLAY_NAME=Super Admin
SEED_ADMIN_EMAIL=admin@open-numeric.com
```

### 3. Base de données

```bash
npx prisma migrate dev       # Applique les migrations
npx prisma generate          # Génère le client Prisma
```

### 4. Seed initial

```bash
npm run seed                 # Injecte les données de démarrage
npm run seed:reset           # Reset complet + seed
```

### 5. Lancer le serveur

```bash
npm run start:dev            # Dev avec hot-reload
npm run start:prod           # Prod (build requis)
```

**URLs** :
- API : `http://localhost:5000/api`
- Swagger : `http://localhost:5000/docs`
- Uploads : `http://localhost:5000/uploads/<fichier>`

---

## 🏗 Architecture

```
src/
├── main.ts                     # Bootstrap + config globale
├── app.module.ts               # Module racine
├── common/                     # Transversal
│   ├── decorators/             # @Public, @Roles, @CurrentUser
│   ├── guards/                 # JwtAuthGuard, RolesGuard
│   └── types/                  # Locale, types partagés
├── config/                     # Config typée + validation .env
├── generated/prisma/           # Client Prisma (auto-généré)
├── prisma/                     # PrismaService global
└── modules/                    # Modules métier
    ├── auth/                   # Login, refresh, logout
    ├── admin/                  # CRUD admins
    ├── settings/               # Config site (singleton)
    ├── navigation/             # Menus (récursif)
    ├── services/               # Services + catégories + items
    ├── projects/               # Portfolio (projets)
    ├── team/                   # Équipe
    ├── clients/                # Clients (logos)
    ├── testimonials/           # Témoignages
    ├── socials/                # Réseaux sociaux
    ├── contact/                # Formulaire de contact
    ├── quote/                  # Demandes de devis
    ├── uploads/                # Fichiers (images)
    ├── stats/                  # Statistiques dashboard
    ├── search/                 # Recherche globale
    └── health/                 # Health check
```

**Chaque module suit le même pattern** :
```
modules/<entity>/
├── dto/                        # Validation + Swagger
├── repositories/               # Accès Prisma
├── <entity>.controller.ts      # Routes HTTP
├── <entity>.service.ts         # Logique métier
└── <entity>.module.ts          # Wiring Nest
```

---

## 🔐 Authentification

### Mécanisme

- **JWT dans cookies httpOnly** (pas de token côté JS → protection XSS)
- **Refresh token** avec rotation à chaque refresh
- **Hash bcrypt** du refresh token en DB (jamais en clair)
- **Roles** : `ADMIN` (tout) et `EDITOR` (contenu)

### Cookies posés

| Cookie | HttpOnly | Path | Durée | Rôle |
|---|---|---|---|---|
| `on.accessToken` | ✅ | `/` | 15 min | Access token |
| `on.refreshToken` | ✅ | `/api/auth` | 7 jours | Refresh token |
| `on.user` | ❌ | `/` | 7 jours | Profil (lisible JS) |

### Flux

```
1. POST /api/auth/login { username, password }
   → Set-Cookie: on.accessToken, on.refreshToken, on.user
   → Body: { user }

2. GET /api/auth/me (cookie auto)
   → { id, username, displayName, email, role }

3. POST /api/auth/refresh (cookie auto, tous les 15 min)
   → Set-Cookie: nouveau on.accessToken + on.refreshToken

4. POST /api/auth/logout
   → Clear-Cookie
```

---

## 📡 Endpoints — Vue d'ensemble

### Légende

- 🟢 **Public** — accessible sans authentification
- 🔵 **Auth** — accessible à tout admin connecté
- 🟠 **ADMIN + EDITOR** — contenu (accessible aux deux rôles)
- 🔴 **ADMIN only** — gestion critique

### Tableau récapitulatif

| Domaine | Public | Admin |
|---|---|---|
| **Auth** | 🟢 login, refresh | 🔵 me, logout |
| **Admin** | — | 🔴 CRUD complet |
| **Settings** | 🟢 GET | 🔴 PATCH |
| **Nav** | 🟢 GET (arbre actif) | 🟠 CRUD + reorder |
| **Services** | 🟢 GET, GET :slug | 🟠 CRUD complet (services + catégories + items) |
| **Projects** | 🟢 GET, GET :slug, similar | 🟠 CRUD complet |
| **Team** | 🟢 GET | 🟠 CRUD |
| **Clients** | 🟢 GET | 🟠 CRUD |
| **Testimonials** | 🟢 GET | 🟠 CRUD |
| **Socials** | 🟢 GET | 🟠 CRUD |
| **Contact** | 🟢 POST | 🟠 GET, PATCH status / 🔴 DELETE |
| **Quote** | 🟢 POST | 🟠 GET, PATCH status / 🔴 DELETE |
| **Uploads** | 🟢 GET /uploads/* | 🟠 POST, GET / 🔴 DELETE |
| **Stats** | — | 🟠 GET |
| **Search** | 🟢 GET | — |
| **Health** | 🟢 GET | — |

---

## 🌐 Endpoints publics (site)

Toutes ces routes sont accessibles **sans authentification**. Le site public
consomme ces endpoints.

### Site Settings

```http
GET /api/settings
```
Retourne la config complète (contacts, réseaux, meta) + **toutes les traductions**.

### Navigation

```http
GET /api/nav
```
Retourne l'**arbre récursif** des menus actifs (avec sous-menus), toutes traductions.

### Services

```http
GET /api/services                # Liste complète (catégories + items + traductions)
GET /api/services/:slug          # Détail d'un service
```

### Projects (Portfolio)

```http
GET /api/projects?page=1&limit=9&category=WEB,API&scope=CLIENT&year=2025&tech=Next.js&search=ecommerce&featured=true
GET /api/projects/slug/:slug
GET /api/projects/slug/:slug/similar
```

Filtres disponibles :
- `page`, `limit`
- `category` (multi, séparé par virgules)
- `scope` (multi)
- `status`
- `year` (multi)
- `tech` (multi)
- `search`
- `featured`

### Team

```http
GET /api/team
```

### Clients

```http
GET /api/clients
```

### Testimonials

```http
GET /api/testimonials
```

### Socials

```http
GET /api/socials
```

### Contact (formulaire)

```http
POST /api/contact
Content-Type: application/json

{
  "name": "Jean Dupont",
  "email": "jean@exemple.com",
  "subject": "Demande",
  "message": "..."
}
```
**Rate limit** : 3 requêtes / minute.

### Quote (devis)

```http
POST /api/quote
Content-Type: application/json

{
  "name": "Jean Dupont",
  "company": "Ma PME",
  "email": "jean@exemple.com",
  "phone": "+226 65 00 00 00",
  "projectType": "webApp",
  "budget": "2k5k",
  "timeline": "1m3m",
  "description": "..."
}
```
**Rate limit** : 2 requêtes / minute.

### Search (recherche globale)

```http
GET /api/search?q=ecommerce&locale=fr&types=project,service&limit=20
```

Réponse :
```json
{
  "query": "ecommerce",
  "locale": "fr",
  "total": 1,
  "results": [
    {
      "type": "project",
      "id": "...",
      "slug": "ecommerce-multi-vendeurs",
      "title": "Plateforme E-commerce Multi-vendeurs",
      "excerpt": "Marketplace complète avec paiement sécurisé.",
      "url": "/portfolio/ecommerce-multi-vendeurs",
      "locale": "fr",
      "score": 70
    }
  ],
  "byType": { "project": 1 },
  "generatedAt": "..."
}
```

### Health

```http
GET /api/health
```
```json
{
  "status": "ok",
  "uptime": 1234,
  "timestamp": "2026-10-03T...",
  "version": "0.0.1",
  "checks": {
    "database": { "status": "up", "responseTime": 12 }
  }
}
```

---

## 🛡 Endpoints admin (dashboard)

Toutes ces routes nécessitent une **authentification** (cookie `on.accessToken`).

### Auth

```http
POST /api/auth/login              # { username, password } — PUBLIC
POST /api/auth/refresh            # renouvelle les tokens — PUBLIC
GET  /api/auth/me                 # profil admin connecté
POST /api/auth/logout             # révoque le refresh token
```

### Admins (ADMIN only)

```http
POST   /api/admins                # Créer un admin
GET    /api/admins                # Lister
GET    /api/admins/:id            # Détail
PATCH  /api/admins/:id            # Modifier
DELETE /api/admins/:id            # Supprimer (impossible si dernier)
```

### Settings (ADMIN only)

```http
GET   /api/settings               # PUBLIC
PATCH /api/settings               # Modifier (scalars + translations[])
```

### Navigation

```http
GET    /api/nav                   # PUBLIC — arbre actif
GET    /api/nav/admin/all         # Liste à plat (même inactifs)
GET    /api/nav/admin/:id         # Détail
POST   /api/nav                   # Créer
PATCH  /api/nav/reorder           # Réordonner en masse
PATCH  /api/nav/:id               # Modifier
DELETE /api/nav/:id               # Supprimer (cascade)
```

### Services

```http
GET    /api/services                          # PUBLIC
GET    /api/services/:slug                    # PUBLIC
GET    /api/services/admin/all                # Liste admin
GET    /api/services/admin/:id                # Détail admin
POST   /api/services                          # Créer (avec catégories + items)
PATCH  /api/services/:id                      # Modifier
DELETE /api/services/:id                      # Supprimer

POST   /api/services/:serviceId/categories    # Créer une catégorie
PATCH  /api/services/categories/:id           # Modifier une catégorie
DELETE /api/services/categories/:id           # Supprimer une catégorie

POST   /api/services/categories/:categoryId/items  # Créer un item
PATCH  /api/services/items/:id                     # Modifier un item
DELETE /api/services/items/:id                     # Supprimer un item
```

### Projects

```http
GET    /api/projects                  # PUBLIC — paginé + filtres
GET    /api/projects/slug/:slug       # PUBLIC
GET    /api/projects/slug/:slug/similar  # PUBLIC
GET    /api/projects/admin/all        # Liste admin (includeInactive)
GET    /api/projects/admin/:id        # Détail admin
POST   /api/projects                  # Créer (avec translations + gallery + features + links)
PATCH  /api/projects/:id              # Modifier (remplace sous-ressources si fournies)
DELETE /api/projects/:id              # Supprimer
```

### Team / Clients / Testimonials / Socials

Pattern identique pour les 4 :

```http
GET    /api/<entity>                  # PUBLIC — actifs
GET    /api/<entity>/admin/all        # Liste admin
GET    /api/<entity>/admin/:id        # Détail
POST   /api/<entity>                  # Créer
PATCH  /api/<entity>/:id              # Modifier
DELETE /api/<entity>/:id              # Supprimer
```

### Contact (messages reçus)

```http
POST   /api/contact                   # PUBLIC — soumission (rate limited)
GET    /api/contact?page=1&limit=20&status=NEW&search=jean
GET    /api/contact/:id
PATCH  /api/contact/:id/status        # { status: "READ" }
DELETE /api/contact/:id               # ADMIN only
```

### Quote (devis reçus)

```http
POST   /api/quote                     # PUBLIC — soumission (rate limited)
GET    /api/quote?page=1&limit=20&status=NEW&projectType=webApp&search=jean
GET    /api/quote/:id
PATCH  /api/quote/:id/status
DELETE /api/quote/:id                 # ADMIN only
```

### Uploads

```http
POST   /api/uploads                   # multipart/form-data — champ `file`
POST   /api/uploads/multiple          # multipart/form-data — champ `files` (max 10)
GET    /api/uploads?page=1&limit=20&search=logo
GET    /api/uploads/:id
DELETE /api/uploads/:id               # ADMIN only — supprime DB + disque
```

**Validation** :
- MIME autorisés : `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`, `image/gif`, `image/avif`
- Taille max : **5 Mo**
- Nommage : `<timestamp>-<random-hex>.<ext>`

### Stats

```http
GET /api/stats
```
Retourne un objet complet :
- **contenu** : projets (total, actifs, featured, par catégorie, par scope), services, team, clients, testimonials, socials, navigation, uploads
- **interactions** : contacts et quotes par status (NEW/READ/REPLIED/ARCHIVED/SPAM) + 7 derniers jours
- **activité** : 5 derniers contacts + 5 derniers devis

---

## 🗄 Modèle de données

### Entités principales

| Entité | Table | Traductions |
|---|---|---|
| Admin | `Admin` | ❌ |
| SiteSettings | `SiteSettings` | ✅ |
| NavItem | `NavItem` | ✅ |
| Service | `Service` | ✅ |
| ServiceCategory | `ServiceCategory` | ✅ |
| ServiceItem | `ServiceItem` | ✅ |
| Project | `Project` | ✅ |
| ProjectGallery | `ProjectGallery` | ✅ |
| ProjectFeature | `ProjectFeature` | ✅ |
| ProjectLink | `ProjectLink` | ❌ |
| TeamMember | `TeamMember` | ✅ |
| Client | `Client` | ❌ |
| Testimonial | `Testimonial` | ✅ |
| Social | `Social` | ✅ |
| ContactSubmission | `ContactSubmission` | ❌ |
| QuoteRequest | `QuoteRequest` | ❌ |
| Upload | `Upload` | ❌ |

### Principe des traductions

Chaque entité traduite possède une table `<Entity>Translation` avec :
- `locale` (fr, en, de, zh, es)
- Les champs traduisibles (title, description, etc.)

**Les endpoints renvoient TOUTES les langues** — c'est le frontend qui
choisit selon la locale active.

### Enums

```ts
AdminRole         = ADMIN | EDITOR
ProjectCategory   = WEB | MOBILE | SOFTWARE | API | MODULE | PACKAGE | SERVICE | IA | DESIGN | LOGO | TRAINING | MAINTENANCE | SALES
ProjectScope      = INTERNAL | CLIENT | PUBLIC | OPEN_SOURCE | EXTERNAL
ProjectStatus     = COMPLETED | IN_PROGRESS | PLANNED | ARCHIVED
ProjectLinkType   = DEMO | GITHUB | NPM | DOC | SITE | STORE | ARTICLE
SubmissionStatus  = NEW | READ | REPLIED | ARCHIVED | SPAM
```

---

## 🔒 Sécurité

| Mesure | Détail |
|---|---|
| **JWT cookies httpOnly** | Tokens inaccessibles au JS → anti-XSS |
| **Refresh path restreint** | Cookie `on.refreshToken` limité à `/api/auth` |
| **Hash bcrypt** | Mots de passe + refresh tokens hashés |
| **Rotation refresh** | Nouveau couple à chaque refresh |
| **Rate limiting global** | ThrottlerGuard sur toutes les routes |
| **Rate limiting login** | 5 tentatives / minute |
| **Rate limiting contact** | 3 soumissions / minute |
| **Rate limiting quote** | 2 soumissions / minute |
| **CORS strict** | Origines contrôlées via env |
| **Validation DTOs** | `whitelist: true, forbidNonWhitelisted: true` |
| **Roles** | `RolesGuard` global, `@Roles(...)` par route |
| **Upload validation** | MIME + extension + taille vérifiés |

---

## ⚙ Variables d'environnement

| Variable | Requis | Description |
|---|---|---|
| `NODE_ENV` | ✅ | `development` / `production` / `test` |
| `PORT` | ✅ | Port HTTP (défaut 5000) |
| `DATABASE_URL` | ✅ | Connexion **pooled** Prisma Cloud |
| `DIRECT_URL` | ✅ | Connexion **directe** (migrations) |
| `JWT_ACCESS_SECRET` | ✅ | Secret access token |
| `JWT_ACCESS_EXPIRES_IN` | ✅ | Ex: `15m` |
| `JWT_REFRESH_SECRET` | ✅ | Secret refresh token |
| `JWT_REFRESH_EXPIRES_IN` | ✅ | Ex: `7d` |
| `CORS_ORIGINS` | ✅ | Origines autorisées (CSV) |
| `SWAGGER_ENABLED` | ❌ | `true` / `false` |
| `RATE_LIMIT_WINDOW` | ❌ | Fenêtre (défaut `15m`) |
| `RATE_LIMIT_MAX` | ❌ | Max requêtes (défaut `100`) |
| `SEED_ADMIN_*` | ❌ | Identifiants admin pour le seed |

---

## 📜 Scripts NPM

| Script | Description |
|---|---|
| `npm run start` | Démarre NestJS |
| `npm run start:dev` | Dev + hot-reload |
| `npm run start:prod` | Prod (nécessite `build`) |
| `npm run build` | Build + copie assets Swagger |
| `npm run format` | Prettier |
| `npm run lint` | Oxlint |
| `npm run test` | Tests unitaires (Vitest) |
| `npm run test:e2e` | Tests e2e |
| `npm run db:migrate` | Migration Prisma |
| `npm run db:push` | Push direct (dev) |
| `npm run db:studio` | Interface Prisma Studio |
| `npm run seed` | Injecte les données initiales |
| `npm run seed:reset` | Reset DB + seed |

---

## 🎯 Ce qui est attendu côté frontend

### Configuration

Créer un fichier `.env.local` dans le frontend Next.js :

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Client HTTP

Créer `src/lib/api.ts` :

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    credentials: 'include', // ⚠️ ESSENTIEL pour envoyer les cookies
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}
```

⚠️ **`credentials: 'include'`** est obligatoire pour que les cookies httpOnly
soient envoyés au backend.

### Basculer `lib/data.ts` en async

Remplacer les imports directs de `data/*.ts` par des appels API :

```ts
// Avant (données locales)
import { projects } from '@/data/projects';
export function getProjects() { return projects; }

// Après (API)
export async function getProjects() {
  const res = await apiFetch<{ items: Project[] }>('/api/projects');
  return res.items;
}
```

Les composants React devront utiliser `await` ou `useEffect` + state.

### Endpoints à consommer (site public)

| Section | Endpoint |
|---|---|
| Config globale (logo, contacts, réseaux) | `GET /api/settings` |
| Menu navbar | `GET /api/nav` |
| Services (accueil + page services) | `GET /api/services` |
| Détail service | `GET /api/services/:slug` |
| Portfolio (liste) | `GET /api/projects?page=X&limit=9&...` |
| Détail projet | `GET /api/projects/slug/:slug` |
| Projets similaires | `GET /api/projects/slug/:slug/similar` |
| Équipe | `GET /api/team` |
| Clients | `GET /api/clients` |
| Témoignages | `GET /api/testimonials` |
| Réseaux sociaux | `GET /api/socials` |
| Formulaire contact | `POST /api/contact` |
| Formulaire devis | `POST /api/quote` |
| Recherche globale | `GET /api/search?q=...` |
| Health (uptime / monitoring) | `GET /api/health` |

---

## 🛡 Ce que l'admin peut consommer (dashboard)

Le **dashboard admin** consomme ces endpoints avec une session authentifiée
(cookies httpOnly posés par `/api/auth/login`).

### Flow d'authentification

1. **Page login** → `POST /api/auth/login` avec `{ username, password }`
2. Cookies posés automatiquement → utilisateur redirigé vers `/dashboard`
3. **Middleware Next.js** vérifie la présence de `on.user` (cookie lisible)
4. Si cookie absent → redirection vers `/login`
5. **Refresh automatique** : appeler `POST /api/auth/refresh` toutes les 10-14 min

### Modules à construire dans le dashboard

| Page | Endpoints consommés |
|---|---|
| **Dashboard** (accueil) | `GET /api/stats` |
| **Projets** (liste) | `GET /api/projects/admin/all` |
| **Projet** (édition) | `POST /api/projects`, `PATCH /api/projects/:id`, `DELETE /api/projects/:id` |
| **Services** | Idem pattern |
| **Équipe** | Idem |
| **Clients** | Idem |
| **Témoignages** | Idem |
| **Réseaux sociaux** | Idem |
| **Navigation** | `GET /api/nav/admin/all`, `PATCH /api/nav/reorder` |
| **Paramètres** | `GET /api/settings`, `PATCH /api/settings` |
| **Messages contact** | `GET /api/contact`, `PATCH /api/contact/:id/status` |
| **Devis** | `GET /api/quote`, `PATCH /api/quote/:id/status` |
| **Uploads** | `POST /api/uploads`, `GET /api/uploads`, `DELETE /api/uploads/:id` |
| **Admins** (ADMIN) | CRUD complet |
| **Recherche** | `GET /api/search?q=...` |

### Formulaires multilingues

Chaque formulaire de contenu doit inclure **5 onglets** (fr, en, de, zh, es)
pour les traductions. Pattern :

```ts
{
  slug: 'mon-projet',
  cover: '/uploads/image.png',
  translations: [
    { locale: 'fr', title: '...', description: '...' },
    { locale: 'en', title: '...', description: '...' },
    // ...
  ]
}
```

---

## 🗺 Roadmap

### ✅ Backend (terminé)

- [x] Auth admin (username/password) + JWT httpOnly + refresh
- [x] CRUD Admins (ADMIN only)
- [x] Module Settings (singleton)
- [x] Module Navigation (récursif + reorder)
- [x] Module Services (avec catégories + items)
- [x] Module Projects (avec gallery + features + links)
- [x] Module Team, Clients, Testimonials, Socials
- [x] Module Contact + Quote (formulaires publics + admin)
- [x] Module Uploads (multer + validation)
- [x] Module Stats (dashboard)
- [x] Module Search (recherche globale)
- [x] Module Health (monitoring)
- [x] Rate limiting global
- [x] Swagger complet
- [x] Seed idempotent

### 🔄 Frontend site public (à faire)

- [ ] `lib/api.ts` — client HTTP
- [ ] Basculer `lib/data.ts` en async
- [ ] Home dynamique (via API)
- [ ] Portfolio + détails
- [ ] Services + détails
- [ ] Contact (formulaire → `POST /api/contact`)
- [ ] Devis (wizard → `POST /api/quote`)
- [ ] Search bar (→ `GET /api/search`)

### 🔄 Dashboard admin (à faire)

- [ ] Page login
- [ ] Middleware Next.js (auth)
- [ ] Dashboard (via `/api/stats`)
- [ ] CRUD de tous les contenus
- [ ] Upload images
- [ ] Modération contact/quote
- [ ] Gestion admins (ADMIN)

### 🚀 Déploiement (à faire)

- [ ] Frontend → Vercel
- [ ] Backend → Railway / Fly.io / VPS
- [ ] Stockage images → Cloudflare R2 ou Cloudinary (Vercel read-only)
- [ ] Domaine + HTTPS
- [ ] Monitoring (Sentry / Better Stack)

---

## 📄 License

UNLICENSED — Projet privé Open Numeric.