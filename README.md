# EcoBud 💸

> Application web de gestion de budget pour étudiants : noter ses dépenses en quelques secondes, fixer un budget mensuel et voir en un coup d'œil ce qu'il reste à dépenser.

![Statut](https://img.shields.io/badge/statut-en%20développement-orange)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white)

---

## Sommaire

- [Présentation](#présentation)
- [Données et confidentialité](#données-et-confidentialité)
- [Le problème de l'oubli](#le-problème-de-loubli)
- [Fonctionnalités](#fonctionnalités)
- [Stack technique](#stack-technique)
- [Modèle de données](#modèle-de-données)
- [Structure du projet](#structure-du-projet)
- [Installation](#installation)
- [API](#api)
- [Planning](#planning)
- [Auteur](#auteur)

## Présentation

Un étudiant gère souvent un petit budget (bourse, job, aide des parents) sans outil adapté. Les applications bancaires montrent les opérations, mais pas où part l'argent, et un tableur demande trop de rigueur au quotidien.

**EcoBud** permet de :

- saisir une dépense en quelques secondes ;
- la classer dans une catégorie proposée par le site ;
- suivre son budget du mois et voir ce qu'il reste ;
- être prévenu avant de dépasser son budget.

Le but final : aider l'étudiant à **faire des économies** en tenant son budget.

### Récap de fin de mois

Le 1er de chaque mois, une notification ouvre le récap du mois écoulé :

- le **montant économisé** = budget du mois − dépenses du mois ;
- une section **« Mets-les de côté »** qui suggère de virer cette somme sur un livret d'épargne (boutons « C'est fait » et « Me le rappeler demain ») ;
- les 3 catégories qui ont le plus pesé.

En cas de dépassement, le récap affiche le montant dépassé à la place, sans suggestion d'épargne.

L'interface est pensée **mobile first** et l'application s'installe sur l'écran d'accueil du téléphone (PWA).

> Projet étudiant individuel réalisé dans le cadre d'un cours de développement web.

## Données et confidentialité

EcoBud **ne se connecte à aucune banque** et ne demande **aucune donnée bancaire** (ni identifiants, ni IBAN, ni numéro de carte).

C'est l'utilisateur qui saisit lui-même ses montants, dans des **catégories définies par le site** (courses, loyer, transport, sorties, santé, études, abonnements). Si aucune ne convient, il choisit **« Autre »** et précise la dépense dans un champ de détail obligatoire. Le compte ne stocke que :

- le nom et l'adresse e-mail ;
- le mot de passe, haché avec bcrypt ;
- les montants saisis et les réglages des rappels.

## Le problème de l'oubli

Sans lien avec la banque, les chiffres ne sont justes que si l'utilisateur pense à noter ses dépenses. EcoBud va donc le chercher au bon moment et rend la saisie quasi instantanée :

| Solution | Ce que ça change | Priorité |
| --- | --- | --- |
| Application installable (PWA) | Une icône sur l'écran d'accueil, ouverture en plein écran | MVP |
| Rappel quotidien | Une notification à l'heure choisie (21 h par défaut) : « Tu as dépensé quelque chose aujourd'hui ? » | MVP |
| Ajout express | Depuis la notification : montant et catégorie en 2 touches, date du jour par défaut | MVP |
| Bouton « Rien dépensé aujourd'hui » | Une seule touche pour valider une journée sans dépense | MVP |
| Dépenses récurrentes | Loyer, abonnements et bourse saisis une seule fois | MVP |
| Série de jours suivis | Un compteur de jours d'affilée remplis | Bonus |
| Récap hebdomadaire par e-mail | Chaque dimanche, le total de la semaine | Bonus |
| Scan de ticket | Le montant est lu sur la photo du ticket (Tesseract.js) | Bonus |

> Sur iPhone, les notifications web ne fonctionnent que si l'application est installée sur l'écran d'accueil (iOS 16.4 ou plus).

## Fonctionnalités

### MVP

- [ ] Inscription et connexion (authentification JWT)
- [ ] Ajout, modification et suppression de dépenses et de revenus
- [ ] Catégories prédéfinies par le site, dont « Autre » avec détail obligatoire
- [ ] Budget mensuel global
- [ ] Alertes de budget par notification : à 80 % du budget, puis en cas de dépassement
- [ ] Récap de fin de mois : montant économisé et suggestion de le mettre de côté
- [ ] Dépenses et revenus récurrents
- [ ] Tableau de bord : solde restant, répartition par catégorie, dernières dépenses
- [ ] Historique filtrable (mois, catégorie, recherche)
- [ ] Application installable (PWA)
- [ ] Rappel quotidien par notification, heure et jours réglables
- [ ] Ajout express et bouton « Rien dépensé aujourd'hui »

### Bonus

- [ ] Budget par catégorie avec alerte à 80 %
- [ ] Série de jours suivis
- [ ] Récap hebdomadaire par e-mail
- [ ] Scan de ticket
- [ ] Statistiques mois par mois
- [ ] Export CSV
- [ ] Mode sombre

## Stack technique

| Couche | Technologie |
| --- | --- |
| Front-end | React (Vite), Tailwind CSS, Chart.js |
| PWA et notifications | vite-plugin-pwa, Web Push (`web-push`), `node-cron` |
| Back-end | Node.js, Express |
| Base de données | PostgreSQL, Prisma (ORM) |
| Authentification | JWT, bcrypt |
| Déploiement | Vercel (front), Render (API + base de données) |
| Outils | Git, GitHub, Figma |

## Modèle de données

```
Category (liste fixe)
   │
   ├──< Transaction >──┐
   ├──< Recurrence  >──┤
   └──< Budget      >──┤
                       │
       PushSubscription >── User
```

| Table | Champs principaux |
| --- | --- |
| `User` | id, nom, email, mot de passe haché, heure du rappel, jours du rappel, alertes activées, date de création |
| `Category` | id, nom, couleur, icône (liste fixe définie par le site, commune à tous) |
| `Transaction` | id, montant, type (dépense / revenu), date, note (obligatoire pour « Autre »), category_id, user_id |
| `Recurrence` | id, montant, type, jour du mois, libellé, category_id, user_id |
| `Budget` | id, mois, montant, category_id (vide = budget global), user_id |
| `PushSubscription` | id, endpoint, clés de chiffrement, user_id (une par appareil) |
| `DayCheck` | id, date, user_id (journée validée « rien dépensé ») |
| `BudgetAlert` | id, seuil (80 ou 100 %), date d'envoi, budget_id (évite d'envoyer deux fois la même alerte) |

## Structure du projet

```
ecobud/
├── client/          # Front-end React (Vite)
│   ├── public/
│   │   └── manifest.webmanifest
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/    # Appels à l'API
│   │   ├── sw.js        # Service worker (notifications)
│   │   └── App.jsx
│   └── package.json
├── server/          # API Node.js / Express
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js      # Catégories prédéfinies
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middlewares/ # Vérification du JWT
│   │   ├── jobs/        # Rappels et récurrences (node-cron)
│   │   └── index.js
│   └── package.json
├── docs/            # Brief et wireframes
└── README.md
```

## Installation

### Prérequis

- [Node.js](https://nodejs.org/) 20 ou plus
- [PostgreSQL](https://www.postgresql.org/) 15 ou plus (installé localement ou hébergé)

### 1. Cloner le dépôt

```bash
git clone https://github.com/mrtmathis/ecobud.git
cd ecobud
```

### 2. Lancer l'API

```bash
cd server
npm install
cp .env.example .env    # puis renseigner les variables
npx web-push generate-vapid-keys   # clés pour les notifications
npx prisma migrate dev
npx prisma db seed      # crée les catégories prédéfinies
npm run dev
```

Variables d'environnement (`server/.env`) :

```env
DATABASE_URL="postgresql://utilisateur:motdepasse@localhost:5432/ecobud"
JWT_SECRET="une_chaine_secrete_longue"
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:contact@exemple.fr"
PORT=3000
```

### 3. Lancer le front-end

```bash
cd client
npm install
npm run dev
```

L'application est alors disponible sur `http://localhost:5173`.

## API

| Méthode | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Créer un compte |
| `POST` | `/api/auth/login` | Se connecter (renvoie un JWT) |
| `GET` | `/api/transactions` | Lister les transactions (filtres : `month`, `category`, `q`) |
| `POST` | `/api/transactions` | Ajouter une transaction |
| `PUT` | `/api/transactions/:id` | Modifier une transaction |
| `DELETE` | `/api/transactions/:id` | Supprimer une transaction |
| `POST` | `/api/days/:date/empty` | Valider une journée sans dépense |
| `GET` | `/api/categories` | Lister les catégories prédéfinies |
| `GET` | `/api/recurrences` | Lister les dépenses et revenus récurrents |
| `POST` | `/api/recurrences` | Créer une récurrence |
| `DELETE` | `/api/recurrences/:id` | Supprimer une récurrence |
| `GET` | `/api/budgets?month=YYYY-MM` | Budget du mois |
| `PUT` | `/api/budgets` | Définir ou modifier un budget |
| `GET` | `/api/dashboard?month=YYYY-MM` | Données du tableau de bord |
| `GET` | `/api/recap?month=YYYY-MM` | Récap du mois : montant économisé, top catégories |
| `PUT` | `/api/settings/reminder` | Régler l'heure et les jours du rappel |
| `PUT` | `/api/settings/alerts` | Activer ou désactiver les alertes de budget |
| `POST` | `/api/push/subscribe` | Enregistrer un appareil pour les notifications |
| `DELETE` | `/api/push/subscribe` | Désactiver les notifications sur un appareil |

Toutes les routes sauf `/api/auth/*` nécessitent l'en-tête `Authorization: Bearer <token>`.

## Planning

| Semaine | Étape |
| --- | --- |
| 1 | Conception : brief, wireframes, schéma de base de données |
| 2 | Mise en place : dépôt Git, projets React et Express, base PostgreSQL |
| 3 | Authentification |
| 4-5 | Transactions, catégories, récurrences, budget, historique |
| 6 | Tableau de bord, graphiques, récap de fin de mois, premier déploiement |
| 7 | Rappels et PWA : application installable, rappels, alertes de budget, ajout express |
| 8 | Finitions, README, soutenance |

## Auteur

**Mathis** · [GitHub](https://github.com/mrtmathis)
