# Sales Pilot AI

<div align="center">
  <h1>⚡ Sales Pilot AI</h1>
  <p align="center">
    <strong>Enterprise Revenue Operations, Autonomous Sales Copilot & MEDDPICC Intelligence Platform</strong>
  </p>

  <p align="center">
    <a href="#overview">Overview</a> •
    <a href="#key-features">Key Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#environment-variables">Configuration</a> •
    <a href="#ai-copilot-personas">AI Personas</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/Angular-21.0-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular 21" />
    <img src="https://img.shields.io/badge/Google%20Gemini-3.5%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google Gemini" />
    <img src="https://img.shields.io/badge/Express-5.1-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express 5" />
    <img src="https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS v4" />
    <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5.9" />
  </p>
</div>

---

## 🚀 Overview

**Sales Pilot AI** is an enterprise revenue copilot and CRM operations intelligence platform engineered for Chief Revenue Officers (CROs), RevOps leaders, Sales Managers, and Account Executives. 

Built with **Angular 21** (Signals & SSR) and powered by **Google Gemini AI (`@google/genai`)**, Sales Pilot AI unifies real-time CRM pipeline telemetry, automated MEDDPICC deal qualification, predictive win-rate scoring, live global foreign exchange (FX) currency conversions, automated sales cadences, and dynamic vector-grade executive PDF reporting into a unified, high-performance command deck.

---

## ⚡ Key Features

### 1. 🤖 Google Gemini Multi-Turn AI Revenue Copilot
- **Multi-Persona Strategic AI Agents**:
  - **CRO Strategist**: Strategic ARR optimization, board-level forecast scenarios, and territory quota allocation.
  - **MEDDPICC Auditor**: Deep deal qualification gap analysis (Metrics, Economic Buyer, Decision Criteria, Decision Process, Paper Process, Pain, Champion, Competition).
  - **Outreach & Objection Specialist**: Context-aware executive email generation, cold cadences, and complex objection handling.
  - **Revenue Data Scientist**: Statistical win-rate regression, pipeline velocity analysis, and deal health decay warnings.
- **Model Flexibility**: Seamless runtime switching between `gemini-3.5-flash`, `gemini-3.1-pro-preview`, and `gemini-3.1-flash-lite`.
- **Live Pipeline Grounding**: Injects live CRM pipeline metrics, deal status, and stakeholder maps directly into the prompt context for hyper-accurate, contextual guidance.

### 2. 📊 Bento Command Deck & Pipeline Velocity Index
- Real-time pipeline health tracking with reactive **Angular Signals**.
- KPI Bento Stat Cards with historical week-over-week deltas and inline sparklines.
- Dynamic SVG pipeline velocity distribution and monthly trajectory curves.
- Model Drift Telemetry monitoring Population Stability Index (PSI), p-values, and feature driver shifts.

### 3. 🎯 Intelligent Leads & MEDDPICC Deal Inspector
- Comprehensive Deal Drawer displaying stakeholder maps, buyer sentiments, activity timelines, and historical health score shifts.
- Interactive 8-point MEDDPICC qualification matrix with automatic deal health reassessment (`Healthy`, `Warning`, `At Risk`, `Accelerating`).
- Document attachment vault tracking proposal, contract, security review, and MSA approvals.

### 4. 💱 Live Multi-Currency & FX Exchange Rate Engine
- Support for **150+ international currencies** categorized across all global regions (North America, Europe, Asia Pacific, LATAM, Middle East, Africa).
- Live interbank exchange rate synchronization via Open Exchange Rates API with automatic 60-second caching and resilient fallback baselines.
- Real-time interactive currency converter calculator and instant multi-currency deal redenomination.

### 5. 📑 Executive Brief PDF Generation (Vector Client Engine)
- One-click client-side export using `jspdf`.
- Multi-page structured executive summaries, complete with company financials, stakeholder org matrices, MEDDPICC scorecards, and next steps.

### 6. 🔄 Outbound Cadences & CRM Ingestion Hub
- Pre-built multi-step sales outreach cadences with reply rate tracking and automated event triggers.
- Ingestion Hub for Accounts, Products, Sales Reps, and CRM Data Dictionaries.

---

## 🛠️ Tech Stack & Technologies

### Frontend Architecture
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Angular** | `21.0.0` | Enterprise frontend framework utilizing modern Signals (`signal`, `computed`), Zoneless / OnPush change detection, and standalone components |
| **Angular SSR** | `21.0.0` | Universal Server-Side Rendering (`@angular/ssr`, `@angular/platform-server`) for fast initial loads |
| **Tailwind CSS** | `4.1.12` | Next-generation utility-first styling engine via `@tailwindcss/postcss` |
| **Angular Material / CDK** | `21.0.0` | Accessible UI primitives and Material Icons (`@angular/material`, `@angular/cdk`) |
| **TypeScript** | `5.9.2` | Strictly-typed modern JavaScript development |
| **jsPDF** | `4.2.1` | Client-side vector PDF document generation engine |
| **Motion** | `12.23.24` | Smooth transitions and micro-animations |
| **RxJS** | `7.8.0` | Reactive asynchronous event handling |

