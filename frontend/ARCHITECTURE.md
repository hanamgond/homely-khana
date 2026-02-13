# HomelyKhana Project Architecture

## 🏛️ Core Principles

1.  **Vertical Slicing:** Features are grouped by **Domain** (e.g., `checkout`, `dashboard`), not by file type. We do not have a giant global `/components` folder.
2.  **The Golden Rule:** `src/app` is for **Routing** only. It contains NO business logic. It imports everything from `src/modules`.
3.  **Strict Boundaries:** Modules must only interact via their public `index.js` entry point. Never deep-import into another module's internal components.

---

## 📂 Folder Structure Guide

### `src/app`
* **Purpose:** Next.js App Router specific files (`page.js`, `layout.js`, `route.js`).
* **Content:** Minimal code. Imports Module and renders it.
* **Rule:** No state management or `useEffect` here.

### `src/modules` (The Business Logic)
Each folder here represents a distinct business feature.
* `components/`: React UI components specific to this module.
* `services/`: API calls, data transformation, and business rules.
* `models/`: Zod schemas (Data Contracts) to validate backend data.
* `index.js`: **The Public API**. Exports only what the rest of the app needs.

### `src/shared`
* **Purpose:** Truly reusable code used by **multiple** modules.
* **Content:** Buttons, Form Inputs, Date Formatters, `fetchWithToken` utility.
* **Rule:** Code here must be generic. It should not know about "Meals" or "Subscriptions".

---

## 🛠️ State Management Strategy

1.  **Local UI State:** Use `useState` inside components for things like toggles, inputs, and tabs.
2.  **Module Data:** Fetch in the top-level Module component (or a Service) and pass down via props.
3.  **Global State:** Use `AppContext` **only** for data that persists across the entire session:
    * User Profile (Name, ID)
    * Auth Status (Token)
    * Shopping Cart (Items)

---

## 🛡️ Coding Standards

* **Imports:** Always use absolute imports (`@/modules/...`) instead of relative (`../../`).
* **Services:** Logic requiring `fetch` or complex calculation goes into a `service.js` file, not the React Component.
* **Zod:** Use Zod schemas in `models.js` to validate API responses. Do not trust the backend blindly.

---

## 🚀 Adding a New Feature

1.  Create a new folder in `src/modules/` (e.g., `src/modules/rewards`).
2.  Build your components and logic inside.
3.  Export the main view from `src/modules/rewards/index.js`.
4.  Import it in `src/app/rewards/page.js`.