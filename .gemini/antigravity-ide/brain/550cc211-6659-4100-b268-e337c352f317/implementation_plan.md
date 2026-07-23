# Refactoring Dashboard Navigation to Next.js Routes

Currently, the application uses a Single-Page Application (SPA) approach within the Next.js `dashboard/page.js`. It conditionally renders components (`Feed`, `DiscoverView`, `ConnectionsView`, etc.) based on a Redux state (`activeTab`).

This approach breaks Next.js native routing, browser history (back/forward buttons), and direct URL sharing for these views.

## Proposed Changes

We will transition the dashboard from state-based rendering to path-based routing, adhering to Next.js App Router best practices.

### 1. Update Layout for Path-Based Navigation
- **File:** `frontend/src/app/dashboard/layout.js`
- **Change:** Replace the `activeTab` Redux state check with Next.js `usePathname()`.
- **Change:** Ensure all navbar items use `<Link href="...">` instead of dispatching `setActiveTab`.

### 2. Map Components to Dedicated Pages
We will create new routes under `/dashboard` to host the respective components. 

- **Home (Feed):** 
  - Route: `/dashboard` (remains the default dashboard view)
  - Content: The `<Feed />` component and the "Start a post" widget.
- **Discover:**
  - Route: `/dashboard/discover`
  - Content: `<DiscoverView />`
- **Connections:**
  - Route: `/dashboard/connections`
  - Content: `<ConnectionsView />`
- **Hackathons (Authenticated View):**
  - Route: `/dashboard/hackathons`
  - Content: `<HackathonsView />` 
  - *(Note: This does not conflict with the public SEO `/hackathons` page)*
- **AI Copilot:**
  - Route: `/dashboard/copilot`
  - Content: `<CareerCopilotView />`

### 3. Consolidate Groups Route
- Currently, `/groups` is a top-level route with a duplicated sidebar layout (`app/groups/layout.js`). 
- **Action:** Move the groups page to `/dashboard/groups` so it naturally inherits the main dashboard layout, and delete the redundant `app/groups` folder.

### 4. Mentors Route
- Currently, the sidebar links to `/mentors`. Since we recently created `/mentors` as a public SEO page (without the dashboard sidebar), the link will take the user out of the dashboard layout.
- **Action:** Leave the link pointing to `/mentors` for now, or if you prefer them to stay within the dashboard layout, we can create a `/dashboard/mentors` view.

## User Review Required

> [!IMPORTANT]
> **Mentors Routing:** Currently, clicking "Mentors" takes you to the public `/mentors` page, which does **not** have the dashboard sidebar. Should I create a dedicated `/dashboard/mentors` page for logged-in users, or is it okay if they are taken to the public page?
> 
> **Groups Routing:** I will move `/groups` to `/dashboard/groups` so we don't have to duplicate the sidebar code. Does that path change sound good?

Please approve this plan or let me know if you'd like adjustments to the routes!
