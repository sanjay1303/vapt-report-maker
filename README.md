# VAPT Report Maker

A modern, professional Vulnerability Assessment and Penetration Testing (VAPT) Report Management Application built with React, TypeScript, Tailwind CSS, and Lucide Icons.

## 🚀 Key Features

### 1. Overview Dashboard
- **Summary Cards**: Total Projects (12), Total Reports (36), Total Vulnerabilities (248), Open (97), Fixed (151).
- **Vulnerabilities by Severity**: Dynamic SVG Donut Chart with center count and interactive hover.
- **Monthly Trajectory**: Smooth multi-series trend line chart comparing "Found" vs "Fixed" findings.
- **Recent Reports & Activities**: Direct links to view generated documents and audit history.

### 2. Projects & Modules Management
- **Excel-Style Projects Table**: Project ID, Name, Client, Environment, Modules, Vulns, Status, Created Date, Actions.
- **CRUD Operations**: Create, Edit, Delete (with modal confirmation), View.
- **Project Modules Screen**: Displays module breakdown (e.g. Authentication, Buyer, Seller, Admin, Product, Inventory, Order, Payment, Notification, Employee Management) with per-severity counts.

### 3. Vulnerability Repository
- Comprehensive findings table with CVSS 3.1 score, affected endpoint, and remediation status.
- Interactive **Detail Drawer** showing raw CVSS vectors, impact bullets, recommendations, and evidence.
- Quick status switcher: Open, Fixed, Partially Fixed, False Positive, Risk Accepted.

### 4. Create Report Wizard (4 Steps)
- **Step 1: Report Details**: Project selection, module selection, custom report name, client metadata, environment, assessment dates, version, and classification.
- **Step 2: Add New Vulnerabilities**:
  - Starts in a clean **Empty State** as requested ("No vulnerabilities added yet").
  - Form with full CVSS v3.1 vector calculation, endpoint status, formatted description, bulleted impacts & recommendations, reproduction steps, and POC evidence attachments (screenshots, HTTP request, HTTP response, console text).
  - Optional toggle to sync into global repository.
- **Step 3: Report Preview**: Live A4 document preview of the compiled report.
- **Step 4: Finalize & Complete**: Save as Draft or Complete Report with confirmation modal and automatic redirection to the Detailed Report page.

### 5. Detailed VAPT Report View (Filumart Standard)
- **3-Column Architecture**:
  - **Left**: Document section navigation & finding index anchor links.
  - **Center**: A4 document preview with cover page, document information table, executive summary, findings summary table with severity colors, dynamic severity bar chart, and detailed vulnerability findings with POC evidence.
  - **Right**: Real-time summary statistics and vertical distribution chart.
- **Multi-Format Export**:
  - **PDF Export**: High-resolution client-side PDF export via `jspdf` & `html2canvas`.
  - **Word Export**: Downloadable `.docx` file using the `docx` library.
  - **Print Layout**: Dedicated CSS print rules with page-break protection.

### 6. Templates & Settings
- Pre-configured templates: *Filumart VAPT Sample Report (Default)*, *Standard VAPT Report*, *Web Application Security Assessment*, *API Security Assessment*, and custom template builder.
- Settings for Organization Details, Company Logo, Auditor Profile, Report Branding Color, CVSS standard, Severity colors, and Legal Disclaimers.
- One-click *Reset Demo Data* for quick demonstrations.

## 🛠 Technology Stack
- **Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom purple SaaS palette
- **Icons**: Lucide React
- **Document Generation**: `docx`, `jspdf`, `html2canvas`, `file-saver`
- **Persistence**: LocalStorage with realistic sample data

