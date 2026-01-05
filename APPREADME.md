# DoW Directory Frontend Application Specification

## Executive Summary

Build a professional intelligence-grade interface for navigating the Department of War acquisition ecosystem. This is a business development power tool for defense contractors - think Bloomberg Terminal meets LinkedIn, but for DoD procurement. The aesthetic should convey **credibility, authority, and operational precision** while remaining highly usable for long research sessions.

---

## Design Direction: "Defense Intelligence Brief"

**Aesthetic Concept**: Military operational briefing room meets modern data intelligence platform. Clean, structured, confidence-inspiring. Muted tactical palette with sharp information hierarchy. Efficient, dense with data, but never cluttered.

**Key Differentiators**:
- **Hierarchical depth visualization**: Visual encoding of org chart depth (PAE → CPE → PM)
- **Relationship mapping**: Network graphs showing reporting structures
- **Quick intelligence extraction**: Rapid filtering and export for BD targeting
- **Professional authority**: Looks like something used in a SCIF or Pentagon briefing

---

## Technical Stack

### Core Technology
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS + custom CSS for advanced layouts
- **Data**: Load from CSV (converted to JSON), use local state management
- **Icons**: Lucide React
- **Charts/Viz**: Recharts for analytics, custom D3 for org charts (if needed)
- **Search**: Client-side fuzzy search with Fuse.js
- **Tables**: TanStack Table for advanced filtering/sorting

### Data Loading
```javascript
// Load the scraped CSV data
// In production, this would be API-based, but for prototype:
// 1. Convert CSV to JSON
// 2. Load as static import or fetch from /public
// 3. Index for fast searching
```

---

## Core Features & User Flows

### 1. **Global Search & Discovery** (Primary Entry Point)

**Purpose**: Instantly find any person, organization, or program in the DoD

**UI Components**:
- **Omnisearch Bar** (top of every page)
  - Large, prominent search input with keyboard shortcut (⌘K / Ctrl+K)
  - Real-time results dropdown as you type
  - Search across: Names, Organizations, Programs, Titles, Locations, Mission Areas
  - Result preview shows: Name/Org, Title, Parent Organization, Contact
  - Keyboard navigation (↑↓ to navigate, Enter to select, Esc to close)

**Search Results View**:
- Tabbed results: People | Organizations | Programs | All
- Filters sidebar: Service, Rank, Position Type, Location, Status
- Results cards showing key info with "View Details" button
- Export filtered results to CSV/Excel

**Implementation Notes**:
```javascript
// Use Fuse.js for fuzzy search
const fuse = new Fuse(data, {
  keys: ['name', 'organization_name', 'position', 'mission_area', 'key_programs'],
  threshold: 0.3,
  includeScore: true
});

// Real-time search with debouncing
const [searchQuery, setSearchQuery] = useState('');
const [results, setResults] = useState([]);

useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (searchQuery) {
      const searchResults = fuse.search(searchQuery);
      setResults(searchResults);
    }
  }, 150);
  return () => clearTimeout(timeoutId);
}, [searchQuery]);
```

---

### 2. **Organizational Explorer** (Hierarchy Navigation)

**Purpose**: Navigate the DoD org chart, understand reporting structures, identify decision chains

**UI Layout**:
```
┌─────────────────────────────────────────────────────┐
│  Service Selector: [Army] [Navy] [AF] [SF] [MC]    │
└─────────────────────────────────────────────────────┘
┌──────────────────┬──────────────────────────────────┐
│  Org Tree        │  Selected Org Details            │
│  (Left Panel)    │  (Main Panel)                    │
│                  │                                  │
│  ▼ Army          │  ┌─────────────────────────┐   │
│    ▼ PAE: LRFE   │  │ PAE: Long-Range Fires   │   │
│      ▶ CPE: MS   │  │ & Effects               │   │
│      ▶ CPE: AMD  │  └─────────────────────────┘   │
│    ▶ PAE: ASA    │                                  │
│                  │  MG John Smith • Confirmed       │
│                  │  Portfolio Acquisition Executive │
│                  │                                  │
│                  │  ▶ Mission: Long-range precision │
│                  │  ▶ Key Programs: 8 programs      │
│                  │  ▶ Reports to: ASA(ALT)          │
│                  │  ▶ Budget: $2.3B FY26            │
│                  │                                  │
│                  │  [View Full Hierarchy Chart]     │
│                  │  [Export Contact List]           │
└──────────────────┴──────────────────────────────────┘
```

