#!/usr/bin/env python3
"""
DoW Directory PDF Parser/Extractor

Extracts structured data from the 2025 Department of War Directory PDF
into CSV format for business development and market intelligence.

Handles the new 2025 PAE/CPE acquisition structure.
"""

import re
import csv
import os
from dataclasses import dataclass, field, asdict
from typing import List, Optional, Dict, Tuple
from pathlib import Path
from datetime import datetime

# Use PyPDF2 for PDF text extraction
from PyPDF2 import PdfReader
PDF_LIBRARY = "PyPDF2"

import pandas as pd


@dataclass
class PersonRecord:
    """Represents a single person/position record extracted from the directory."""
    # Organizational Hierarchy
    service_agency: str = ""
    organization_type: str = ""
    organization_name: str = ""
    organization_abbreviation: str = ""
    parent_organization: str = ""
    portfolio: str = ""

    # Personnel Information
    name: str = ""
    rank_title: str = ""
    position: str = ""
    position_type: str = ""
    status: str = ""

    # Contact & Location
    email: str = ""
    phone: str = ""
    location: str = ""
    building: str = ""

    # Program/Mission Details
    mission_area: str = ""
    key_programs: str = ""

    # Metadata
    page_number: int = 0
    section: str = ""
    last_updated: str = "2025 v35"
    notes: str = ""


