# Budgi 💸

> Application web de gestion de budget pour étudiants : suivre ses dépenses, fixer un budget mensuel et voir en un coup d'œil ce qu'il reste à dépenser.

![Statut](https://img.shields.io/badge/statut-en%20développement-orange)
![React](https://img.shields.io/badge/React-Vite-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-4169E1?logo=postgresql&logoColor=white)

---

## Sommaire

- [Présentation](#présentation)
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

**Budgi** permet de :

- saisir une dépense en quelques secondes ;
- la classer par catégorie ;
- suivre son budget du mois et voir ce qu'il reste.

L'interface est pensée **mobile first**.

> Projet étudiant individuel réalisé dans le cadre d'un cours de développement web.

## Fonctionnalités

### MVP

- [ ] Inscription et connexion (authentification JWT)
- [ ] Ajout, modification et suppression de dépenses et de revenus
- [ ] Catégories par défaut et personnalisées
- [ ] Budget mensuel global
- [ ] Tableau de bord : solde restant, répartition par catégorie, dernières dépenses
- [ ] Historique filtrable (mois, catégorie, recherche)

### Bonus

- [ ] Budget par catégorie avec alerte à 80 %
- [ ] Dépenses récurrentes (loyer, abonnements)
- [ ] Statistiques mois par mois
- [ ] Export CSV
- [ ] Mode sombre
- [ ] Objectifs d'épargne

## Stack technique

| Couche | Technologie |
| --- | --- |
| Front-end | React (Vite), Tailwind CSS, Chart.js |
| Back-end | Node.js, Express |
| Base de données | PostgreSQL, Prisma (ORM) |
| Authentification | JWT, bcrypt |
| Déploiement | Vercel (front), Render (API + base de données) |
| Outils | Git, GitHub, Figma |

## Modèle de données

```
User ──< Category
  │          │
  ├──< Transaction >──┘
  │
  └──< Budget
```

| Table | Champs principaux |
| --- | --- |
| `User` | id, nom, email, mot de passe haché, date de création |
| `Category` | id, nom, couleur, icône, user_id |
| `Transaction` | id, montant, type (dépense / revenu), date, note, category_id, user_id |
| `Budget` | id, mois, montant, category_id (vide = budget global), user_id |

## Structure du projet

```
budgi/
├── client/          # Front-end React (Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/    # Appels à l'API
│   │   └── App.jsx
│   └── package.json
├── server/          # API Node.js / Express
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middlewares/ # Vérification du JWT
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
git clone https://github.com/mrtmathis/budgi.git
cd budgi
```

### 2. Lancer l'API

```bash
cd server
npm install
cp .env.example .env    # puis renseigner les variables
npx prisma migrate dev
npm run dev
```

Variables d'environnement (`server/.env`) :

```env
DATABASE_URL="postgresql://utilisateur:motdepasse@localhost:5432/budgi"
JWT_SECRET="une_chaine_secrete_longue"
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
| `GET` | `/api/categories` | Lister les catégories |
| `POST` | `/api/categories` | Créer une catégorie |
| `GET` | `/api/budgets?month=YYYY-MM` | Budget du mois |
| `PUT` | `/api/budgets` | Définir ou modifier un budget |
| `GET` | `/api/dashboard?month=YYYY-MM` | Données du tableau de bord |

Toutes les routes sauf `/api/auth/*` nécessitent l'en-tête `Authorization: Bearer <token>`.

## Planning

| Semaine | Étape |
| --- | --- |
| 1 | Conception : brief, wireframes, schéma de base de données |
| 2 | Mise en place : dépôt Git, projets React et Express, base PostgreSQL |
| 3 | Authentification |
| 4-5 | Transactions, catégories, budget, historique |
| 6 | Tableau de bord, graphiques, premier déploiement |
| 7 | Bonus et responsive |
| 8 | Finitions, README, soutenance |

## Auteur

**Mathis** · [GitHub](https://github.com/mrtmathis)