### Backend & AI Services
| Technology | Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `20+ / 22+` | Server runtime environment |
| **Express** | `5.1.0` | Server framework handling API routes (`/api/chat`, `/api/fx-rates`) and SSR rendering via `AngularNodeAppEngine` |
| **@google/genai** | `2.4.0` | Official Google Gemini SDK for multi-turn conversational agents, prompt orchestration, and token management |
| **Open Exchange Rates** | API Feed | Real-time global FX rate feed with cached fallbacks |

### Development & Tooling
- **Angular CLI**: Build pipelines, bundling, and local development servers (`@angular/cli`, `@angular/build`).
- **ESLint & TypeScript-ESLint**: Code quality and standards enforcement.
- **Vitest**: Unit testing suite.
- **Cross-Env**: Cross-platform environment variable configuration.

---

## 🏛️ System Architecture

```mermaid
graph TD
    User([Enterprise User / CRO / Rep]) <-->|Browser / Mobile| WebApp[Angular 21 Client Application]
    
    subgraph "Frontend Layer (Angular 21)"
        WebApp --> Signals[Signal Reactive State]
        Signals --> Bento[Bento Command Deck]
        Signals --> Leads[MEDDPICC Deal Inspector]
        Signals --> FX[Multi-Currency FX Engine]
        Signals --> CopilotUI[AI Copilot Interface]
        WebApp --> PDFGen[jsPDF Document Engine]
    end

    subgraph "Backend Layer (Node.js & Express 5 SSR)"
        WebApp <-->|HTTP / REST| ExpressServer[Express SSR Server]
        ExpressServer --> AngularSSR[AngularNodeAppEngine]
        ExpressServer --> APIChat[/api/chat Endpoint/]
        ExpressServer --> APIFX[/api/fx-rates Endpoint/]
    end

    subgraph "External Intelligence & Feeds"
        APIChat <-->|@google/genai| GeminiAPI[Google Gemini Models\n- gemini-3.5-flash\n- gemini-3.1-pro-preview\n- gemini-3.1-flash-lite]
        APIFX <-->|REST API| FXFeed[Open Exchange Rates Live Feed]
    end
```

---

## 📂 Project Structure

```
sales-pilot-ai/
├── public/                 # Static public assets and favicons
├── src/
│   ├── app/
│   │   ├── app.ts                 # Main Angular component with Signals, state management, & tabs
│   │   ├── app.html               # Enterprise UI layout, Bento cards, deal drawer, & copilot
│   │   ├── app.css                # Custom styling, animations, and typography
│   │   ├── app.config.ts          # Client application configuration and providers
│   │   ├── app.config.server.ts   # Server-side rendering configuration
│   │   ├── app.routes.ts          # Application routing
│   │   ├── crm-dataset.data.ts    # Seed datasets (Accounts, Products, Teams, Pipeline, Dictionary)
│   │   ├── currency-data.ts       # 150+ international currencies and formatting helpers
│   │   └── executive-brief-pdf.ts # Vector PDF generation engine powered by jsPDF
│   ├── index.html          # HTML entry point with modern typography (Syne, Inter)
│   ├── main.ts             # Client bootstrap entry point
│   ├── main.server.ts      # SSR bootstrap entry point
│   ├── server.ts           # Express 5 backend with /api/chat and /api/fx-rates
│   └── styles.css          # Tailwind CSS v4 directives and global theme tokens
├── angular.json            # Angular CLI project build configurations
├── package.json            # NPM dependencies and run scripts
├── tsconfig.json           # TypeScript configuration
└── .env.example            # Environment variables template
```

---

## 🚦 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm** or **bun**

### 1. Clone the Repository
```bash
git clone https://github.com/sudhanmuniyasamy/Sales-Pilot-AI.git
cd Sales-Pilot-AI
```

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Environment Configuration
Create a `.env.local` or `.env` file in the project root:

```env
# Gemini API Key (Required for AI Copilot features)
GEMINI_API_KEY="your-gemini-api-key-here"

# Application URL
APP_URL="http://localhost:3000"

# Optional Server Port (Defaults to 3000 for dev, 4000 for SSR production)
PORT=3000
```

> **Tip:** You can obtain a Gemini API key from the [Google AI for Developers](https://ai.google.dev/) portal.

### 4. Run Development Server
```bash
npm run dev
```

The application will be running at [http://localhost:3000](http://localhost:3000).

### 5. Production Build & SSR
```bash
# Build both client and server bundles
npm run build

# Start the high-performance SSR production server
npm run serve:ssr:app
```

---

## 🤖 AI Copilot Personas & Use Cases

| Persona | Focus Area | Example Prompt |
| :--- | :--- | :--- |
| **CRO Strategist** | Pipeline Risk, ARR Projections, Forecasting | *"Evaluate our Q3 pipeline risk and recommend 3 tactical moves to hit our $12M ARR target."* |
| **MEDDPICC Auditor** | Qualification Gaps, Economic Buyers, Criteria | *"Audit the Acme Corp deal ($450K ARR). What missing MEDDPICC elements could delay closing?"* |
| **Outreach Specialist** | Personalized Inbound/Outbound, Objections | *"Draft a persuasive follow-up email to the VP of Engineering addressing security and SOC-2 compliance concerns."* |
| **Revenue Scientist** | Velocity Calculations, Win-Rate Statistics | *"Analyze our average sales cycle across APAC vs. EMEA and identify key velocity bottlenecks."* |


---

