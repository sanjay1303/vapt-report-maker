import { Project, Module, Report, Vulnerability, Activity } from "../types";

// Initial Projects
export const initialProjects: Project[] = [
  {
    id: 'prj-001',
    code: 'PRJ-001',
    name: 'Filumart',
    client: 'Madanic Impex Pvt Ltd.',
    applicationUrl: 'https://filumart.com',
    environment: 'Production',
    status: 'In Progress',
    description: 'Enterprise B2B and B2C multitenant commerce ecosystem including web frontends, buyer/seller portals, and administrative backends.',
    modulesCount: 10,
    vulnsCount: 248,
    createdDate: '01 Oct 2026',
  },
  {
    id: 'prj-002',
    code: 'PRJ-002',
    name: 'DSI',
    client: 'DSI Technologies',
    applicationUrl: 'https://dsi-portal.dsitech.com',
    environment: 'QA',
    status: 'Completed',
    description: 'Supply chain tracking system and customer service dispatch platform.',
    modulesCount: 6,
    vulnsCount: 32,
    createdDate: '15 Sep 2026',
  },
  {
    id: 'prj-003',
    code: 'PRJ-003',
    name: 'School ERP',
    client: 'Madanic Education',
    applicationUrl: 'https://portal.madanicedu.org',
    environment: 'Dev',
    status: 'In Progress',
    description: 'Comprehensive K-12 student information and fee payment gateway solution.',
    modulesCount: 5,
    vulnsCount: 18,
    createdDate: '10 Sep 2026',
  },
  {
    id: 'prj-004',
    code: 'PRJ-004',
    name: 'Madanic ERP',
    client: 'Madanic Impex Pvt Ltd.',
    applicationUrl: 'https://erp.madanic.com',
    environment: 'Production',
    status: 'Completed',
    description: 'Internal operations, inventory logistics, and payroll processing software.',
    modulesCount: 8,
    vulnsCount: 67,
    createdDate: '28 Aug 2026',
  },
  {
    id: 'prj-005',
    code: 'PRJ-005',
    name: 'Mobile App',
    client: 'Filumart Mobile',
    applicationUrl: 'https://mobile-api.filumart.com',
    environment: 'QA',
    status: 'In Progress',
    description: 'iOS and Android client-facing backend services and GraphQL gateways.',
    modulesCount: 4,
    vulnsCount: 21,
    createdDate: '20 Aug 2026',
  },
];

// Initial Modules for Filumart
export const initialModules: Module[] = [
  {
    id: 'mod-01',
    projectId: 'prj-001',
    name: 'Authentication',
    description: 'Login, Registration, Session, MFA, and Password Recovery workflows.',
    vulnsCount: 32,
    criticalCount: 3,
    highCount: 6,
    mediumCount: 8,
    lowCount: 15,
    infoCount: 0,
  },
  {
    id: 'mod-02',
    projectId: 'prj-001',
    name: 'Buyer',
    description: 'Buyer portal, product search, cart, checkout, and wishlists.',
    vulnsCount: 28,
    criticalCount: 2,
    highCount: 5,
    mediumCount: 7,
    lowCount: 14,
    infoCount: 0,
  },
  {
    id: 'mod-03',
    projectId: 'prj-001',
    name: 'Seller',
    description: 'Seller management, catalogue uploads, stock declarations, and payouts.',
    vulnsCount: 26,
    criticalCount: 2,
    highCount: 4,
    mediumCount: 6,
    lowCount: 14,
    infoCount: 0,
  },
  {
    id: 'mod-04',
    projectId: 'prj-001',
    name: 'Admin',
    description: 'Admin console, global settings, audit logs, and configurations.',
    vulnsCount: 34,
    criticalCount: 3,
    highCount: 8,
    mediumCount: 9,
    lowCount: 14,
    infoCount: 0,
  },
  {
    id: 'mod-05',
    projectId: 'prj-001',
    name: 'Product',
    description: 'Product listing, pricing rules, inventory mapping, details, variants.',
    vulnsCount: 22,
    criticalCount: 1,
    highCount: 4,
    mediumCount: 5,
    lowCount: 12,
    infoCount: 0,
  },
  {
    id: 'mod-06',
    projectId: 'prj-001',
    name: 'Inventory',
    description: 'Warehouse tracking, stock batching, and supply pipeline buffers.',
    vulnsCount: 18,
    criticalCount: 1,
    highCount: 3,
    mediumCount: 5,
    lowCount: 9,
    infoCount: 0,
  },
  {
    id: 'mod-07',
    projectId: 'prj-001',
    name: 'Order',
    description: 'Order fulfillment, invoicing, dispatch status, tracking, and cancellations.',
    vulnsCount: 24,
    criticalCount: 2,
    highCount: 4,
    mediumCount: 6,
    lowCount: 12,
    infoCount: 0,
  },
  {
    id: 'mod-08',
    projectId: 'prj-001',
    name: 'Payment',
    description: 'Payment gateway integrations, card handling tokens, refunds, settlement ledger.',
    vulnsCount: 25,
    criticalCount: 2,
    highCount: 5,
    mediumCount: 7,
    lowCount: 11,
    infoCount: 0,
  },
  {
    id: 'mod-09',
    projectId: 'prj-001',
    name: 'Notification',
    description: 'Email, SMS, push notifications, webhook dispatchers.',
    vulnsCount: 19,
    criticalCount: 1,
    highCount: 3,
    mediumCount: 5,
    lowCount: 10,
    infoCount: 0,
  },
  {
    id: 'mod-10',
    projectId: 'prj-001',
    name: 'Employee Management',
    description: 'Internal employee RBAC, role permission grids, and audit sessions.',
    vulnsCount: 20,
    criticalCount: 1,
    highCount: 4,
    mediumCount: 4,
    lowCount: 11,
    infoCount: 0,
  },
];