**Left Panel: Interactive Org Tree**
- Collapsible tree structure (PAE → CPE → PM → Staff)
- Visual indicators:
  - Color coding by service branch
  - Icons for org type (⭐ PAE, ◆ CPE, ● PM)
  - Badge showing # of sub-orgs and people
- Click to select, view details in main panel
- "Expand All" / "Collapse All" buttons

**Main Panel: Organization Details Card**
- Header: Org name, type badge, mission statement
- Leadership section: Photos/names of key leaders with contact info
- Quick stats: # programs, budget size, personnel count
- Programs list (expandable)
- Parent organization breadcrumb trail
- "View Org Chart" button → opens visual hierarchy diagram
- "Export Roster" → download all contacts in this org as CSV

**Org Chart Visualization** (Modal/Full Screen):
- Interactive network diagram showing relationships
- Zoom/pan controls
- Click nodes to see details
- Export as PNG/PDF

---

### 3. **People Directory** (Contact Database)

**Purpose**: Find specific individuals, build contact lists, track leadership changes

**UI Layout**: Advanced data table with powerful filtering

**Table Columns** (sortable, hideable):
- Name | Rank | Position | Organization | Service | Location | Status | Email | Phone | Page #

**Filter Panel** (Left sidebar or collapsible top bar):
- **Service**: Multi-select checkboxes (Army, Navy, AF, SF, MC, OSD, Other)
- **Position Type**: PAE, CPE, PM, Deputy, Director, Staff, Other
- **Rank/Grade**: Flag Officer, O-6, O-5, SES, GS-15, etc.
- **Status**: Confirmed, Acting, PTDO, Nominated, Vacant
- **Location**: Base/facility multi-select
- **Mission Area**: Dropdowns for technology domains

