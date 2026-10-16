# EcoBud 💸

> Application web de gestion de budget pour étudiants : noter ses dépenses en quelques secondes, fixer un budget mensuel et voir en un coup d'œil ce qu'il reste à dépenser.

**Site en ligne : [ecobud-app.vercel.app](https://ecobud-app.vercel.app)**

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
- [Sécurité](#sécurité)
- [Mise en ligne](#mise-en-ligne)
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

L'application est disponible **en français et en anglais**. Elle est **responsive** : utilisable dans de bonnes conditions sur téléphone, tablette et ordinateur. Elle s'installe aussi sur l'écran d'accueil du téléphone (PWA).

### Langues

La langue suit celle du navigateur au premier lancement, puis se change à tout moment (sélecteur FR / EN sur la page de connexion, menu « Langue » dans les réglages). Le choix est enregistré sur le compte : les notifications et les e-mails arrivent dans la même langue. Les dates et les montants suivent le format de la langue (`1 234,56 €` en français, `€1,234.56` en anglais).

### Affichage selon l'appareil

| Largeur d'écran | Appareil | Navigation |
| --- | --- | --- |
| Moins de 768 px | Téléphone | Barre en bas avec bouton « + » central |
| 768 à 1023 px | Tablette | Barre latérale d'icônes |
| 1024 px et plus | Ordinateur | Menu latéral complet |

L'interface est testée à partir de 320 px de large, et toutes les zones cliquables font au moins 44 px.

> Projet étudiant individuel réalisé dans le cadre d'un cours de développement web.

### Mot de passe oublié : le code de récupération

EcoBud n'envoie aucun e-mail. À l'inscription, l'utilisateur reçoit **une seule fois** un code de récupération (`XXXX-XXXX-XXXX-XXXX`), qu'il peut copier ou télécharger. S'il oublie son mot de passe, ce code lui permet d'en choisir un nouveau ; il reçoit alors un nouveau code, l'ancien ne marchant plus. Garder ce code est sa responsabilité : sans lui, le compte ne peut pas être récupéré.

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
| Dépenses récurrentes | Loyer, abonnements et salaire saisis une seule fois | MVP |
| Série de jours suivis | Un compteur de jours d'affilée remplis | Bonus |
| Récap hebdomadaire par e-mail | Chaque dimanche, le total de la semaine | Bonus |
| Scan de ticket | Le montant est lu sur la photo du ticket (Tesseract.js) | Bonus |

> Sur iPhone, les notifications web ne fonctionnent que si l'application est installée sur l'écran d'accueil (iOS 16.4 ou plus).

## Fonctionnalités

### MVP

- [x] Inscription, connexion, déconnexion et mot de passe oublié (code de récupération)
- [ ] Interface en français et en anglais
- [ ] Responsive : téléphone, tablette et ordinateur
- [x] Ajout, modification et suppression de dépenses et de revenus (salaire, aide de la famille, virement reçu, autre)
- [x] Catégories prédéfinies par le site, dont « Autre » avec détail obligatoire
- [x] Budget mensuel global (reconduit automatiquement les mois suivants)
- [ ] Alertes de budget par notification : à 80 % du budget, puis en cas de dépassement
- [ ] Récap de fin de mois : montant économisé et suggestion de le mettre de côté
- [ ] Dépenses et revenus récurrents
- [x] Tableau de bord : reste à dépenser, alertes à 80 % et 100 %, répartition par catégorie, dernières transactions (graphiques à l'étape design)
- [x] Historique filtrable (mois, type, catégorie, recherche dans la note)
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
| Traduction | react-i18next, API `Intl` du navigateur (dates et montants) |
| PWA et notifications | vite-plugin-pwa, Web Push (`web-push`), tâche planifiée GitHub Actions |
| Back-end | Node.js, Express |
| Base de données | PostgreSQL, Prisma (ORM) |
| Authentification | JWT dans un cookie httpOnly, bcrypt |
| Sécurité | Helmet, Zod (validation), express-rate-limit |
| Déploiement | Vercel (front et API), Neon (PostgreSQL hébergé) |
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
| `User` | id, nom, email, mot de passe haché, heure du rappel, jours du rappel, alertes activées, langue (`fr` ou `en`), date de création |
| `Category` | id, clé de traduction, couleur, icône (liste fixe définie par le site, commune à tous) |
| `Transaction` | id, montant, type (dépense / revenu), date, note (obligatoire pour « Autre »), category_id, user_id |
| `Recurrence` | id, montant, type, jour du mois, libellé, category_id, user_id |
| `Budget` | id, mois, montant, category_id (vide = budget global), user_id |
| `PushSubscription` | id, endpoint, clés de chiffrement, user_id (une par appareil) |
| `DayCheck` | id, date, user_id (journée validée « rien dépensé ») |
| `BudgetAlert` | id, seuil (80 ou 100 %), date d'envoi, budget_id (évite d'envoyer deux fois la même alerte) |

Les montants sont stockés **en centimes** (nombres entiers) pour éviter les erreurs d'arrondi. Le schéma complet est dans [server/prisma/schema.prisma](server/prisma/schema.prisma), et `npm run db:studio` ouvre une interface pour parcourir les données.

## Sécurité

La sécurité est traitée dès la première ligne de code :

| Risque | Protection |
| --- | --- |
| Vol de mots de passe | Hachage bcrypt (coût 12), jamais stockés ni renvoyés en clair ; 12 caractères minimum avec minuscule, majuscule, chiffre et symbole |
| Comptes devinables | Même réponse pour un e-mail inconnu et un mauvais mot de passe, ou un mauvais code de récupération |
| Code de récupération deviné ou volé | 16 caractères aléatoires (80 bits), haché avec bcrypt, à usage unique, essais limités ; en générer un nouveau depuis le compte demande le mot de passe |
| Requêtes venant d'un autre site (CSRF) | Cookie `SameSite=Lax` et refus des requêtes dont l'origine n'est pas le site |
| Vol de session (XSS) | JWT dans un cookie `httpOnly`, `Secure`, `SameSite` ; React échappe tout le contenu affiché |
| Accès aux données d'un autre utilisateur | Chaque requête en base est filtrée par l'utilisateur connecté |
| Injection SQL | Requêtes paramétrées par Prisma, aucun SQL écrit à la main |
| Données invalides ou piégées | Validation de chaque entrée avec Zod, corps de requête limité à 10 ko |
| Force brute sur la connexion | Nombre de tentatives limité par adresse IP |
| Fuite de secrets | Clés dans les variables d'environnement, `.env` exclu de Git |
| Failles dans les dépendances | `npm audit` à chaque ajout, Dependabot |
| Panne ou surcharge | En-têtes Helmet, erreurs sans détail technique, sauvegardes Neon |
| Données personnelles (RGPD) | Suppression du compte et de toutes ses données |

L'API ne renvoie jamais de message technique : seulement des codes comme `NOT_FOUND` ou `INVALID_JSON`, que le front traduit.

## Mise en ligne

L'application est déployée sur **Vercel** : le front et l'API sur le même domaine, ce qui permet des cookies `SameSite` stricts. La base PostgreSQL est hébergée chez **Neon**. Comme Vercel ne garde pas de serveur allumé en permanence, les rappels, alertes et récaps sont déclenchés toutes les 15 minutes par **GitHub Actions**, via une route protégée par une clé secrète.

## Structure du projet

```
ecobud/
├── client/          # Front-end React (Vite)
│   ├── public/
│   │   └── manifest.webmanifest
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── locales/     # Traductions
│   │   │   ├── fr.json
│   │   │   └── en.json
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
│   │   ├── jobs/        # Rappels, alertes, récurrences, récap
│   │   └── index.js
│   └── package.json
├── api/
│   └── index.js     # Point d'entrée Vercel qui sert l'API Express
├── docs/            # Brief et wireframes
├── package.json     # Workspaces client et server
├── vercel.json      # Build du front et redirection de /api
└── README.md
```

## Installation

### Prérequis

- [Node.js](https://nodejs.org/) 24
- [PostgreSQL](https://www.postgresql.org/) 15 ou plus (installé localement ou hébergé)

### 1. Cloner le dépôt

```bash
git clone https://github.com/mrtmathis/ecobud.git
cd ecobud
```

### 2. Installer et préparer la base

Le dépôt utilise les **workspaces npm** : une seule installation depuis la racine suffit pour le front et l'API.

```bash
npm install             # installe client et server, génère le client Prisma
cd server
cp .env.example .env    # puis renseigner les variables
npx web-push generate-vapid-keys   # clés pour les notifications
npm run db:migrate      # crée les tables
npm run db:seed         # crée les catégories prédéfinies
cd ..
```

Variables d'environnement (`server/.env`) :

```env
DATABASE_URL="postgresql://utilisateur:motdepasse@localhost:5432/ecobud"
JWT_SECRET="une_chaine_secrete_longue"
VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."
VAPID_SUBJECT="mailto:contact@exemple.fr"
PORT=4000
```

### 3. Lancer l'application

```bash
npm run dev             # lance l'API (port 4000) et le front (port 5173)
```

L'application est alors disponible sur `http://localhost:5173`. Les appels à `/api` sont relayés vers l'API par Vite.

## API

| Méthode | Route | Description |
| --- | --- | --- |
| `POST` | `/api/auth/register` | Créer un compte |
| `POST` | `/api/auth/login` | Se connecter (pose un cookie de session de 30 jours) |
| `POST` | `/api/auth/logout` | Se déconnecter |
| `GET` | `/api/auth/me` | Utilisateur connecté |
| `POST` | `/api/auth/recover` | Mot de passe oublié : e-mail + code de récupération + nouveau mot de passe (déconnecte les autres sessions, renvoie un nouveau code) |
| `POST` | `/api/auth/recovery-code` | Générer un nouveau code de récupération (mot de passe demandé) |
| `GET` | `/api/transactions` | Lister les transactions d'un mois avec les totaux (filtres : `month`, `type`, `category`, `q`) |
| `GET` | `/api/transactions/:id` | Détail d'une transaction |
| `POST` | `/api/transactions` | Ajouter une transaction |
| `PUT` | `/api/transactions/:id` | Modifier une transaction |
| `DELETE` | `/api/transactions/:id` | Supprimer une transaction |
| `POST` | `/api/days/:date/empty` | Valider une journée sans dépense |
| `GET` | `/api/categories` | Lister les catégories prédéfinies |
| `GET` | `/api/recurrences` | Lister les dépenses et revenus récurrents |
| `POST` | `/api/recurrences` | Créer une récurrence |
| `DELETE` | `/api/recurrences/:id` | Supprimer une récurrence |
| `GET` | `/api/budgets?month=YYYY-MM` | Budget du mois (sinon celui du dernier mois qui en a un) |
| `PUT` | `/api/budgets` | Définir ou modifier le budget d'un mois |
| `GET` | `/api/dashboard?month=YYYY-MM` | Tableau de bord : budget, dépensé, reste, pourcentage, niveau d'alerte, répartition, 5 dernières transactions |
| `GET` | `/api/recap?month=YYYY-MM` | Récap du mois : montant économisé, top catégories |
| `PUT` | `/api/settings/reminder` | Régler l'heure et les jours du rappel |
| `PUT` | `/api/settings/alerts` | Activer ou désactiver les alertes de budget |
| `PUT` | `/api/settings/language` | Changer la langue du compte (`fr` ou `en`) |
| `POST` | `/api/push/subscribe` | Enregistrer un appareil pour les notifications |
| `DELETE` | `/api/push/subscribe` | Désactiver les notifications sur un appareil |
| `DELETE` | `/api/account` | Supprimer son compte et toutes ses données |
| `POST` | `/api/jobs/run` | Lancer les tâches planifiées (réservé à GitHub Actions, clé secrète) |

Toutes les routes sauf `/api/auth/*`, `/api/health` et `/api/jobs/run` nécessitent d'être connecté (cookie de session).

## Planning

| Semaine | Étape |
| --- | --- |
| 1 | Conception : brief, wireframes, schéma de base de données |
| 2 | Mise en place : dépôt Git, projets React et Express, base PostgreSQL, traduction FR / EN |
| 3 | Authentification |
| 4-5 | Transactions, catégories, récurrences, budget, historique |
| 6 | Tableau de bord, graphiques, récap de fin de mois, premier déploiement |
| 7 | Rappels et PWA : application installable, rappels, alertes de budget, ajout express, tests sur téléphone, tablette et ordinateur |
| 8 | Finitions, README, soutenance |

## Auteur

**Mathis** · [GitHub](https://github.com/mrtmathis)