// Sample Report Findings matching the exact document and UI screenshot
export const sampleReportVulnerabilities: Vulnerability[] = [
  {
    id: 'FIL-001',
    reportId: 'FILUMART-VAPT-001',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'mod-01',
    moduleName: 'Authentication',
    name: 'CSRF Leads to Account Takeover',
    severity: 'Critical',
    cvssScore: 9.1,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:N',
    endpoint: 'POST /auth/api/v1/profile/change-email',
    endpointStatus: 'Open',
    description: 'The endpoint handling email modification requests fails to validate anti-CSRF tokens or verify current user credentials. An attacker can construct a malicious webpage that sends an unauthorized state-changing request on behalf of an authenticated victim, updating the victim account email to an attacker-controlled address and enabling full account takeover.',
    impact: [
      'Total compromise of victim account confidentiality and integrity.',
      'Attacker can reset victim password using the unauthorized email.',
      'Reputational and financial damage due to unauthorized purchases or administrative abuse.'
    ],
    recommendations: [
      'Implement robust anti-CSRF protection tokens (SameSite=Strict cookie policy and per-request synchronized tokens).',
      'Require mandatory current password re-authentication before executing sensitive changes like email or phone updates.',
      'Send immediate confirmation notifications to both previous and newly registered email addresses upon modification.'
    ],
    stepsToReproduce: '1. Establish a baseline request using an authorized test account.\n2. Modify only the recipient email address parameter to an attacker address.\n3. Replay the cross-origin request in the approved test environment.\n4. Record the HTTP 200 response and demonstrate email change without confirmation.',
    preconditions: 'Target user must have an active session in the web application (authenticated seller/buyer account).',
    evidenceReferences: 'CSRF_PoC_01.html, Burp Suite request/response logs #1402, account ID: usr_77192',
    developerNotes: 'Backend team is integrating CSRF token validation filter across /auth/api routes in Sprint 42.',
    retestNotes: 'Retest scheduled following deployment of v1.1 patch candidate.',
    evidence: [
      {
        id: 'ev-1-req',
        type: 'http_request',
        title: 'HTTP Request - CSRF Attack Payload',
        description: 'Demonstrating submission of email modification request without CSRF token verification.',
        content: `POST /auth/api/v1/profile/change-email HTTP/1.1
Host: filumart.com
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)
Cookie: session_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Content-Length: 48

{
  "new_email": "attacker@cyber-exploit.org"
}`,
      },
      {
        id: 'ev-1-res',
        type: 'http_response',
        title: 'HTTP Response - 200 OK Execution',
        description: 'Server accepts request without requiring current password or CSRF verification.',
        content: `HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Date: Fri, 06 Oct 2026 14:12:00 GMT

{
  "status": "success",
  "message": "Email updated successfully to attacker@cyber-exploit.org"
}`,
      }
    ],
    status: 'Open',
    createdDate: '06 Oct 2026',
  },
  {
    id: 'FIL-002',
    reportId: 'FILUMART-VAPT-001',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'mod-01',
    moduleName: 'Authentication',
    name: 'Weak Password Policy (Password in Plaintext / No Complexity)',
    severity: 'High',
    cvssScore: 7.5,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N',
    endpoint: 'POST /api/v1/user/reset-password',
    endpointStatus: 'Fixed',
    description: 'The password reset and update procedures permit trivial, dictionary-based passwords (e.g., "123456", "password") with no minimum length, character diversity requirement, or breach-check verification. Furthermore, initial reset tokens were transmitted via unencrypted communication channels.',
    impact: [
      'High vulnerability to credential stuffing, brute force, and rainbow table attacks.',
      'Compromise of user accounts leading to unauthorized data exposure.'
    ],
    recommendations: [
      'Enforce minimum password length of at least 12 characters combining uppercase, lowercase, numbers, and symbols.',
      'Check submitted passwords against known compromised password databases (HaveIBeenPwned API / NIST SP 800-63B).',
      'Hash all passwords using Argon2id or bcrypt with an appropriate work factor.'
    ],
    stepsToReproduce: '1. Navigate to /reset-password.\n2. Enter weak password "123456".\n3. System accepts password with HTTP 200 OK.',
    evidence: [
      {
        id: 'ev-2-txt',
        type: 'text',
        title: 'Password Policy Audit Output',
        description: 'Server allowed single-character and trivial word passwords without enforcement rejection.',
        content: `[+] Testing Password Complexity Rules:
  Test: '1' -> Status: ACCEPTED (HTTP 200)
  Test: 'admin' -> Status: ACCEPTED (HTTP 200)
  Test: 'qwerty' -> Status: ACCEPTED (HTTP 200)
[-] Password entropy: FAILED. No length or complexity requirements enforced.`,
      }
    ],
    status: 'Fixed',
    createdDate: '07 Oct 2026',
  },
  {
    id: 'FIL-003',
    reportId: 'FILUMART-VAPT-001',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'mod-01',
    moduleName: 'Authentication',
    name: 'Improper Server-Side Input Validation',
    severity: 'Medium',
    cvssScore: 6.5,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:L',
    endpoint: 'GET /auth_api/auth/company/country-banking-settings/requirements',
    endpointStatus: 'Fixed',
    description: 'The application relies on client-side validation rules to verify banking information instead of enforcing validation on the server. During testing, the response from the endpoint was intercepted and modified by removing the validation patterns. After forwarding the modified response, the application accepted invalid values such as alphabetic characters for the account number and an invalid IFSC code.',
    impact: [
      'Unauthorized manipulation of financial payout account details.',
      'Potential corrupt transaction records and banking gateway settlement failure.',
      'Risk of injection or formatting payload injection into back-office clearing systems.'
    ],
    recommendations: [
      'Enforce comprehensive server-side input validation and strict sanitization rules on all API endpoints.',
      'Never rely exclusively on client-side JavaScript or HTML regex validations.',
      'Validate international bank account numbers (IBAN), routing codes, and IFSC codes against strict format patterns on the backend before database persistence.'
    ],
    stepsToReproduce: '1. Access banking settings configuration via intercepted proxy (Burp Suite).\n2. Alter payload parameters with invalid non-numeric strings.\n3. Request succeeds and corrupt account metadata is saved.',
    preconditions: 'Authenticated seller user with access to Country Banking Settings view.',
    evidenceReferences: 'Banking_Bypass_Burp.log, Request #2294, Timestamp: 2026-10-08T11:42:00Z',
    developerNotes: 'Added server-side validator regex `^[0-9]{9,18}$` in BankingValidationService.java.',
    retestNotes: 'Retested and verified on 10 Oct 2026. Invalid values now return 400 Bad Request.',
    evidence: [
      {
        id: 'ev-3-req',
        type: 'http_request',
        title: 'Intercepted HTTP Request with Altered Validation',
        description: 'Burp Suite proxy request demonstrating bypassed client-side validation.',
        content: `GET /auth_api/auth/company/country-banking-settings/requirements?country=IN HTTP/1.1
Host: filumart.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsIn...
Accept: application/json`,
      },
      {
        id: 'ev-3-res',
        type: 'http_response',
        title: 'Server Response Permitting Bypass',
        description: 'Server return status confirming receipt of modified validation parameters.',
        content: `HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-cache

{
  "status": "VALIDATED",
  "account_number": "ABCD-INVALID-123",
  "ifsc": "XXXX0000000"
}`,
      }
    ],
    status: 'Fixed',
    createdDate: '08 Oct 2026',
  },
  {
    id: 'FIL-004',
    reportId: 'FILUMART-VAPT-001',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'mod-01',
    moduleName: 'Authentication',
    name: 'No Rate Limit on Authentication Endpoints',
    severity: 'Medium',
    cvssScore: 5.3,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N',
    endpoint: 'POST /auth_api/login/otp/request',
    endpointStatus: 'Open',
    description: 'The endpoint responsible for issuing One-Time Passwords (OTP) and password reset tokens lacks rate limiting controls. An automated adversary can issue thousands of SMS/OTP requests within seconds, exhausting SMS credit budgets (SMS pumping / toll fraud) and subjecting legitimate users to denial of service.',
    impact: [
      'Toll fraud and financial losses from high volumes of SMS notifications.',
      'User frustration and SMS gateway blacklisting.',
      'Feasibility of automated brute-force attacks against short numeric OTP codes.'
    ],
    recommendations: [
      'Implement IP-based and user identifier rate limiting (e.g. maximum 3 OTP requests per 10 minutes per IP/phone).',
      'Deploy CAPTCHA challenges (Cloudflare Turnstile or reCAPTCHA v3) upon consecutive repeated requests.',
      'Enforce exponential backoff cooldown periods after repeated calls.'
    ],
    stepsToReproduce: '1. Send 100 consecutive POST requests to /auth_api/login/otp/request in 10 seconds.\n2. Observe 100 HTTP 200 responses with active SMS dispatch.',
    evidence: [
      {
        id: 'ev-4-txt',
        type: 'text',
        title: 'Automated Rate-Limit Stress Test Log',
        description: '100 requests generated with 0 throttle interventions.',
        content: `[+] Running benchmark: 100 requests in 8.4 seconds
[200 OK] Request #1 - OTP sent
[200 OK] Request #2 - OTP sent
...
[200 OK] Request #100 - OTP sent
[-] Rate-limit triggered: 0/100 (FAIL: Rate limit absent)`,
      }
    ],
    status: 'Open',
    createdDate: '09 Oct 2026',
  },
  {
    id: 'FIL-005',
    reportId: 'FILUMART-VAPT-001',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'mod-01',
    moduleName: 'Authentication',
    name: 'Token Does Not Implement Proper Expiration and Invalidation',
    severity: 'Low',
    cvssScore: 3.1,
    cvssVector: 'CVSS:3.1/AV:N/AC:H/PR:L/UI:N/S:U/C:L/I:N/A:N',
    endpoint: 'GET /api/v1/token/validate',
    endpointStatus: 'Fixed',
    description: 'JWT bearer tokens retain a excessively long expiration lifetime (30 days) and lack a server-side revocation list or token blacklisting mechanism. When a user logs out, the client merely drops the token from local storage, but the token remains technically valid on the server.',
    impact: [
      'If a token is intercepted or leaked from logs, it can be replayed by an adversary for up to 30 days without revocation.',
      'User logout fails to guarantee session termination.'
    ],
    recommendations: [
      'Reduce access token lifetime to 15-30 minutes with rotating refresh tokens.',
      'Maintain a fast Redis blacklist for invalidated tokens upon explicit user logout.',
      'Implement token binding with client TLS or IP session fingerprints.'
    ],
    stepsToReproduce: '1. Obtain bearer token upon login.\n2. Click logout in application UI.\n3. Replay token in Postman against /api/v1/user/profile. Request succeeds.',
    evidence: [
      {
        id: 'ev-5-txt',
        type: 'text',
        title: 'Post-Logout Replay Inspection',
        description: 'Token payload showing exp timestamp 30 days in future.',
        content: `JWT Payload Decoded:
{
  "sub": "usr_99812",
  "iat": 1728100000,
  "exp": 1730692000 (Validity: 30 days)
}
Logout executed at 1728100500. Replayed request returned HTTP 200 OK.`,
      }
    ],
    status: 'Fixed',
    createdDate: '10 Oct 2026',
  },
  {
    id: 'FIL-006',
    reportId: 'FILUMART-VAPT-001',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'mod-01',
    moduleName: 'Authentication',
    name: 'Missing Security Headers (HSTS, CSP, X-Content-Type-Options)',
    severity: 'Low',
    cvssScore: 3.7,
    cvssVector: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:L/A:N',
    endpoint: 'GET /',
    endpointStatus: 'Fixed',
    description: 'The server response lacks essential HTTP security headers such as Strict-Transport-Security (HSTS), Content-Security-Policy (CSP), and X-Content-Type-Options. This leaves users susceptible to SSL stripping, clickjacking, and MIME-sniffing attacks in hostile network environments.',
    impact: [
      'Man-in-the-middle attackers can downgrade HTTPS to HTTP on initial connections.',
      'Weak defense-in-depth against Cross-Site Scripting (XSS) due to lack of CSP.',
      'MIME-confusion attacks in static file handling.'
    ],
    recommendations: [
      'Add "Strict-Transport-Security: max-age=31536000; includeSubDomains; preload".',
      'Deploy a strict Content-Security-Policy header restricting script-src and frame-ancestors.',
      'Include "X-Content-Type-Options: nosniff" and "X-Frame-Options: DENY".'
    ],
    stepsToReproduce: '1. Query server root with curl -I https://filumart.com.\n2. Inspect headers; HSTS and CSP are absent.',
    evidence: [
      {
        id: 'ev-6-txt',
        type: 'text',
        title: 'HTTP Response Headers Scan',
        description: 'Header audit reveals missing defense-in-depth security headers.',
        content: `HTTP/2 200 OK
date: Thu, 08 Oct 2026 12:00:00 GMT
content-type: text/html; charset=UTF-8
server: nginx
[MISSING] Strict-Transport-Security
[MISSING] Content-Security-Policy
[MISSING] X-Content-Type-Options
[MISSING] X-Frame-Options`,
      }
    ],
    status: 'Fixed',
    createdDate: '11 Oct 2026',
  },
  {
    id: 'FIL-007',
    reportId: 'FILUMART-VAPT-001',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'mod-02',
    moduleName: 'Buyer',
    name: 'Information Disclosure via Verbose Error Stack Traces',
    severity: 'Low',
    cvssScore: 3.4,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N',
    endpoint: 'POST /api/v1/checkout/apply-coupon',
    endpointStatus: 'Fixed',
    description: 'When invalid parameter types or malformed JSON payloads are submitted to the coupon application endpoint, the backend returns unhandled exception stack traces revealing internal database connection strings, library versions, and filesystem directory paths.',
    impact: [
      'Reconnaissance assistance for attackers mapping internal architecture.',
      'Exposure of source code file paths, framework versions, and dependencies.'
    ],
    recommendations: [
      'Implement global exception handlers returning generic error messages in production.',
      'Disable DEBUG and verbose stack trace logging in production web server configurations.'
    ],
    stepsToReproduce: '1. Send invalid coupon payload {"coupon": {"$ne": null}}.\n2. Receive Node.js / Express error stack trace in response.',
    evidence: [
      {
        id: 'ev-7-txt',
        type: 'text',
        title: 'Verbose Exception Trace Returned to Client',
        description: 'Internal source stack trace exposed to client.',
        content: `TypeError: Cannot read properties of undefined (reading 'code')
    at CouponService.validate (/app/src/services/coupon.ts:142:18)
    at /app/node_modules/express/lib/router/layer.js:95:5
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`,
      }
    ],
    status: 'Fixed',
    createdDate: '12 Oct 2026',
  },
  {
    id: 'FIL-008',
    reportId: 'FILUMART-VAPT-001',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'mod-01',
    moduleName: 'Authentication',
    name: 'Cookie Without HttpOnly and Secure Flags',
    severity: 'Low',
    cvssScore: 3.5,
    cvssVector: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N',
    endpoint: 'Set-Cookie: session_id=...',
    endpointStatus: 'Fixed',
    description: 'Session identifier cookies issued during user login lack the HttpOnly and Secure attributes. In the event of a Cross-Site Scripting (XSS) vulnerability, malicious client-side JavaScript can directly access the document.cookie object and exfiltrate user session keys.',
    impact: [
      'Facilitates session hijacking if any XSS flaw is present on the domain.',
      'Transmission of cookie over unencrypted HTTP channels if accessed via plaintext proxy.'
    ],
    recommendations: [
      'Set "HttpOnly" flag on all session cookies to prevent access via document.cookie.',
      'Set "Secure" flag to guarantee cookies are only transmitted over HTTPS connections.',
      'Set "SameSite=Lax" or "SameSite=Strict" to provide baseline CSRF defense.'
    ],
    stepsToReproduce: '1. Inspect browser storage after login.\n2. Notice session_id cookie lacks checkmarks for HttpOnly and Secure.',
    evidence: [
      {
        id: 'ev-8-txt',
        type: 'text',
        title: 'Cookie Header Inspection',
        description: 'Raw Set-Cookie header missing security directives.',
        content: `Set-Cookie: session_id=9f82a17cb6e14e2; Path=/; Domain=filumart.com
[Notice: Missing HttpOnly, Missing Secure, Missing SameSite]`,
      }
    ],
    status: 'Fixed',
    createdDate: '13 Oct 2026',
  },
  {
    id: 'FIL-009',
    reportId: 'FILUMART-VAPT-001',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'mod-07',
    moduleName: 'Order',
    name: 'Broken Object Level Authorization (BOLA / IDOR) in Order Receipts',
    severity: 'Critical',
    cvssScore: 9.1,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N',
    endpoint: 'GET /api/v1/orders/ORD-98421',
    endpointStatus: 'Open',
    description: 'The order retrieval endpoint relies solely on the order identifier provided in the URL path parameter without validating whether the currently authenticated user owns or has legitimate business permission to view that order. By incrementing or modifying the order ID, any low-privileged user can inspect invoices, shipping addresses, customer contact details, and payment histories of other clients.',
    impact: [
      'Mass exfiltration of Personal Identifiable Information (PII) including customer full names, delivery addresses, phone numbers, and purchased items.',
      'Severe violation of privacy regulations (GDPR, DPDP, PCI-DSS).',
      'Industrial espionage and competitive intelligence leaks.'
    ],
    recommendations: [
      'Enforce strict object-level access control checks within the data access layer: verify order.userId == currentUser.id or user has role ADMIN.',
      'Utilize unpredictable GUIDs/UUIDs instead of sequential numeric order identifiers.',
      'Implement central access control policies with automated unit and integration tests.'
    ],
    stepsToReproduce: '1. Log in as User A and view order ORD-98421.\n2. Log in as User B and request GET /api/v1/orders/ORD-98421.\n3. Server returns full order payload of User A without restriction.',
    evidence: [
      {
        id: 'ev-9-req',
        type: 'http_request',
        title: 'IDOR Order Access Request',
        description: 'User B accessing User A order via modified ID.',
        content: `GET /api/v1/orders/ORD-98421 HTTP/1.1
Host: filumart.com
Authorization: Bearer <User_B_Token>
Accept: application/json`,
      },
      {
        id: 'ev-9-res',
        type: 'http_response',
        title: 'Server Leaks User A Order Data',
        description: 'HTTP 200 response containing another customer confidential invoice.',
        content: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "order_id": "ORD-98421",
  "customer_name": "Rohan Gupta",
  "shipping_address": "Flat 402, Highgrove Heights, Mumbai, India",
  "phone": "+91 98201 12345",
  "total_amount": 14599.00,
  "payment_status": "PAID"
}`,
      }
    ],
    status: 'Open',
    createdDate: '14 Oct 2026',
  },
  {
    id: 'FIL-010',
    reportId: 'FILUMART-VAPT-001',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'mod-05',
    moduleName: 'Product',
    name: 'Directory Listing Enabled on Static Document Uploads',
    severity: 'Low',
    cvssScore: 2.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:N/A:N',
    endpoint: 'GET /uploads/documents/',
    endpointStatus: 'Fixed',
    description: 'The web server hosting static media assets has directory browsing enabled on the `/uploads/documents/` folder. Attackers can view the index listing and discover uploaded files, invoices, seller certificates, and customer attachment documents that were not explicitly linked on public pages.',
    impact: [
      'Uncontrolled discovery of uploaded files without authentication.',
      'Leaking of confidential uploaded PDF tax documents and business credentials.'
    ],
    recommendations: [
      'Disable directory indexing globally in web server configuration (e.g. `Options -Indexes` in Apache or `autoindex off;` in NGINX).',
      'Store sensitive user uploads in private cloud storage buckets (e.g. AWS S3) accessible only via pre-signed temporary URLs.'
    ],
    stepsToReproduce: '1. Browse to https://filumart.com/uploads/documents/ in a browser.\n2. Observe full HTML directory listing of all files and folders.',
    evidence: [
      {
        id: 'ev-10-txt',
        type: 'text',
        title: 'Index of /uploads/documents/ Response',
        description: 'Directory listing exposed via HTTP GET.',
        content: `<!DOCTYPE HTML>
<html><head><title>Index of /uploads/documents/</title></head>
<body><h1>Index of /uploads/documents/</h1>
<ul><li><a href="tax_id_seller_2091.pdf">tax_id_seller_2091.pdf</a></li>
<li><a href="kyc_audit_filumart_oct.pdf">kyc_audit_filumart_oct.pdf</a></li></ul>
</body></html>`,
      }
    ],
    status: 'Fixed',
    createdDate: '15 Oct 2026',
  }
];

// Initial Reports
export const initialReports: Report[] = [
  {
    id: 'FILUMART-VAPT-001',
    name: 'Filumart - Web VAPT',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'all',
    moduleName: 'All Modules',
    client: 'Madanic Impex Pvt Ltd.',
    applicationName: 'Filumart E-Commerce Platform',
    applicationUrl: 'https://filumart.com',
    environment: 'Production',
    assessmentDate: '01 Oct 2026 - 15 Oct 2026',
    reportVersion: 'v1.0',
    preparedBy: 'Sanjay - Cyber Security Engineer',
    classification: 'Confidential',
    assessmentType: 'Web Application Security Assessment',
    hosting: 'AWS Cloud (ap-south-1 Mumbai)',
    database: 'PostgreSQL 15 / MongoDB Cluster',
    executiveSummary: `A comprehensive Vulnerability Assessment and Penetration Testing (VAPT) exercise was conducted against the Filumart web platform during the assessment tenure. The primary objective was to assess the defense posture of the application, identify exploitable security vulnerabilities, and evaluate compliance with OWASP Top 10 guidelines.\n\nThe assessment revealed multiple security observations across critical business workflows including Authentication, Buyer checkout, and Order management. Notably, vulnerabilities such as CSRF leading to Account Takeover and Broken Object Level Authorization (IDOR) were detected, which present significant risks to data confidentiality and user account security.\n\nThe technical recommendations provided in this report should be prioritized according to their CVSS severity scores to remediate the identified risks effectively.`,
    status: 'Completed',
    lastUpdated: '27 Oct 2026',
    templateId: 'tmpl-filumart',
    vulnerabilities: sampleReportVulnerabilities,
  },
  {
    id: 'FILUMART-VAPT-002',
    name: 'Filumart - API VAPT',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'mod-01',
    moduleName: 'API / Authentication',
    client: 'Madanic Impex Pvt Ltd.',
    applicationName: 'Filumart Gateway & Microservices API',
    applicationUrl: 'https://api.filumart.com',
    environment: 'Production',
    assessmentDate: '10 Oct 2026 - 20 Oct 2026',
    reportVersion: 'v1.1',
    preparedBy: 'Sanjay - Cyber Security Engineer',
    classification: 'Confidential',
    assessmentType: 'API Security Assessment',
    hosting: 'AWS EKS Kubernetes',
    database: 'PostgreSQL 15 / Redis 7',
    executiveSummary: 'Security assessment targeting REST endpoints and GraphQL queries, focusing on authentication token lifecycles, JWT signing keys, and rate-limiting enforcement.',
    status: 'Completed',
    lastUpdated: '20 Oct 2026',
    templateId: 'tmpl-api',
    vulnerabilities: sampleReportVulnerabilities.slice(0, 4),
  },
  {
    id: 'FILUMART-VAPT-003',
    name: 'Filumart - Buyer Module',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'mod-02',
    moduleName: 'Buyer',
    client: 'Madanic Impex Pvt Ltd.',
    applicationName: 'Filumart Buyer Portal',
    applicationUrl: 'https://filumart.com/buyer',
    environment: 'QA',
    assessmentDate: '15 Oct 2026 - 18 Oct 2026',
    reportVersion: 'v0.9-draft',
    preparedBy: 'Sanjay - Cyber Security Engineer',
    classification: 'Internal',
    assessmentType: 'Web Application Security Assessment',
    hosting: 'AWS Cloud',
    database: 'PostgreSQL 15',
    executiveSummary: 'Draft security evaluation of shopping cart calculations, coupon discount business logic, and payment checkout flows.',
    status: 'Draft',
    lastUpdated: '18 Oct 2026',
    templateId: 'tmpl-webapp',
    vulnerabilities: sampleReportVulnerabilities.slice(1, 4),
  },
  {
    id: 'FILUMART-VAPT-004',
    name: 'Filumart - Seller Module',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'mod-03',
    moduleName: 'Seller',
    client: 'Madanic Impex Pvt Ltd.',
    applicationName: 'Filumart Seller Portal',
    applicationUrl: 'https://seller.filumart.com',
    environment: 'QA',
    assessmentDate: '12 Oct 2026 - 15 Oct 2026',
    reportVersion: 'v1.0-wip',
    preparedBy: 'Sanjay - Cyber Security Engineer',
    classification: 'Confidential',
    assessmentType: 'Web Application Security Assessment',
    hosting: 'AWS Cloud',
    database: 'PostgreSQL 15',
    executiveSummary: 'In-progress review of merchant catalogue uploads, document verification storage, and financial payout bank account updates.',
    status: 'In Progress',
    lastUpdated: '15 Oct 2026',
    templateId: 'tmpl-filumart',
    vulnerabilities: sampleReportVulnerabilities.slice(2, 6),
  },
  {
    id: 'FILUMART-VAPT-005',
    name: 'Filumart - Admin Module',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'mod-04',
    moduleName: 'Admin',
    client: 'Madanic Impex Pvt Ltd.',
    applicationName: 'Filumart Administrative Console',
    applicationUrl: 'https://admin.filumart.com',
    environment: 'Staging',
    assessmentDate: '08 Oct 2026 - 12 Oct 2026',
    reportVersion: 'v1.0-wip',
    preparedBy: 'Sanjay - Cyber Security Engineer',
    classification: 'Strictly Confidential',
    assessmentType: 'Internal Application Review',
    hosting: 'AWS Cloud (Private Subnet)',
    database: 'PostgreSQL 15',
    executiveSummary: 'Assessment of privileged super-admin consoles, role-based access delegation, and administrative audit trails.',
    status: 'In Progress',
    lastUpdated: '12 Oct 2026',
    templateId: 'tmpl-filumart',
    vulnerabilities: sampleReportVulnerabilities.slice(0, 5),
  },
];

// Initial Global Vulnerabilities
export const initialGlobalVulnerabilities: Vulnerability[] = [
  {
    id: 'FIL-001',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'mod-05',
    moduleName: 'Product',
    name: 'Broken Object Level Authorization',
    severity: 'Critical',
    cvssScore: 9.1,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N',
    endpoint: '/api/v1/products/delete/{id}',
    endpointStatus: 'Open',
    description: 'Attackers can delete or modify any vendor product listing by swapping product ID parameters.',
    impact: ['Complete data deletion of competitor catalogue items.'],
    recommendations: ['Enforce vendor ownership validation before deletion.'],
    evidence: [],
    status: 'Open',
    createdDate: '01 Oct 2026',
  },
  {
    id: 'FIL-002',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'mod-01',
    moduleName: 'Authentication',
    name: 'Rate Limiting Bypass',
    severity: 'High',
    cvssScore: 8.8,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N',
    endpoint: '/auth/login',
    endpointStatus: 'Open',
    description: 'Rate limiting can be bypassed by rotating the X-Forwarded-For header.',
    impact: ['Enables credential stuffing attacks on user accounts.'],
    recommendations: ['Rely on socket remote address rather than spoofable client headers.'],
    evidence: [],
    status: 'Open',
    createdDate: '02 Oct 2026',
  },
  {
    id: 'FIL-003',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'mod-02',
    moduleName: 'Buyer',
    name: 'Improper Input Validation',
    severity: 'Medium',
    cvssScore: 6.5,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:N',
    endpoint: '/api/cart/update-quantity',
    endpointStatus: 'Open',
    description: 'Negative quantity inputs allow credit balance inflation.',
    impact: ['Financial manipulation and fraudulent checkout.'],
    recommendations: ['Verify quantity > 0 on server side.'],
    evidence: [],
    status: 'Open',
    createdDate: '03 Oct 2026',
  },
  {
    id: 'FIL-004',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'mod-04',
    moduleName: 'Admin',
    name: 'Information Disclosure',
    severity: 'Medium',
    cvssScore: 5.0,
    cvssVector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:N/A:N',
    endpoint: '/admin/system/metrics',
    endpointStatus: 'Open',
    description: 'Exposes internal cluster hostnames and memory usage to regular authenticated users.',
    impact: ['Infrastructure footprint mapping.'],
    recommendations: ['Restrict metrics endpoints to superadmin RBAC role.'],
    evidence: [],
    status: 'Open',
    createdDate: '04 Oct 2026',
  },
  {
    id: 'FIL-005',
    projectId: 'prj-001',
    projectName: 'Filumart',
    moduleId: 'mod-01',
    moduleName: 'Authentication',
    name: 'Missing Security Headers (HSTS)',
    severity: 'Low',
    cvssScore: 3.1,
    cvssVector: 'CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N',
    endpoint: '/',
    endpointStatus: 'Open',
    description: 'Strict-Transport-Security header is not returned by reverse proxy.',
    impact: ['Potential SSL stripping attacks on insecure Wi-Fi.'],
    recommendations: ['Configure HSTS with max-age=31536000 and preload.'],
    evidence: [],
    status: 'Open',
    createdDate: '05 Oct 2026',
  },
];

// Initial Activities
export const initialActivities: Activity[] = [
  {
    id: 'act-1',
    title: 'Vulnerability updated',
    description: 'FIL-003 status changed to Fixed',
    timestamp: '10 min ago',
    type: 'status_changed',
    targetId: 'FIL-003',
  },
  {
    id: 'act-2',
    title: 'Report generated',
    description: 'Filumart - Web VAPT (v1.0) published',
    timestamp: '2 hours ago',
    type: 'report_created',
    targetId: 'FILUMART-VAPT-001',
  },
  {
    id: 'act-3',
    title: 'Vulnerability added',
    description: 'Broken Object Level Authorization (FIL-001) logged in Product module',
    timestamp: '1 day ago',
    type: 'vuln_updated',
    targetId: 'FIL-001',
  },
  {
    id: 'act-4',
    title: 'Project created',
    description: 'Filumart assessment initialized with 10 modules',
    timestamp: '3 days ago',
    type: 'project_added',
    targetId: 'prj-001',
  },
];
