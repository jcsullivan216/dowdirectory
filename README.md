# DoW Directory PDF Scraper

## Quick Start: Run the Frontend App

```bash
cd dow-directory-app
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

**Features:**
- Global search (Cmd+K / Ctrl+K) across 6,400+ personnel records
- People Directory with filtering by service, position type, status
- Organization Explorer with tree navigation
- Analytics Dashboard with charts and data quality metrics
- CSV export for filtered results

---

## Overview

This scraper extracts structured data from the 2025 Department of War (DoW) Directory PDF (v35) into a clean, queryable CSV format for business development and market intelligence purposes. The 372-page directory contains the organizational structure, personnel, and contact information for the entire DoW acquisition ecosystem, including Office of the Secretary of Defense (OSD), all military services (Army, Navy, Air Force, Space Force, Marines), Combatant Commands, and supporting agencies.

## What This Scraper Extracts

### Core Data Fields

The scraper will produce a comprehensive CSV with the following columns:

#### Organizational Hierarchy
- **Service/Agency** - Top-level organization (e.g., Army, Navy, Air Force, OSD, SOCOM, MDA)
- **Organization_Type** - Category (PAE, CPE, PM, OSD Office, Lab, Agency, etc.)
- **Organization_Name** - Full official name
- **Organization_Abbreviation** - Common acronym/abbreviation
- **Parent_Organization** - Immediate parent in hierarchy
- **Portfolio** - Portfolio Acquisition Executive if applicable (new 2025 structure)

#### Personnel Information
- **Name** - Full name of individual
- **Rank_Title** - Military rank or civilian title (e.g., "MG", "SES", "PTDO")
- **Position** - Official position/role title
- **Position_Type** - Categorized role (PAE, CPE, PM, Deputy, Director, etc.)
- **Status** - Appointment status (Confirmed, Acting, PTDO, Nominated, etc.)

#### Contact & Location
- **Email** - Email address (when available)
- **Phone** - Phone number (when available)
- **Location** - Physical location/base/facility
- **Building** - Building number/name (when available)

#### Program/Mission Details
- **Mission_Area** - Mission domain (e.g., Aviation, Missiles, C5ISR, Cyber, Space)
- **Key_Programs** - Major programs/systems managed
- **Budget_Category** - RDT&E, Procurement, O&M classification
- **Technology_Focus** - Key technology areas

#### Metadata
- **Page_Number** - Source page in PDF
- **Section** - Document section location
- **Last_Updated** - Directory version date
- **Notes** - Additional context or special annotations

### Hierarchical Structure Capture

The scraper will preserve and represent the new 2025 acquisition hierarchy:

**Level 1: Service/Agency**
- Department of War (OSD)
- Army
- Navy
- Air Force
- Space Force
- Marines
- SOCOM
- Other DoD agencies (MDA, DTRA, DLA, etc.)

**Level 2: Portfolio Acquisition Executive (PAE)** *(New 2025 structure)*
- e.g., "Army PAE: Long-Range Fires & Effects"
- e.g., "Army PAE: Agile Sustainment and Ammo"
- PAEs act as "CEOs" of capability domains with end-to-end control

**Level 3: Capability Program Executive (CPE)** *(Formerly PEO)*
- e.g., "CPE Missiles and Space"
- e.g., "CPE Aviation"
- CPEs manage specific acquisition programs within portfolios

**Level 4: Program Manager (PM)**
- Individual weapon systems/programs
- e.g., "PM LTAMDS", "PM Patriot", "PM Future Vertical Lift"

**Level 5: Deputy/Assistant PMs and Staff**

## Key Features

### 1. Intelligent Parsing
- **Hierarchical awareness**: Recognizes org structure from document formatting and headers
- **Title normalization**: Standardizes military ranks, civilian grades (SES, GS-15, etc.)
- **Status detection**: Identifies Acting, PTDO, Nominated, Confirmed positions
- **Duplicate handling**: Resolves same person appearing in multiple roles

### 2. Entity Recognition
- **Personnel extraction**: Names, ranks, titles with high accuracy
- **Organization matching**: Links individuals to correct org units
- **Contact information**: Email/phone extraction where present
- **Program identification**: Extracts program names and abbreviations

### 3. Data Enrichment
- **Budget cross-reference**: Links to budget line items where mentioned
- **Program categorization**: Classifies by mission area and technology
- **Hierarchy validation**: Ensures parent-child relationships are correct
- **Location mapping**: Standardizes facility/base names

### 4. Quality Assurance
- **Consistency checks**: Validates organizational structure
- **Completeness scoring**: Flags records missing critical fields
- **Duplicate detection**: Identifies potential duplicate entries
- **Reference validation**: Checks internal cross-references

## Special Handling

### New 2025 Acquisition Structure
The scraper specifically handles the transformation from the old PEO structure to the new PAE/CPE model:
- Identifies Portfolio Acquisition Executives (PAEs)
- Maps former PEOs to new Capability Program Executives (CPEs)
- Preserves both old and new nomenclature for transition tracking
- Captures matrix organization relationships

### Multiple Organizational Affiliations
Many individuals have multiple roles or sit in matrix organizations. The scraper:
- Creates separate records for each distinct role
- Uses linking fields to show relationships
- Flags primary vs. secondary appointments

### Variable Data Density
Different sections have different information richness:
- Some sections: Full contact info + detailed program descriptions
- Other sections: Just names and titles
- Scraper flags data quality level per record

## Output Format

### Primary CSV Structure
```csv
Service,Organization_Type,Organization_Name,Org_Abbreviation,Parent_Org,Portfolio,Name,Rank_Title,Position,Position_Type,Status,Email,Phone,Location,Mission_Area,Key_Programs,Page_Number
Army,PAE,Portfolio Acquisition Executive: Long-Range Fires & Effects,PAE LRFE,ASA(ALT),,MG John Smith,MG,Portfolio Acquisition Executive,PAE,Confirmed,,,Redstone Arsenal,Long-Range Fires,"LRPF, PrSM, ERCA",102
Army,CPE,Capability Program Executive: Missiles and Space,PEO MS,PAE LRFE,,COL Jane Doe,COL,Capability Program Executive,CPE,Confirmed,,,Huntsville AL,Missiles & Space,"Patriot, THAAD, IFPC",105
```

### Relationship CSV (Optional)
Captures organizational relationships:
```csv
Child_Entity,Child_Type,Parent_Entity,Parent_Type,Relationship_Type
PEO MS,CPE,PAE LRFE,PAE,Reports_To
PM Patriot,PM,PEO MS,CPE,Part_Of
```

## Data Quality Metrics

The scraper will output quality statistics:
- **Total records extracted**: ~5,000-8,000 expected
- **Completeness scores**: Percentage of fields populated per record
- **Hierarchy validation**: Percentage of parent-child links verified
- **Contact information coverage**: Percentage with email/phone
- **Duplicate rate**: Percentage of potential duplicate entities

## Use Cases

### Business Development
- **Target identification**: Find Program Managers for specific technology areas
- **Hierarchy mapping**: Understand decision-making chains
- **Contact database**: Build outreach lists for specific portfolios
- **Portfolio analysis**: Identify all programs within a mission area

### Market Intelligence
- **Organizational changes**: Track PAE/CPE restructuring
- **Personnel movements**: Monitor leadership changes
- **Budget alignment**: Cross-reference with budget documents
- **Competitive analysis**: Identify program incumbents and opportunities

### Relationship Mapping
- **Decision maker identification**: Find approval authorities
- **Requirements owners**: Locate operational requirements leads
- **Innovation offices**: Identify non-traditional acquisition paths
- **SBIR coordinators**: Find small business program contacts

## Technical Approach

### Parsing Strategy
1. **Section identification**: Detect major sections (OSD, Army, Navy, etc.)
2. **Hierarchy extraction**: Build org tree from headers and indentation
3. **Personnel extraction**: Use regex + NER for names, titles, positions
4. **Contact extraction**: Pattern matching for emails, phones
5. **Validation**: Cross-reference internal document links

### Challenges & Solutions
- **Inconsistent formatting**: Use multiple parsing strategies, fuzzy matching
- **Embedded tables**: OCR + table detection for structured data sections
- **Acronym disambiguation**: Build acronym dictionary from glossary section
- **Page breaks**: Track context across page boundaries
- **Special characters**: Handle military ranks, special titles properly

### Processing Steps
1. PDF text extraction with layout preservation
2. Section segmentation (Table of Contents-based)
3. Header hierarchy detection
4. Named entity recognition (people, orgs, programs)
5. Relationship extraction
6. Contact pattern matching
7. Data normalization and deduplication
8. CSV output generation
9. Quality report generation

## Dependencies
- `pdfplumber` or `pypdf` for PDF extraction
- `pandas` for data manipulation
- `spacy` for named entity recognition (optional enhancement)
- `regex` for pattern matching
- `fuzzywuzzy` for fuzzy string matching (optional)

## Expected Output Size
- **Primary CSV**: ~5,000-8,000 rows × 20-25 columns
- **Relationship CSV**: ~3,000-5,000 rows × 5 columns
- **File sizes**: 1-3 MB total

## Maintenance Notes
- Directory updates quarterly ("Update 3" indicates v35 is third 2025 update)
- Org structure changes frequently (military officers rotate every 2-3 years)
- New programs added, old programs closed regularly
- Contact information changes without notice
- PAE/CPE transformation still ongoing through 2025-2026

## Future Enhancements
1. **Incremental updates**: Diff between directory versions
2. **LinkedIn enrichment**: Cross-reference with LinkedIn profiles
3. **Budget integration**: Auto-link to budget line items
4. **SAM.gov integration**: Connect to contract award data
5. **Network analysis**: Generate org charts and influence maps
6. **Change tracking**: Monitor personnel movements over time