class DoWDirectoryParser:
    """Parser for DoW Directory PDFs."""

    # Military ranks patterns
    MILITARY_RANKS = [
        # General/Flag Officers
        "GEN", "LTG", "MG", "BG",  # Army
        "ADM", "VADM", "RADM", "RDML",  # Navy
        "Gen", "Lt Gen", "Maj Gen", "Brig Gen",  # Air Force
        # Field Grade
        "COL", "LTC", "MAJ",
        "CAPT", "CDR", "LCDR",  # Navy
        "Col", "Lt Col", "Maj",  # Air Force
        # Company Grade
        "CPT", "1LT", "2LT",
        "LT", "LTJG", "ENS",  # Navy
        "Capt", "1st Lt", "2nd Lt",  # Air Force
        # Enlisted (senior)
        "CSM", "SGM", "1SG", "MSG",
        "MCPON", "MCPOC", "CMDCM",
        "CMSAF", "CMSgt",
    ]

    # Civilian title patterns
    CIVILIAN_TITLES = [
        "SES", "SL", "ST",  # Senior Executive Service
        "GS-15", "GS-14", "GS-13",
        "NH-IV", "NH-III", "NH-02", "NH-03", "NH-04",
        "Mr.", "Ms.", "Mrs.", "Dr.",
        "Hon.", "Honorable",
    ]

    # Status indicators
    STATUS_PATTERNS = [
        (r'\(Acting\)', "Acting"),
        (r'\(PTDO\)', "PTDO"),
        (r'\bActing\b', "Acting"),
        (r'\bPTDO\b', "PTDO"),
        (r'\bNominated\b', "Nominated"),
        (r'\bDesignated\b', "Designated"),
        (r'\bInterim\b', "Interim"),
        (r'\bVacant\b', "Vacant"),
    ]

    # Organization type patterns
    ORG_TYPE_PATTERNS = [
        (r'Portfolio Acquisition Executive', "PAE"),
        (r'\bPAE\b', "PAE"),
        (r'Capability Program Executive', "CPE"),
        (r'\bCPE\b', "CPE"),
        (r'Program Executive Offic', "PEO"),
        (r'\bPEO\b', "PEO"),
        (r'Program Manager', "PM"),
        (r'\bPM\b', "PM"),
        (r'Deputy Program Manager', "DPM"),
        (r'Product Manager', "PdM"),
        (r'Project Manager', "PjM"),
        (r'Assistant Secretary', "ASA"),
        (r'Under Secretary', "USD"),
        (r'Deputy Assistant Secretary', "DASA"),
        (r'Director', "Director"),
        (r'Chief', "Chief"),
        (r'Commander', "Commander"),
    ]

    # Service/Agency patterns
    SERVICE_PATTERNS = [
        (r'Office of the Secretary of Defense|^\s*OSD\s*$', "OSD"),
        (r'Department of the Army|^\s*Army\s*$|U\.S\. Army', "Army"),
        (r'Department of the Navy|^\s*Navy\s*$|U\.S\. Navy', "Navy"),
        (r'Department of the Air Force|^\s*Air Force\s*$|U\.S\. Air Force', "Air Force"),
        (r'Space Force|USSF', "Space Force"),
        (r'Marine Corps|USMC', "Marines"),
        (r'Special Operations Command|SOCOM|USSOCOM', "SOCOM"),
        (r'Missile Defense Agency|MDA', "MDA"),
        (r'Defense Logistics Agency|DLA', "DLA"),
        (r'Defense Information Systems Agency|DISA', "DISA"),
        (r'Defense Threat Reduction Agency|DTRA', "DTRA"),
        (r'Defense Advanced Research Projects Agency|DARPA', "DARPA"),
        (r'Defense Contract Management Agency|DCMA', "DCMA"),
        (r'Defense Health Agency|DHA', "DHA"),
        (r'National Geospatial-Intelligence Agency|NGA', "NGA"),
        (r'National Security Agency|NSA', "NSA"),
        (r'Defense Intelligence Agency|DIA', "DIA"),
    ]

    # Mission area keywords
    MISSION_AREAS = {
        "Aviation": ["aviation", "rotary", "helicopter", "aircraft", "FVL", "FARA", "FLRAA"],
        "Missiles": ["missile", "rocket", "ATACMS", "Patriot", "THAAD", "HIMARS", "PrSM"],
        "Ground Combat": ["vehicle", "tank", "armor", "Bradley", "Abrams", "Stryker", "AMPV"],
        "C5ISR": ["C5ISR", "C4ISR", "command", "control", "communications", "intelligence", "surveillance", "reconnaissance", "radar", "sensor"],
        "Cyber": ["cyber", "network", "electronic warfare", "EW", "information warfare"],
        "Space": ["space", "satellite", "GPS", "launch", "orbital"],
        "Maritime": ["ship", "submarine", "naval", "maritime", "carrier", "destroyer", "frigate"],
        "Long-Range Fires": ["long-range", "fires", "artillery", "howitzer", "ERCA", "LRPF"],
        "Air Defense": ["air defense", "SHORAD", "IFPC", "counter-UAS", "C-UAS"],
        "Logistics": ["logistics", "sustainment", "supply", "maintenance", "ammunition"],
        "SOF": ["special operations", "SOF", "special forces"],
        "Nuclear": ["nuclear", "strategic", "deterrent", "ICBM", "triad"],
        "Unmanned": ["unmanned", "UAS", "UAV", "drone", "autonomous", "robotics"],
    }

    def __init__(self, output_dir: str = "."):
        self.output_dir = Path(output_dir)
        self.records: List[PersonRecord] = []
        self.relationships: List[Dict] = []
        self.current_service = ""
        self.current_pae = ""
        self.current_cpe = ""
        self.current_org = ""
        self.hierarchy_stack: List[Tuple[str, str]] = []  # (org_name, org_type)

    def extract_text_from_pdf(self, pdf_path: str) -> List[Tuple[int, str]]:
        """Extract text from PDF, returning list of (page_num, text) tuples."""
        pages = []
        reader = PdfReader(pdf_path)
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            pages.append((i + 1, text))
        return pages

    def detect_service(self, text: str) -> Optional[str]:
        """Detect which service/agency a section belongs to."""
        for pattern, service in self.SERVICE_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return service
        return None

    def detect_org_type(self, text: str) -> Optional[str]:
        """Detect organization type from text."""
        for pattern, org_type in self.ORG_TYPE_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return org_type
        return None

    def detect_status(self, text: str) -> str:
        """Detect appointment status from text."""
        for pattern, status in self.STATUS_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return status
        return "Confirmed"

    def detect_mission_area(self, text: str) -> str:
        """Detect mission area from text content."""
        text_lower = text.lower()
        matches = []
        for area, keywords in self.MISSION_AREAS.items():
            for keyword in keywords:
                if keyword.lower() in text_lower:
                    matches.append(area)
                    break
        return ", ".join(set(matches)) if matches else ""

    def extract_email(self, text: str) -> str:
        """Extract email addresses from text."""
        email_pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        matches = re.findall(email_pattern, text)
        return matches[0] if matches else ""

    def extract_phone(self, text: str) -> str:
        """Extract phone numbers from text."""
        # Various phone formats
        patterns = [
            r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',
            r'DSN\s*:?\s*\d{3}[-.\s]?\d{4}',
            r'\d{3}[-.\s]\d{3}[-.\s]\d{4}',
        ]
        for pattern in patterns:
            match = re.search(pattern, text)
            if match:
                return match.group()
        return ""

    def extract_location(self, text: str) -> str:
        """Extract location/base information from text."""
        location_patterns = [
            r'(?:Fort|Ft\.?)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?',
            r'(?:Camp)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?',
            r'Pentagon',
            r'Crystal City',
            r'Redstone Arsenal',
            r'Aberdeen Proving Ground',
            r'Picatinny Arsenal',
            r'Rock Island Arsenal',
            r'Huntsville,?\s*AL',
            r'Warren,?\s*MI',
            r'Detroit Arsenal',
            r'San Diego,?\s*CA',
            r'Norfolk,?\s*VA',
            r'Point Mugu',
            r'China Lake',
            r'Patuxent River',
            r'Wright-Patterson',
            r'Hanscom',
            r'Eglin',
            r'Hill AFB',
            r'Tinker AFB',
            r'Robins AFB',
            r'Quantico',
            r'Joint Base\s+[A-Za-z-]+',
            r'Naval (?:Air Station|Base|Station)\s+[A-Za-z]+',
        ]

        for pattern in location_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group()
        return ""

    def extract_rank_and_name(self, text: str) -> Tuple[str, str]:
        """Extract military rank/civilian title and name from text."""
        # Build rank pattern
        rank_pattern = '|'.join(re.escape(r) for r in self.MILITARY_RANKS + self.CIVILIAN_TITLES)

        # Pattern: Rank/Title followed by name
        pattern = rf'({rank_pattern})\.?\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+(?:\s+(?:Jr\.|Sr\.|III|IV|II))?)'

        match = re.search(pattern, text)
        if match:
            return match.group(1), match.group(2).strip()

        # Try just name pattern (First Last or First M. Last)
        name_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+(?:\s+(?:Jr\.|Sr\.|III|IV|II))?)\b'
        match = re.search(name_pattern, text)
        if match:
            return "", match.group(1)

        return "", ""

    def extract_organization_info(self, text: str) -> Tuple[str, str]:
        """Extract organization name and abbreviation."""
        # Pattern for org name with abbreviation in parentheses
        pattern = r'([A-Z][A-Za-z\s,&-]+?)\s*\(([A-Z][A-Z0-9/-]+)\)'
        match = re.search(pattern, text)
        if match:
            return match.group(1).strip(), match.group(2)

        # Just abbreviation
        abbrev_pattern = r'\b([A-Z]{2,}(?:\s+[A-Z]{2,})?(?:-[A-Z]+)?)\b'
        match = re.search(abbrev_pattern, text)
        if match:
            return "", match.group(1)

        return "", ""

    def parse_section_header(self, line: str) -> Optional[Dict]:
        """Parse a section header line to extract organization info."""
        line = line.strip()
        if not line:
            return None

        result = {
            "org_name": "",
            "org_abbrev": "",
            "org_type": "",
            "is_header": False,
        }

        # Check for PAE header
        if "Portfolio Acquisition Executive" in line or re.match(r'^PAE\b', line):
            result["org_type"] = "PAE"
            result["is_header"] = True
            name, abbrev = self.extract_organization_info(line)
            result["org_name"] = name or line
            result["org_abbrev"] = abbrev
            return result

        # Check for CPE/PEO header
        if "Capability Program Executive" in line or "Program Executive Offic" in line or re.match(r'^(?:CPE|PEO)\b', line):
            result["org_type"] = "CPE" if "CPE" in line or "Capability" in line else "PEO"
            result["is_header"] = True
            name, abbrev = self.extract_organization_info(line)
            result["org_name"] = name or line
            result["org_abbrev"] = abbrev
            return result

        # Check for PM header
        if re.match(r'^(?:PM|Program Manager|Product Manager)\b', line, re.IGNORECASE):
            result["org_type"] = "PM"
            result["is_header"] = True
            name, abbrev = self.extract_organization_info(line)
            result["org_name"] = name or line
            result["org_abbrev"] = abbrev
            return result

        # Check for service section headers
        service = self.detect_service(line)
        if service and len(line) < 100:  # Likely a header, not body text
            result["org_type"] = "Service"
            result["org_name"] = service
            result["is_header"] = True
            return result

        return None

    def parse_person_entry(self, text: str, page_num: int) -> Optional[PersonRecord]:
        """Parse a text block that might contain a person entry."""
        rank, name = self.extract_rank_and_name(text)

        if not name:
            return None

        record = PersonRecord()
        record.name = name
        record.rank_title = rank
        record.page_number = page_num
        record.status = self.detect_status(text)
        record.email = self.extract_email(text)
        record.phone = self.extract_phone(text)
        record.location = self.extract_location(text)

        # Set organizational context
        record.service_agency = self.current_service
        record.portfolio = self.current_pae

        if self.current_cpe:
            record.parent_organization = self.current_cpe
            record.organization_type = "PM" if self.current_org else "CPE Staff"
        elif self.current_pae:
            record.parent_organization = self.current_pae
            record.organization_type = "PAE Staff"

        if self.current_org:
            record.organization_name = self.current_org

        # Try to extract position from context
        position_patterns = [
            r'(Portfolio Acquisition Executive)',
            r'(Capability Program Executive)',
            r'(Program Executive Officer)',
            r'(Program Manager)',
            r'(Deputy Program Manager)',
            r'(Product Manager)',
            r'(Project Manager)',
            r'(Director[,\s]+[A-Za-z\s]+)',
            r'(Chief[,\s]+[A-Za-z\s]+)',
            r'(Assistant Secretary[A-Za-z\s]*)',
            r'(Deputy Assistant Secretary[A-Za-z\s]*)',
            r'(Executive Director)',
            r'(Deputy Director)',
            r'(Commander)',
            r'(Deputy Commander)',
        ]

        for pattern in position_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                record.position = match.group(1)
                record.position_type = self.detect_org_type(match.group(1)) or ""
                break

        record.mission_area = self.detect_mission_area(text)

        return record

    def parse_page(self, page_num: int, text: str):
        """Parse a single page of text."""
        lines = text.split('\n')

        for i, line in enumerate(lines):
            line = line.strip()
            if not line:
                continue

            # Check for section headers
            header = self.parse_section_header(line)
            if header and header["is_header"]:
                if header["org_type"] == "Service":
                    self.current_service = header["org_name"]
                    self.current_pae = ""
                    self.current_cpe = ""
                    self.current_org = ""
                elif header["org_type"] == "PAE":
                    self.current_pae = header["org_abbrev"] or header["org_name"]
                    self.current_cpe = ""
                    self.current_org = ""
                elif header["org_type"] in ["CPE", "PEO"]:
                    self.current_cpe = header["org_abbrev"] or header["org_name"]
                    self.current_org = ""
                    # Add relationship
                    if self.current_pae:
                        self.relationships.append({
                            "child_entity": self.current_cpe,
                            "child_type": header["org_type"],
                            "parent_entity": self.current_pae,
                            "parent_type": "PAE",
                            "relationship_type": "Reports_To"
                        })
                elif header["org_type"] == "PM":
                    self.current_org = header["org_abbrev"] or header["org_name"]
                    # Add relationship
                    if self.current_cpe:
                        self.relationships.append({
                            "child_entity": self.current_org,
                            "child_type": "PM",
                            "parent_entity": self.current_cpe,
                            "parent_type": "CPE",
                            "relationship_type": "Part_Of"
                        })
                continue

            # Try to extract person entries
            # Look at current line plus next few lines for context
            context = '\n'.join(lines[i:min(i+3, len(lines))])
            record = self.parse_person_entry(context, page_num)

            if record and record.name:
                # Avoid duplicates from overlapping context windows
                if not self.records or self.records[-1].name != record.name:
                    self.records.append(record)

    def parse_pdf(self, pdf_path: str, page_offset: int = 0):
        """Parse a single PDF file."""
        print(f"Parsing: {pdf_path}")
        pages = self.extract_text_from_pdf(pdf_path)

        for page_num, text in pages:
            actual_page = page_num + page_offset
            self.parse_page(actual_page, text)

        print(f"  Extracted {len(self.records)} records so far")

    def parse_chunked_pdfs(self, pdf_pattern: str = "dow_directory_pages_*.pdf"):
        """Parse all chunked PDF files in order."""
        pdf_dir = self.output_dir

        # Find all matching PDFs
        pdf_files = sorted(pdf_dir.glob(pdf_pattern))

        if not pdf_files:
            print(f"No PDF files matching '{pdf_pattern}' found in {pdf_dir}")
            return

        print(f"Found {len(pdf_files)} PDF chunks to process")

        for pdf_path in pdf_files:
            # Extract page offset from filename
            match = re.search(r'pages_(\d+)_to_(\d+)', pdf_path.name)
            if match:
                page_offset = int(match.group(1)) - 1
            else:
                page_offset = 0

            self.parse_pdf(str(pdf_path), page_offset)

    def deduplicate_records(self):
        """Remove duplicate records."""
        seen = set()
        unique_records = []

        for record in self.records:
            key = (record.name, record.position, record.organization_name)
            if key not in seen:
                seen.add(key)
                unique_records.append(record)

        original_count = len(self.records)
        self.records = unique_records
        print(f"Deduplicated: {original_count} -> {len(self.records)} records")

    def export_to_csv(self, filename: str = "dow_directory_extracted.csv"):
        """Export records to CSV file."""
        if not self.records:
            print("No records to export")
            return

        output_path = self.output_dir / filename

        # Convert records to dictionaries
        data = [asdict(record) for record in self.records]

        # Create DataFrame and export
        df = pd.DataFrame(data)

        # Reorder columns to match README spec
        column_order = [
            'service_agency', 'organization_type', 'organization_name',
            'organization_abbreviation', 'parent_organization', 'portfolio',
            'name', 'rank_title', 'position', 'position_type', 'status',
            'email', 'phone', 'location', 'building',
            'mission_area', 'key_programs',
            'page_number', 'section', 'last_updated', 'notes'
        ]

        # Only include columns that exist
        columns = [c for c in column_order if c in df.columns]
        df = df[columns]

        df.to_csv(output_path, index=False)
        print(f"Exported {len(df)} records to {output_path}")

        return output_path

    def export_relationships_csv(self, filename: str = "dow_directory_relationships.csv"):
        """Export organizational relationships to CSV."""
        if not self.relationships:
            print("No relationships to export")
            return

        output_path = self.output_dir / filename

        # Deduplicate relationships
        unique_rels = []
        seen = set()
        for rel in self.relationships:
            key = (rel['child_entity'], rel['parent_entity'])
            if key not in seen:
                seen.add(key)
                unique_rels.append(rel)

        df = pd.DataFrame(unique_rels)
        df.to_csv(output_path, index=False)
        print(f"Exported {len(df)} relationships to {output_path}")

        return output_path

    def generate_quality_report(self) -> Dict:
        """Generate data quality statistics."""
        if not self.records:
            return {}

        total = len(self.records)

        # Calculate completeness for each field
        fields_populated = {}
        for field in ['name', 'rank_title', 'position', 'email', 'phone',
                      'location', 'service_agency', 'organization_name', 'mission_area']:
            count = sum(1 for r in self.records if getattr(r, field))
            fields_populated[field] = {
                'count': count,
                'percentage': round(count / total * 100, 1)
            }

        # Service breakdown
        service_counts = {}
        for record in self.records:
            service = record.service_agency or "Unknown"
            service_counts[service] = service_counts.get(service, 0) + 1

        # Position type breakdown
        position_counts = {}
        for record in self.records:
            pos_type = record.position_type or "Other"
            position_counts[pos_type] = position_counts.get(pos_type, 0) + 1

        report = {
            'total_records': total,
            'total_relationships': len(self.relationships),
            'field_completeness': fields_populated,
            'records_by_service': service_counts,
            'records_by_position_type': position_counts,
            'generated_at': datetime.now().isoformat(),
        }

        return report

    def print_quality_report(self):
        """Print quality report to console."""
        report = self.generate_quality_report()

        if not report:
            print("No data to report on")
            return

        print("\n" + "="*60)
        print("DATA QUALITY REPORT")
        print("="*60)

        print(f"\nTotal Records: {report['total_records']}")
        print(f"Total Relationships: {report['total_relationships']}")

        print("\nField Completeness:")
        print("-"*40)
        for field, stats in report['field_completeness'].items():
            bar = "█" * int(stats['percentage'] / 5) + "░" * (20 - int(stats['percentage'] / 5))
            print(f"  {field:20} {bar} {stats['percentage']:5.1f}% ({stats['count']})")

        print("\nRecords by Service/Agency:")
        print("-"*40)
        for service, count in sorted(report['records_by_service'].items(), key=lambda x: -x[1]):
            print(f"  {service:25} {count:5}")

        print("\nRecords by Position Type:")
        print("-"*40)
        for pos_type, count in sorted(report['records_by_position_type'].items(), key=lambda x: -x[1]):
            print(f"  {pos_type:25} {count:5}")

        print("\n" + "="*60)


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Parse DoW Directory PDF into structured CSV data'
    )
    parser.add_argument(
        '--input', '-i',
        default='.',
        help='Directory containing PDF chunks (default: current directory)'
    )
    parser.add_argument(
        '--output', '-o',
        default='dow_directory_extracted.csv',
        help='Output CSV filename (default: dow_directory_extracted.csv)'
    )
    parser.add_argument(
        '--pattern', '-p',
        default='dow_directory_pages_*.pdf',
        help='Glob pattern for PDF files (default: dow_directory_pages_*.pdf)'
    )
    parser.add_argument(
        '--single', '-s',
        help='Parse a single PDF file instead of chunks'
    )
    parser.add_argument(
        '--no-relationships',
        action='store_true',
        help='Skip relationship CSV export'
    )
    parser.add_argument(
        '--quiet', '-q',
        action='store_true',
        help='Suppress quality report output'
    )

    args = parser.parse_args()

    # Initialize parser
    dir_parser = DoWDirectoryParser(output_dir=args.input)

    # Parse PDFs
    if args.single:
        dir_parser.parse_pdf(args.single)
    else:
        dir_parser.parse_chunked_pdfs(args.pattern)

    # Deduplicate
    dir_parser.deduplicate_records()

    # Export
    dir_parser.export_to_csv(args.output)

    if not args.no_relationships:
        dir_parser.export_relationships_csv()

    # Quality report
    if not args.quiet:
        dir_parser.print_quality_report()

    print("\nDone!")


if __name__ == "__main__":
    main()
