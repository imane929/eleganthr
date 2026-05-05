# RAPPORT DE STAGE - GUIDE COMPLET
## Projet ElegantHR - CRM RH pour Elegant Art Studio

---

# 📋 TABLE DES MATIÈRES
1. [Réalisation du projet](#1-réalisation-du-projet)
2. [Interface utilisateur](#2-interface-utilisateur)
3. [Fonctionnement du système](#3-fonctionnement-du-système)
4. [Tests des APIs](#4-tests-des-apis)
5. [Déploiement](#5-déploiement)
6. [Conclusion et perspectives](#6-conclusion-et-perspectives)

---

# 1. RÉALISATION DU PROJET

## 1.1 Architecture Globale

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (React 19)                           │
│                     Application SPA - TailwindCSS + MUI             │
│              Composants : Recharts, React Icons, Heroicons          │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ HTTP/HTTPS - REST API (JSON)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SERVEUR (Laravel 12)                         │
│                    API REST - Sanctum Auth                          │
│         Controllers → Services → Models → Eloquent ORM             │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       BASE DE DONNÉES (MySQL)                       │
│                 21 tables - Soft Deletes - Migrations               │
└─────────────────────────────────────────────────────────────────────┘
```

### Stack Technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Frontend | React.js | 19.x |
| Backend | Laravel | 12.x |
| Base de données | MySQL | 8.x |
| Authentification | Laravel Sanctum | 4.x |
| RBAC | Spatie Permission | 6.x |
| Génération PDF | DomPDF | 3.x |
| Export Excel | Maatwebsite Excel | 3.x |
| CSS | TailwindCSS + Material UI | - |

## 1.2 Organisation du Code

### Structure Backend (Laravel)

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── API/                    # 17 contrôleurs API
│   │   │       ├── AuthController.php
│   │   │       ├── EmployeeController.php
│   │   │       ├── LeaveRequestController.php
│   │   │       ├── AbsenceController.php
│   │   │       ├── SalaryController.php
│   │   │       ├── BonusController.php
│   │   │       ├── DashboardController.php
│   │   │       ├── DepartmentController.php
│   │   │       ├── RoleController.php
│   │   │       ├── NotificationController.php
│   │   │       ├── WarningController.php
│   │   │       ├── InternController.php
│   │   │       ├── CompensationController.php
│   │   │       └── ProfileController.php
│   │   ├── Middleware/
│   │   │   ├── CheckRole.php
│   │   │   └── CheckPermission.php
│   │   └── Requests/                   # Form Request Validation
│   └── Models/                         # 19 modèles Eloquent
│       ├── User.php (HasApiTokens, HasRoles)
│       ├── Employee.php
│       ├── Department.php
│       ├── LeaveRequest.php
│       ├── Absence.php
│       ├── Salary.php
│       ├── Notification.php
│       └── ...
├── database/
│   ├── migrations/                     # 21 fichiers
│   └── seeders/
│       ├── DatabaseSeeder.php
│       ├── RoleSeeder.php
│       └── ExampleDataSeeder.php
├── routes/
│   └── api.php                        # Routes REST
└── tests/Feature/Auth/                # Tests d'authentification
```

### Structure Frontend (React)

```
frontend/src/
├── App.jsx                            # Routage principal + ProtectedRoute
├── index.js                           # Point d'entrée
├── services/
│   └── api.js                         # Instance Axios (interceptors)
├── contexts/
│   ├── AuthContext.jsx                # État auth + méthodes login/logout
│   └── NotificationContext.jsx        # Notifications temps réel
└── components/
    ├── Auth/
    │   └── Login.jsx                  # Page de connexion
    ├── Dashboard/
    │   ├── Dashboard.jsx              # Dashboard Admin
    │   ├── RHDashboard.jsx            # Dashboard RH
    │   ├── EmployeeDashboard.jsx      # Dashboard Employé
    │   └── DepartmentAnalyticsDashboard.jsx
    ├── Layout/
    │   ├── Layout.jsx                 # Layout principal
    │   ├── Sidebar.jsx                # Navigation + menu rôle
    │   └── Navbar.jsx
    ├── Employees/
    │   ├── EmployeeList.jsx           # Liste paginée + filtres
    │   ├── EmployeeForm.jsx           # Formulaire ajout/modif
    │   └── EmployeeDetail.jsx         # Détails employé
    ├── LeaveRequests/
    │   └── LeaveRequestList.jsx       # Gestion congés
    ├── Absences/
    │   └── AbsenceList.jsx
    ├── Salaries/
    │   └── SalaryList.jsx             # Fiches de paie
    ├── Notifications/
    │   └── NotificationsPage.jsx
    └── ...
```

## 1.3 Fonctionnalités Développées

### 1.3.1 Gestion des Employés
- **CRUD complet** avec suppression douce (soft delete)
- Champs : Matricule auto-généré (EMP-XXXXXX), nom, email, téléphone, nationalité, date de naissance, poste, département, date d'embauche
- Indemnités : transport, logement, repas, ancienneté
- **Export CSV** des employés
- Liaison automatique avec compte utilisateur
- Filtres par département, statut, recherche

### 1.3.2 Gestion des Congés
- Demande de congé avec validation du délai de préavis
- Types : annuel, maladie, sans solde, maternité, paternité, préavis
- Workflow d'approbation : pending → approved/rejected
- Gestion du handover (remise de service)
- Suivi du solde de congésrestants

### 1.3.3 Gestion des Absences
- Enregistrement quotidien des absences
- Workflow de justification
- Rapports mensuels/annuels
- Statistiques par employé/département

### 1.3.4 Gestion des Salaires
- Salaires mensuels avec génération de fiches de paie
- Composantes : salaire de base + indemnités + primes - déductions
- Export CSV des bulletins mensuels
- Génération PDF des fiches de paie

### 1.3.5 Rôles et Permissions (RBAC)

| Rôle | Description | Accès |
|------|-------------|-------|
| **Admin** | Administrateur système | Accès total |
| **HR Manager** | Responsable RH | Employés, congés, absences, salaires |
| **Responsable** | Chef de département | Son équipe, congés, absences |
| **Employee** | Employé standard | Son profil, ses congés, absences |

Implémentation avec **Spatie Permission** :
```php
// Modèle User.php
use HasApiTokens, HasRoles, Notifiable;

// Vérification dans les routes
Route::middleware(['auth:sanctum', 'role:hr_manager'])->group(function() {
    // Routes RH Manager uniquement
});
```

Middleware personnalisé (`CheckRole.php`, `CheckPermission.php`).

### 1.3.6 Système de Notifications
- Notifications en-app automatiques sur :
  - Nouvelles demandes de congé
  - Approbations/rejets
  - Nouvelles absences
  - Paiements de salaires
  - Attribution de primes
- Compteur de non-lus
- Marquer comme lu (un ou tous)

### 1.3.7 Dashboard Multi-Rôles
- **Admin Dashboard** : Stats globales, graphiques Recharts
- **RH Dashboard** : KPIs RH, tendances, analyses
- **Employee Dashboard** : Mon solde congés, mes demandes
- **Responsable Dashboard** : Mon équipe, approbations
- **Department Analytics** : Analyse par département

### 1.3.8 Fonctionnalités Supplémentaires
- **Primes/Bonus** : Types multiples (fixe, %, formule, palier), attribution individuelle ou par département, workflow d'approbation
- **Gestion Stagiaires** : Profils, évaluations, suivi expiration, conversion en CDI
- **Avertissements** : Types (verbal, écrit, suspension), niveaux de gravité, workflow d'acquittement, génération de lettres PDF
- **Gestion Rémunération** : Grilles salariales, augmentations au mérite, budget départements

## 1.4 Fonctionnement de l'API

### Routes Principales (`routes/api.php`)

```php
// Routes publiques (authentification)
POST   /api/login              → AuthController@login
POST   /api/register           → AuthController@register
POST   /api/logout             → AuthController@logout

// Routes protégées (auth:sanctum)
Route::middleware('auth:sanctum')->group(function () {
    
    // Ressources CRUD
    Route::apiResource('employees', EmployeeController::class);
    Route::apiResource('departments', DepartmentController::class);
    Route::apiResource('leave-requests', LeaveRequestController::class);
    Route::apiResource('absences', AbsenceController::class);
    Route::apiResource('salaries', SalaryController::class);
    
    // Actions spécifiques congés
    POST /api/leave-requests/{id}/approve
    POST /api/leave-requests/{id}/reject
    POST /api/leave-requests/{id}/complete-handover
    
    // Actions spécifiques absences
    POST /api/absences/{id}/justify
    
    // Salaires
    POST /api/salaries/generate-payslip/{salary}
    GET  /api/salaries/export/monthly/{month}
    
    // Dashboard
    GET  /api/dashboard/stats
    GET  /api/dashboard/rh
    GET  /api/dashboard/employee
    GET  /api/dashboard/department-analytics
    
    // Notifications
    GET  /api/notifications
    POST /api/notifications/{id}/mark-as-read
    
    // Profile
    GET  /api/profile
    PUT  /api/profile
});
```

### Exemple : Contrôleur LeaveRequestController

```php
// backend/app/Http/Controllers/API/LeaveRequestController.php

class LeaveRequestController extends Controller
{
    // GET /api/leave-requests - Liste paginée
    public function index(Request $request) {
        $query = LeaveRequest::with(['employee', 'approver']);
        // Filtres...
        return response()->json($query->paginate(15));
    }
    
    // POST /api/leave-requests - Créer demande
    public function store(StoreLeaveRequest $request) {
        $employee = Employee::where('user_id', auth::id())->first();
        
        $leaveRequest = LeaveRequest::create([
            'employee_id' => $employee->id,
            'type' => $request->type,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'reason' => $request->reason,
            'status' => 'pending'
        ]);
        
        // Notification au responsable
        Notification::create([
            'user_id' => $responsible->id,
            'type' => 'new_leave_request',
            'title' => 'Nouvelle demande de congé',
            'message' => "{$employee->full_name} a demandé un congé"
        ]);
        
        return response()->json($leaveRequest, 201);
    }
    
    // POST /api/leave-requests/{id}/approve
    public function approve(LeaveRequest $leaveRequest) {
        $leaveRequest->update([
            'status' => 'approved',
            'approved_by' => auth::id(),
            'approved_at' => now()
        ]);
        
        // Notification à l'employé
        Notification::create([...]);
        
        return response()->json(['message' => 'Congé approuvé']);
    }
}
```

## 1.5 Exemple de Workflow : Demande de Congé

```
┌───────────┐    ┌───────────┐    ┌───────────┐    ┌───────────┐
│ Employé   │    │   API     │    │ Database  │    │ Responsable│
│(Frontend) │    │Controller │    │  MySQL    │    │   / RH    │
└─────┬─────┘    └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
      │                │                │                │
      │ 1.POST /api/   │                │                │
      │   leave-      │                │                │
      │   requests    │                │                │
      │──────────────>│                │                │
      │                │ 2. Validation │                │
      │                │───────────────>                │
      │                │                │                │
      │                │ 3.INSERT INTO │                │
      │                │ leave_requests│                │
      │                │ (status=     │                │
      │                │  pending)     │                │
      │                │───────────────>│                │
      │                │                │                │
      │                │ 4.Notification│                │
      │                │ created       │                │
      │                │───────────────────────────────>│
      │                │                │                │
      │ 5.Response     │                │                │
      │   201 Created  │                │                │
      │<──────────────│                │                │
      │                │                │                │
      │                │         PUT /api/leave-         │
      │                │         requests/{id}          │
      │                │         {status:approved}      │
      │                │                │<──────────────│
      │                │                │                │
      │                │ 6.UPDATE       │                │
      │                │ status        │                │
      │                │───────────────>│                │
```

---

# 2. INTERFACE UTILISATEUR

> **IMPORTANT :** Cette section nécessite des captures d'écran. Voir la liste des captures ci-dessous.

## ✍️ Texte à écrire dans le rapport :

```markdown
### 3.X Interface utilisateur

L'interface utilisateur de l'application ElegantHR a été développée avec React.js en utilisant 
Tailwind CSS et Material UI afin d'offrir une expérience moderne, intuitive et responsive.

L'application adopte une architecture SPA (Single Page Application), permettant une navigation 
fluide sans rechargement de page, offrant ainsi une meilleure expérience utilisateur comparable 
aux applications desktop.

Elle est composée de plusieurs interfaces principales adaptées selon le rôle de l'utilisateur :
- **Administrateur** : Accès complet à toutes les fonctionnalités
- **RH Manager** : Gestion des employés, congés, absences et salaires
- **Responsable** : Gestion de son équipe et approbations
- **Employé** : Consultation de son profil, demandes de congés

L'interface comprend :
- Un système de navigation latérale (sidebar) responsive
- Un tableau de bord avec des graphiques interactifs (Recharts)
- Des formulaires de saisie validés côté client et serveur
- Un système de notifications en temps réel
- Le support du mode sombre (dark mode)
```

---

## 📸 LISTE DES CAPTURES D'ÉCRAN À FAIRE

### Capture 1 : Page de Login
**Chemin :** `http://localhost:3000/login`

```
À capturer :
- Le formulaire de connexion (email + mot de passe)
- Le branding ElegantHR sur le côté gauche
- Les comptes de test affichés en bas
```

**Légende à écrire :**
> *La figure X présente la page de connexion de l'application ElegantHR. Elle permet aux utilisateurs de s'authentifier de manière sécurisée via leur adresse email et mot de passe. On distingue également les comptes de test disponibles pour chaque rôle.*

### Capture 2 : Dashboard Principal (Admin)
**Chemin :** `http://localhost:3000/dashboard/admin`

```
À capturer :
- Les 4 cartes de statistiques (Employés, Congés en attente, Absences, Masse salariale)
- Le graphique des tendances d'absences (AreaChart)
- Le graphique de répartition par département (PieChart)
- Le tableau des demandes de congés récentes
```

**Légende à écrire :**
> *La figure X présente le tableau de bord principal du système. On peut y voir les indicateurs clés de performance (KPI) en temps réel : le nombre total d'employés, les congés en attente d'approbation, les absences du mois et la masse salariale. Le dashboard inclut également des graphiques interactifs montrant les tendances d'absences sur les 6 derniers mois ainsi que la répartition des employés par département.*

### Capture 3 : Gestion des Employés
**Chemin :** `http://localhost:3000/employees`

```
À capturer :
- La liste paginée des employés
- La barre de recherche et les filtres (département, statut)
- Le bouton d'ajout d'employé
- La colonne des actions (voir, modifier, supprimer)
```

**Légende à écrire :**
> *La figure X montre l'interface de gestion des employés. Cette page permet de visualiser l'ensemble des employés de l'entreprise avec leurs informations essentielles (matricule, nom, poste, département). Elle inclut des fonctionnalités de recherche, de filtrage par département ou statut, ainsi que la pagination pour une meilleure navigation.*

### Capture 4 : Formulaire Employé (Ajout/Modification)
**Chemin :** `http://localhost:3000/employees/new` ou `/employees/{id}/edit`

```
À capturer :
- Le formulaire complet avec tous les champs
- Les sections : Informations personnelles, Poste, Rémunération
```

### Capture 5 : Gestion des Congés
**Chemin :** `http://localhost:3000/leave-requests`

```
À capturer :
- Le tableau des demandes de congés
- Les statuts (En attente, Approuvé, Refusé) avec badges colorés
- Les boutons d'action (Approuver, Refuser)
```

### Capture 6 : Sidebar et Navigation
**Chemin :** Visible sur toutes les pages après connexion

```
À capturer :
- Le menu latéral avec tous les modules
- Les icônes des différents menus
- Le nom de l'utilisateur connecté
```

**Légende à écrire :**
> *La figure X présente la barre de navigation latérale de l'application. Celle-ci affiche les différents modules accessibles selon le rôle de l'utilisateur : Dashboard, Employés, Congés, Absences, Salaires, Primes, Départements, etc. On remarque que certains modules sont masqués selon les permissions de l'utilisateur connecté.*

### Capture 7 : Mode Sombre (Dark Mode)
**Chemin :** N'importe quelle page

```
À capturer :
- La même page que la capture 2 ou 3 mais en mode sombre
```

**Légende à écrire :**
> *La figure X présente le mode sombre de l'application, permettant une utilisation plus confortable dans des conditions de faible luminosité.*

### Capture 8 : Page Départements
**Chemin :** `http://localhost:3000/departments`

### Capture 9 : Page Salaires
**Chemin :** `http://localhost:3000/salaries`

### Capture 10 : Notifications
**Chemin :** `http://localhost:3000/notifications`

```
À capturer :
- La liste des notifications
- Le badge de compteur sur l'icône cloche
```

---

# 3. FONCTIONNEMENT DU SYSTÈME

## ✍️ Texte à écrire dans le rapport :

```markdown
### 3.X Fonctionnement du système

L'application fonctionne selon une architecture client-serveur basée sur une API REST. 
Cette architecture permet une séparation claire entre la partie frontend (interface utilisateur) 
et la partie backend (logique métier et base de données).

Le frontend, développé avec React.js, communique avec le backend Laravel via des requêtes 
HTTP utilisant la bibliothèque Axios. Les données sont échangées au format JSON, ce qui 
permet une intégration fluide et rapide.

### Flux de données

1. **Requête du client** : L'utilisateur interagit avec l'interface React (ex: soumettre un formulaire)
2. **Envoi vers l'API** : Axios envoie une requête HTTP (GET, POST, PUT, DELETE) vers le backend
3. **Traitement par le serveur** : Le contrôleur Laravel reçoit la requête, valide les données
4. **Interaction base de données** : Eloquent ORM interagit avec MySQL
5. **Réponse JSON** : Le serveur renvoie une réponse structurée
6. **Mise à jour de l'UI** : React met à jour l'interface selon la réponse

### Authentification

L'authentification est gérée par Laravel Sanctum selon le principe des "Personal Access Tokens" :
- L'utilisateur envoie ses identifiants via POST /api/login
- Le serveur valide et retourne un token Bearer
- Ce token est stocké côté client et envoyé dans l'en-tête de chaque requête
- Le middleware auth:sanctum vérifie la validité du token

### Gestion des rôles et permissions

Le système de permissions est basé sur le package Spatie Laravel-Permission :
- Les utilisateurs peuvent avoir plusieurs rôles (Admin, RH, Employé)
- Chaque rôle peut avoir plusieurs permissions
- Les middlewares CheckRole et CheckPermission protègent les routes sensibles
```

---

## 📸 Captures pour le Fonctionnement du Système

### Capture 11 : Network Tab - Requête API (Chrome DevTools)
**Procédure :**
1. Ouvrir Chrome DevTools (F12)
2. Aller dans l'onglet "Network"
3. Se connecter à l'application
4. Cliquer sur "Employés" dans le menu
5. Capturer la requête `employees` avec ses headers

```
À capturer :
- L'onglet Network avec la requête selected
- Les Headers de la requête (URL, Method, Status)
- L'en-tête Authorization avec le Bearer token
```

**Légende à écrire :**
> *La figure X illustre le flux de données entre le frontend et le backend. On observe dans l'onglet Network de Chrome DevTools la requête GET /api/employees envoyée avec l'en-tête Authorization contenant le token Bearer d'authentification. Le serveur retourne un code HTTP 200 avec les données au format JSON.*

### Capture 12 : Response JSON
**Procédure :**
1. Dans Chrome DevTools > Network
2. Cliquer sur une requête API
3. Aller dans l'onglet "Response" ou "Preview"

```
À capturer :
- La réponse JSON formatée
- Les données d'un employé (id, first_name, last_name, etc.)
```

---

# 4. TESTS DES APIS

## ✍️ Texte à écrire dans le rapport :

```markdown
### 4.X Tests des APIs

Les tests des APIs ont été réalisés à l'aide de l'outil Postman, qui permet d'envoyer 
des requêtes HTTP et d'analyser les réponses. Cette étape est essentielle pour vérifier 
le bon fonctionnement de chaque endpoint avant l'intégration frontend.

### Types de requêtes utilisées

| Méthode | Usage | Exemple |
|---------|-------|---------|
| GET | Lecture de données | GET /api/employees |
| POST | Création de ressource | POST /api/login |
| PUT | Modification | PUT /api/employees/{id} |
| DELETE | Suppression | DELETE /api/employees/{id} |

### Endpoints testés

| Module | Endpoints testés |
|--------|-------------------|
| Authentification | POST /api/login, POST /api/logout |
| Employés | GET, POST, PUT, DELETE /api/employees |
| Congés | GET, POST /api/leave-requests, POST /approve, POST /reject |
| Absences | GET, POST /api/absences |
| Salaires | GET, POST /api/salaries |
| Dashboard | GET /api/dashboard/stats |
```

---

## 📸 Captures pour les Tests APIs (Postman)

### Capture 13 : Test Login - Requête POST
**Configuration Postman :**
```
Method: POST
URL: http://localhost:8000/api/login
Body (raw JSON):
{
    "email": "admin.system@elegantart.com",
    "password": "password"
}
Headers:
Content-Type: application/json
```

```
À capturer :
- La requête avec URL et méthode
- Le body JSON
- La réponse (status 200 + token)
```

**Légende à écrire :**
> *La figure X présente le test de l'endpoint de connexion via Postman. La requête POST /api/login envoie les identifiants de l'administrateur et reçoit en réponse un code HTTP 200 OK accompagné d'un token Bearer permettant l'authentification aux autres endpoints protégés.*

### Capture 14 : Test Login - Réponse JSON
```
À capturer :
- La réponse JSON formatée
- Le token d'accès
- Les données utilisateur
```

### Capture 15 : Test GET Employees
**Configuration Postman :**
```
Method: GET
URL: http://localhost:8000/api/employees
Headers:
Authorization: Bearer {token}
```

```
À capturer :
- La requête avec le token Bearer
- La réponse JSON avec la liste paginée des employés
```

### Capture 16 : Test POST Leave Request
**Configuration Postman :**
```
Method: POST
URL: http://localhost:8000/api/leave-requests
Body (raw JSON):
{
    "type": "annual",
    "start_date": "2026-04-01",
    "end_date": "2026-04-05",
    "reason": "Vacances familiales"
}
```

### Capture 17 : Test Erreur 401 (Non authentifié)
```
À capturer :
- Requête sans token
- Réponse 401 Unauthenticated
```

### Capture 18 : Test Erreur 422 (Validation échouée)
**Configuration :**
```
Body (invalide - date passée) :
{
    "type": "annual",
    "start_date": "2020-01-01",
    "end_date": "2020-01-05",
    "reason": ""
}
```

```
À capturer :
- La réponse 422 avec les messages d'erreur de validation
```

---

## ✅ Exemples de Réponses API à inclure dans le rapport

### Login - Réponse 200 OK
```json
{
    "success": true,
    "user": {
        "id": 1,
        "name": "Admin System",
        "email": "admin.system@elegantart.com",
        "roles": [
            {"id": 1, "name": "Admin"}
        ]
    },
    "token": "1|abc123def456...",
    "token_type": "Bearer"
}
```

### GET /api/employees - Réponse 200 OK
```json
{
    "data": {
        "current_page": 1,
        "data": [
            {
                "id": 1,
                "employee_id": "EMP-000001",
                "first_name": "Ahmed",
                "last_name": "Benali",
                "email": "ahmed.benali@elegantart.com",
                "phone": "+212 600 000 001",
                "position": "Développeur Full Stack",
                "department": {
                    "id": 1,
                    "name": "Informatique"
                },
                "status": "active",
                "hire_date": "2024-01-15"
            }
        ],
        "per_page": 15,
        "total": 45
    }
}
```

### POST /api/leave-requests - Réponse 201 Created
```json
{
    "success": true,
    "message": "Demande de congé créée avec succès",
    "data": {
        "id": 23,
        "employee_id": 5,
        "type": "annual",
        "start_date": "2026-04-01",
        "end_date": "2026-04-05",
        "days": 5,
        "status": "pending",
        "created_at": "2026-03-27T10:30:00Z"
    }
}
```

### Erreur 401 - Non authentifié
```json
{
    "message": "Unauthenticated."
}
```

### Erreur 422 - Validation échouée
```json
{
    "message": "The given data was invalid.",
    "errors": {
        "email": ["The email field is required."],
        "start_date": ["La date de début doit être aujourd'hui ou après."]
    }
}
```

### Erreur 403 - Non autorisé
```json
{
    "message": "User does not have the right roles."
}
```

---

# 5. DÉPLOIEMENT

## ✍️ Texte à écrire dans le rapport :

```markdown
### 5.X Déploiement

### 5.1 Environnement de développement

Le projet a été développé en environnement local avec les outils suivants :

| Composant | Outil | Version |
|-----------|-------|---------|
| Backend | Laravel | 12.x |
| Serveur PHP | PHP | 8.2+ |
| Base de données | MySQL (XAMPP) | 8.x |
| Frontend | React.js | 19.x |
| Runtime JS | Node.js | 18+ |

**Démarrage de l'application :**

```bash
# Backend Laravel
cd backend
composer install
php artisan migrate
php artisan db:seed
php artisan serve

# Frontend React (nouvelle fenêtre terminal)
cd frontend
npm install
npm run dev
```

### 5.2 Solution de déploiement recommandée

Pour un déploiement en production, les solutions suivantes sont recommandées :

#### Option A : VPS (Serveur Privé Virtuel)
```
Frontend :  Hébergé sur /public_html (cPanel)
Backend :   Laravel sur le même serveur VPS
Database :  MySQL sur le serveur
SSL :       Let's Encrypt
```

#### Option B : Cloud (Moderne et Scalable)
```
Frontend :  Vercel (déploiement automatique depuis GitHub)
Backend :   Render ou Railway
Database :  PlanetScale (MySQL serverless)
Storage :   AWS S3 (fichiers et PDFs)
Domain :    Configurable
SSL :       Automatique
```

### 5.3 Étapes de déploiement (Option VPS + cPanel)

1. **Préparer le backend**
   - Uploader le projet Laravel sur le serveur
   - Configurer .env (APP_ENV=production, APP_DEBUG=false)
   - Exécuter composer install --optimize
   - Migrer la base de données : php artisan migrate

2. **Préparer le frontend**
   - Build production : npm run build
   - Uploader le dossier dist/ sur Vercel ou /public_html

3. **Configuration base de données**
   - Créer la base MySQL dans cPanel
   - Importer les données depuis le dump local

4. **Configuration domaine**
   - Pointer le domaine vers le serveur
   - Configurer le sous-domaine API (api.votredomaine.com)

### 5.4 Checklist pré-production

| Élément | Description |
|---------|-------------|
| .env production | APP_ENV=production, APP_DEBUG=false |
| HTTPS | Certificat SSL activé |
| Permissions | storage/ et bootstrap/ en 755 |
| Cache | php artisan config:cache, route:cache |
| Migration | Base de données à jour |
| Frontend build | npm run build exécuté |
| Backup | Sauvegarde de la base de données |
```

---

## 📸 Captures pour le Déploiement

### Capture 19 : Terminal - Backend Laravel
**Commandes à exécuter :**
```bash
cd backend
php artisan serve
```

```
À capturer :
- Le serveur Laravel démarré sur http://127.0.0.1:8000
```

**Légende à écrire :**
> *La figure X montre le serveur Laravel démarré en environnement local via la commande php artisan serve. Le backend est accessible à l'adresse http://127.0.0.1:8000.*

### Capture 20 : Terminal - Frontend React
**Commandes à exécuter :**
```bash
cd frontend
npm run dev
```

```
À capturer :
- Le serveur Vite/React démarré
- L'URL d'accès (http://localhost:5173 ou 3000)
```

### Capture 21 : Structure des dossiers (optionnel)
```bash
# Capture de la structure du projet
tree -L 2 -I 'node_modules|vendor' .
```

---

# 6. CONCLUSION ET PERSPECTIVES

## ✍️ Texte à écrire dans le rapport :

```markdown
## Conclusion

Au cours de ce stage, j'ai eu l'opportunité de développer une application CRM RH complète 
nommée ElegantHR pour Elegant Art Studio. Ce projet m'a permis de mettre en pratique les 
compétences acquises durant ma formation et d'acquérir de nouvelles compétences techniques.

### Bilan technique

Le projet a été réalisé avec une stack moderne et performante :
- **Laravel 12** pour le backend, avec une architecture MVC propre
- **React 19** pour le frontend, offrant une interface réactive et intuitive
- **MySQL** pour la gestion des données relationnelles
- **Laravel Sanctum** pour l'authentification par tokens
- **Spatie Permission** pour la gestion des rôles et permissions

### Fonctionnalités réalisées

L'application comprend les modules suivants :
- Gestion complète des employés (CRUD, export CSV)
- Gestion des demandes de congés avec workflow d'approbation
- Suivi des absences avec système de justification
- Gestion des salaires et génération de fiches de paie
- Système de primes et bonus
- Gestion des stagiaires et de leur évaluation
- Avertissements et suivi disciplinaire
- Tableaux de bord adaptatifs selon le rôle
- Système de notifications en temps réel

### Compétences développées

- Développement d'applications web full-stack
- Architecture REST API
- Gestion de base de données relationnelles
- Authentification et autorisation
- Tests d'APIs avec Postman
- Travail en méthodologie agile

### Perspectives d'amélioration

Pour enrichir l'application, les évolutions suivantes pourraient être envisagées :
1. **Module de recrutement** : Gestion des candidatures et du processus d'embauche
2. **Évaluations des performances** : Système d'évaluation annuel des employés
3. **Application mobile** : Développer une version React Native pour iOS/Android
4. **Intégration calendrier** : Synchronisation avec Google Calendar ou Outlook
5. **Rapports avancés** : Export PDF de rapports RH personnalisés
6. **Chatbot RH** : Assistant virtuel pour les questions fréquentes
7. **Intelligence artificielle** : Analyse prédictive du turnover, recommandations薪资
```

---

# 📁 ANNEXES

## Annexe 1 : Liste des routes API

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /api/login | Connexion utilisateur |
| POST | /api/register | Inscription |
| POST | /api/logout | Déconnexion |
| GET | /api/employees | Liste des employés |
| POST | /api/employees | Créer employé |
| GET | /api/employees/{id} | Détail employé |
| PUT | /api/employees/{id} | Modifier employé |
| DELETE | /api/employees/{id} | Supprimer employé |
| GET | /api/employees/export/csv | Export CSV |
| GET | /api/departments | Liste départements |
| POST | /api/departments | Créer département |
| GET | /api/leave-requests | Liste congés |
| POST | /api/leave-requests | Créer demande |
| POST | /api/leave-requests/{id}/approve | Approuver |
| POST | /api/leave-requests/{id}/reject | Refuser |
| GET | /api/absences | Liste absences |
| POST | /api/absences | Créer absence |
| POST | /api/absences/{id}/justify | Justifier |
| GET | /api/salaries | Liste salaires |
| POST | /api/salaries | Créer salaire |
| GET | /api/notifications | Liste notifications |
| POST | /api/notifications/{id}/read | Marquer lu |
| GET | /api/dashboard/stats | Statistiques |

## Annexe 2 : Structure de la base de données

| Table | Description |
|-------|-------------|
| users | Utilisateurs de l'application |
| employees | Fiches employées |
| departments | Départements |
| leave_requests | Demandes de congé |
| absences | Absences enregistrées |
| salaries | Fiches de salaire |
| notifications | Notifications |
| roles | Rôles (Spatie) |
| permissions | Permissions (Spatie) |
| model_has_roles | Liaison utilisateur-rôle |
| model_has_permissions | Liaison utilisateur-permission |
| leave_policies | Politiques de congé |
| warnings | Avertissements |
| interns | Stagiaires |
| intern_evaluations | Évaluations stages |
| employee_bonuses | Primes employés |
| salary_scales | Grilles salariales |
| merit_increases | Augmentations |
| department_budgets | Budgets départements |

## Annexe 3 : Commandes utiles

```bash
# Installation
composer install
npm install

# Base de données
php artisan migrate
php artisan db:seed
php artisan migrate:fresh --seed

# Développement
php artisan serve
npm run dev

# Production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Tests
php artisan test
```

---

# 🔧 COMMANDES À ME DEMANDER POUR GÉNÉRER

Pour compléter ton rapport, tu peux me demander :

1. **Pour le diagramme d'architecture :**
   ```
   Génère-moi un diagramme ASCII de l'architecture du projet ElegantHR
   ```

2. **Pour les exemples de code :**
   ```
   Montre-moi un exemple de contrôleur Laravel de ce projet
   ```

3. **Pour les screenshots de Postman :**
   ```
   Donne-moi les étapes exactes pour tester l'API avec Postman
   ```

4. **Pour les routes API :**
   ```
   Montre-moi toutes les routes API disponibles
   ```

5. **Pour la structure de la base de données :**
   ```
   Montre-moi les modèles Eloquent et leurs relations
   ```

6. **Pour les exemples JSON :**
   ```
   Donne-moi des exemples de requêtes/réponses API
   ```

---

**Fin du guide de rapport de stage**