**Bulk Actions**:
- Select multiple rows (checkboxes)
- "Export Selected" → CSV/Excel with all contact details
- "Add to List" → Save to custom contact list (see #6)
- "Email All" → Generate mailto: link with all selected emails

**Individual Person View** (Click name in table):
- Modal or side panel with full details
- Contact info prominently displayed
- Career history (if available from notes/multiple directory versions)
- Organizational context (hierarchy visualization)
- Related people (reports to, direct reports)
- LinkedIn lookup link (if name available)

---

### 4. **Program Intelligence** (Program-Centric View)

**Purpose**: Research specific weapons systems/programs, understand program office structure

**UI**: Similar to People Directory but program-focused

**Program Card**:
```
┌─────────────────────────────────────────────────┐
│  PATRIOT Missile System                         │
│  PM: COL Jane Smith │ CPE: Missiles & Space     │
├─────────────────────────────────────────────────┤
│  Mission: Air and missile defense               │
│  Budget: $1.2B FY26 │ Status: Production        │
│  Location: Huntsville, AL                       │
│                                                  │
│  Key Personnel (4):                             │
│    • COL Jane Smith - Program Manager           │
│    • Ms. Sarah Johnson - Deputy PM              │
│    • LTC Mike Davis - Asst PM Integration       │
│    • ...                                        │
│                                                  │
│  Related Programs: THAAD, IFPC, Sentinel        │
│  Parent: CPE Missiles & Space                   │
│                                                  │
│  [Contact PM] [View Full Roster] [Export]       │
└─────────────────────────────────────────────────┘
```

**Filtering**:
- By service, mission area, budget size, status
- Technology keyword search
- Related program clustering

---

### 5. **Mission Area Analysis** (Technology Domain View)

**Purpose**: Find all organizations working in specific tech areas (e.g., RF/EW, AI/ML, hypersonics)

**UI**: Tag-based exploration with network visualization

**Tech Area Categories**:
- Long-Range Fires | Air Defense | Aviation | Ground Combat
- C5ISR | Cyber | Electronic Warfare | Space Systems
- AI/ML | Autonomy | Hypersonics | Directed Energy
- Logistics | Medical | CBRN | Special Operations

**View Options**:
1. **Grid View**: Cards for each org/program in this domain
2. **Network View**: Visual map showing all connected entities
3. **List View**: Detailed table with all personnel/programs

**Use Case**: "Show me everyone working on Electronic Warfare"
- Lists all PAEs/CPEs/PMs with EW mission
- Shows personnel with EW in their title/position
- Programs with EW technology
- Export entire list for BD targeting

---

### 6. **Custom Lists & Targeting** (BD Campaign Management)

**Purpose**: Build and manage contact lists for outreach campaigns

**UI**: Project/campaign management style

**My Lists** (Left Sidebar):
- List of saved contact lists
- Create new list button
- Each list shows: Name, # contacts, last updated

**List Detail View**:
```
┌─────────────────────────────────────────────────┐
│  📋 Q1 2026 EW Outreach Campaign                │
│  24 contacts • Created Jan 5, 2026              │
├─────────────────────────────────────────────────┤
│  [+ Add Contacts] [Export] [Email All] [Share]  │
├─────────────────────────────────────────────────┤
│  MG John Smith • PAE Long-Range Fires           │
│    john.smith@mail.mil • Pentagon               │
│    Notes: Met at AFA 2025, interested in EW     │
│    ☐ Contacted  ☐ Meeting Scheduled             │
│                                                  │
│  COL Jane Doe • CPE Missiles & Space            │
│    jane.doe@mail.mil • Huntsville               │
│    Notes: Key decision maker for radar          │
│    ☑ Contacted  ☐ Meeting Scheduled             │
│                                                  │
│  ... (22 more contacts)                         │
└─────────────────────────────────────────────────┘
```

**Features**:
- Add notes per contact
- Track outreach status (contacted, meeting scheduled, proposal sent)
- Export to CRM-compatible formats
- Share lists with team members (if multi-user)

---

### 7. **Analytics Dashboard** (Overview & Insights)

**Purpose**: High-level insights about the DoD acquisition landscape

**Widgets/Cards**:

1. **Directory Statistics**
   - Total orgs: 250
   - Total personnel: 6,847
   - PAEs: 32 | CPEs: 127 | PMs: 489
   - Last updated: Dec 2025

2. **Leadership Changes** (if tracking versions)
   - Recent appointments/departures
   - Vacant positions
   - Acting/PTDO roles (potential instability)

3. **Service Breakdown** (Pie chart)
   - Personnel by service branch
   - Click to filter

4. **Top Mission Areas** (Bar chart)
   - Most common technology domains
   - # of programs per domain

5. **Geographic Distribution** (Map or list)
   - Personnel by location/base
   - Concentration of certain technologies

6. **Org Type Distribution**
   - PAE vs CPE vs PM vs Staff breakdown

7. **Contact Coverage** (Metric)
   - % of records with email: 45%
   - % of records with phone: 32%
   - Data quality score

---

## Visual Design Specifications

### Color Palette: "Defense Intelligence Tactical"

```css
:root {
  /* Primary - Muted slate/blue-gray (authority, intelligence) */
  --color-primary-50: #f8fafc;
  --color-primary-100: #f1f5f9;
  --color-primary-200: #e2e8f0;
  --color-primary-300: #cbd5e1;
  --color-primary-500: #64748b;
  --color-primary-700: #334155;
  --color-primary-900: #0f172a;
  
  /* Accent - Tactical orange/amber (alerts, CTAs) */
  --color-accent-400: #fb923c;
  --color-accent-500: #f97316;
  --color-accent-600: #ea580c;
  
  /* Service branch colors (used sparingly as tags) */
  --color-army: #4a5d23;      /* Olive drab */
  --color-navy: #002147;      /* Navy blue */
  --color-airforce: #00308f;  /* Air Force blue */
  --color-spaceforce: #1c1c1c; /* Black */
  --color-marines: #cc0000;   /* Scarlet */
  
  /* Semantic colors */
  --color-success: #16a34a;
  --color-warning: #eab308;
  --color-danger: #dc2626;
  --color-info: #0284c7;
  
  /* Neutrals */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f8fafc;
  --color-bg-tertiary: #f1f5f9;
  --color-border: #e2e8f0;
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
}

/* Dark mode variant (optional, for ops center feel) */
.dark {
  --color-bg-primary: #0f172a;
  --color-bg-secondary: #1e293b;
  --color-bg-tertiary: #334155;
  --color-border: #334155;
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #cbd5e1;
  --color-text-muted: #64748b;
}
```

### Typography

**Primary Font**: **IBM Plex Sans** (professional, technical, readable)
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- Use for: Body text, UI elements, tables

**Monospace Font**: **IBM Plex Mono** (for data, codes, technical details)
- Use for: Contact info, IDs, technical specifications

**Display Font** (optional, for headers): **Inter Tight** or **IBM Plex Sans Condensed**
- Use for: Large headings, hero sections only

```css
/* Import fonts */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

body {
  font-family: 'IBM Plex Sans', -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-primary);
}

h1 { font-size: 32px; font-weight: 700; line-height: 1.2; }
h2 { font-size: 24px; font-weight: 600; line-height: 1.3; }
h3 { font-size: 18px; font-weight: 600; line-height: 1.4; }
h4 { font-size: 16px; font-weight: 600; line-height: 1.4; }

.mono { font-family: 'IBM Plex Mono', monospace; }
```

### Layout Principles

1. **Dense but Breathable**: Pack information efficiently, but use whitespace strategically
2. **Grid-based**: 8px base grid system for consistency
3. **Responsive breakpoints**: Desktop-first (this is a power user tool)
   - Desktop: 1440px+ (primary)
   - Laptop: 1024-1439px
   - Tablet: 768-1023px (simplified view)
   - Mobile: <768px (search + list view only)

4. **Navigation**: Persistent top bar + left sidebar pattern
5. **Content area**: Max-width 1600px, centered on ultra-wide screens

### Component Styling

**Cards**:
```css
.card {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s, border-color 0.2s;
}

.card:hover {
  border-color: var(--color-primary-300);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
```

**Badges/Tags**:
```css
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.badge-pae { background: #dbeafe; color: #1e40af; }
.badge-cpe { background: #fef3c7; color: #92400e; }
.badge-pm { background: #fce7f3; color: #9f1239; }
```

**Buttons**:
```css
.btn-primary {
  background: var(--color-primary-700);
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-900);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-accent {
  background: var(--color-accent-500);
  color: white;
}
```

**Tables**:
- Zebra striping (subtle)
- Sticky header on scroll
- Row hover highlights
- Compact spacing (this is data-dense)
- Sort indicators on column headers

---

## Navigation Structure

```
┌─────────────────────────────────────────────────────┐
│  DoW Directory     [🔍 Search...]  [Profile] [⚙️]   │ ← Top Bar
├──────────┬──────────────────────────────────────────┤
│  📊 Home │  Main Content Area                       │
│  🔍 Search                                           │
│  🏢 Orgs │                                           │
│  👥 People│                                           │
│  🎯 Programs                                         │
│  🏷️ Mission Areas                                   │
│  📋 My Lists (3)                                     │
│  ─────── │                                           │
│  📈 Analytics                                        │
│  ⚙️ Settings                                         │
└──────────┴──────────────────────────────────────────┘
```

**Top Navigation Bar**:
- App logo/name (left)
- Global search (center, prominent)
- User profile, notifications, settings (right)
- Dark mode toggle

**Left Sidebar**:
- Primary navigation items with icons
- "My Lists" section (collapsible)
- Contextual filters when on specific pages

---

## Key Interactions & Animations

### Micro-interactions
1. **Search**: Fade in results with stagger effect
2. **Cards**: Subtle lift on hover (translateY + shadow)
3. **Org tree**: Smooth expand/collapse animations
4. **Tables**: Row highlight slide in from left
5. **Buttons**: Scale + shadow on hover
6. **Badges**: Pulse animation for "new" or "updated" items

### Page Transitions
- Fade + slide in for page changes
- Loading states: Skeleton screens (not spinners)

### Data Visualization Animations
- Charts: Animate values on load
- Org charts: Zoom/pan with smooth transitions
- Network graphs: Spring physics for organic movement

---

## Responsive Behavior

**Desktop (1440px+)**: Full-featured experience
- 3-column layouts where appropriate
- Side-by-side comparisons
- Org chart visualizations

**Laptop (1024-1439px)**: Optimized layout
- 2-column layouts
- Collapsible sidebars
- All features available

**Tablet (768-1023px)**: Simplified
- Single column + collapsible navigation
- Tables scroll horizontally
- Org charts in simplified view

**Mobile (<768px)**: Essential features only
- Search-first interface
- Simple list views
- No complex visualizations
- Export and share functions still available

---

## Advanced Features (Phase 2)

### 1. Multi-User Collaboration
- Share lists with team members
- Comment threads on contacts
- Activity feed (who added/contacted whom)

### 2. CRM Integration
- Export to Salesforce/HubSpot
- Sync contact status updates
- Track engagement history

### 3. Change Tracking
- Compare directory versions
- Alert on leadership changes
- Track vacant positions
- Monitor "Acting" vs "Confirmed" transitions

### 4. AI-Powered Insights
- "Similar contacts" recommendations
- Suggest contacts based on mission area
- Auto-categorize programs by technology
- Predict org structure changes

### 5. Email Integration
- Generate templated outreach emails
- Track email open rates
- Schedule follow-ups

### 6. Calendar Integration
- Track industry days, conferences
- Show when PMs are rotating out (typical 2-3 year cycle)
- Schedule strategic outreach timing

---

## Data Requirements

### CSV Structure (from scraper)
The app expects a CSV with these columns:
```
Service, Organization_Type, Organization_Name, Org_Abbreviation, 
Parent_Org, Portfolio, Name, Rank_Title, Position, Position_Type, 
Status, Email, Phone, Location, Mission_Area, Key_Programs, 
Page_Number, Section
```

### Data Transformation
On app load:
1. Parse CSV → JSON array
2. Build indexes for fast searching:
   - By name
   - By organization
   - By service
   - By mission area
3. Build org hierarchy tree structure
4. Generate relationship map (parent-child links)
5. Create mission area tags

### Sample Data Structure
```javascript
const person = {
  id: "hash_of_name_org",
  name: "MG John Smith",
  rank: "MG",
  firstName: "John",
  lastName: "Smith",
  position: "Portfolio Acquisition Executive",
  positionType: "PAE",
  organization: {
    name: "PAE: Long-Range Fires & Effects",
    abbreviation: "PAE LRFE",
    type: "PAE",
    service: "Army"
  },
  parentOrg: "ASA(ALT)",
  contact: {
    email: "john.smith@mail.mil",
    phone: "(256) 555-1234",
    location: "Redstone Arsenal, AL"
  },
  missionArea: ["Long-Range Fires", "Precision Strike"],
  keyPrograms: ["LRPF", "PrSM", "ERCA"],
  status: "Confirmed",
  pageNumber: 102
};
```

---

## Development Phases

### Phase 1: MVP (Core Functionality)
**Goal**: Usable search & browse interface
- Global search (people, orgs)
- People directory with filtering
- Org explorer (tree view + details)
- Basic export (CSV)
- Analytics dashboard (simple stats)

**Timeline**: 2-3 weeks of focused development

### Phase 2: Advanced Features
**Goal**: Power user tools
- Program intelligence view
- Mission area analysis
- Custom lists & targeting
- Advanced org chart visualizations
- Bulk actions & campaign management

**Timeline**: 3-4 weeks

### Phase 3: Intelligence Layer
**Goal**: Insights and automation
- Change tracking across versions
- CRM integration
- AI-powered recommendations
- Email templates & tracking
- Collaborative features

**Timeline**: 4-6 weeks

---

## Technical Implementation Notes

### Performance Optimization
1. **Virtual scrolling** for long tables (TanStack Virtual)
2. **Lazy loading** for images/photos
3. **Debounced search** (150ms delay)
4. **Memoized calculations** for derived data
5. **IndexedDB** for client-side caching (optional)

### Accessibility
- Keyboard navigation throughout
- ARIA labels on interactive elements
- Focus management for modals/drawers
- Color contrast meets WCAG AA
- Screen reader-friendly table structure

### Testing
- Unit tests for data transformations
- Integration tests for search/filter logic
- E2E tests for critical user flows (Playwright)
- Visual regression tests (Percy/Chromatic)

---

## Sample Component Code Structure

```typescript
// src/types/index.ts
export interface Person {
  id: string;
  name: string;
  rank?: string;
  position: string;
  positionType: 'PAE' | 'CPE' | 'PM' | 'Deputy' | 'Director' | 'Staff';
  organization: Organization;
  parentOrg?: string;
  contact: ContactInfo;
  missionArea: string[];
  keyPrograms: string[];
  status: 'Confirmed' | 'Acting' | 'PTDO' | 'Nominated' | 'Vacant';
  pageNumber: number;
}

export interface Organization {
  id: string;
  name: string;
  abbreviation: string;
  type: 'PAE' | 'CPE' | 'PM' | 'Office' | 'Agency';
  service: 'Army' | 'Navy' | 'Air Force' | 'Space Force' | 'Marines' | 'OSD' | 'Other';
  parent?: string;
  children: string[];
  personnel: string[]; // Person IDs
}

// src/components/GlobalSearch.tsx
export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query) {
        const searchResults = performSearch(query);
        setResults(searchResults);
      }
    }, 150);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <CommandPalette
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      query={query}
      onQueryChange={setQuery}
      results={results}
    />
  );
}

// src/components/OrgExplorer.tsx
export function OrgExplorer() {
  const [selectedService, setSelectedService] = useState<Service>('Army');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const orgTree = useOrgTree(selectedService);

  return (
    <div className="flex h-full">
      <aside className="w-80 border-r border-gray-200 overflow-y-auto">
        <ServiceSelector
          value={selectedService}
          onChange={setSelectedService}
        />
        <OrgTree
          tree={orgTree}
          expandedNodes={expandedNodes}
          onToggle={(nodeId) => {
            const newExpanded = new Set(expandedNodes);
            if (newExpanded.has(nodeId)) {
              newExpanded.delete(nodeId);
            } else {
              newExpanded.add(nodeId);
            }
            setExpandedNodes(newExpanded);
          }}
          onSelect={setSelectedOrg}
        />
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        {selectedOrg ? (
          <OrgDetailView org={selectedOrg} />
        ) : (
          <EmptyState message="Select an organization to view details" />
        )}
      </main>
    </div>
  );
}
```

---

## Success Metrics

### User Engagement
- Time spent in app per session
- Search queries per session
- Exports generated
- Lists created
- Contacts added to lists

### Business Value
- Speed of contact discovery (vs manual PDF searching)
- Number of qualified leads identified
- BD campaign efficiency (contacts per hour)
- Intelligence quality (user feedback)

### Technical Performance
- Search latency (<150ms)
- Initial page load (<2s)
- Table render time (<500ms for 1000 rows)
- Export generation time (<3s for 500 records)

---

## Deployment & Distribution

### Hosting Options
1. **Static Site** (Vercel/Netlify) - Simple, fast, no backend needed
2. **Internal Server** - For proprietary/sensitive use
3. **Desktop App** (Electron) - Offline-first, no data leaves local machine

### Data Updates
- Manually upload new CSV when directory updates
- Or: Set up automated scraper on schedule (quarterly)
- Version tracking for historical comparison

### Access Control
- Single-user: No auth needed, desktop app
- Team: Basic auth or SSO
- Enterprise: Full RBAC with audit logs

---

## Next Steps for Implementation

1. **Set up React project** with TypeScript + Tailwind
2. **Implement data loading** from CSV → JSON transformation
3. **Build GlobalSearch** component (highest ROI)
4. **Create PeopleDirectory** table view with filters
5. **Add OrgExplorer** with tree navigation
6. **Implement export** functionality
7. **Polish UI** with animations and refinements
8. **Test with real data** from scraper output
9. **Deploy** to hosting platform
10. **Iterate** based on user feedback

This specification provides a complete blueprint for building a professional-grade DoD acquisition intelligence platform. The interface prioritizes speed, density, and usability - exactly what you need for effective BD targeting in the defense space.
