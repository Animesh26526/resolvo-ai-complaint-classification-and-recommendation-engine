# Product Requirements Document (PRD)

## AI-Powered Complaint Classification & Resolution Recommendation Engine

**Status:** New implementation from scratch  
**Authoritative design:** Lab Manual – Sessions 01–05  
**Stack:** MERN + FastAPI AI/ML service

---

## 1. Product Overview

A web-based AI-powered complaint management system for a wellness business.

Complaints may arrive through text, email, customer helpline calls, chatbot/audio interactions, or direct communication with a Customer Support Executive (CSE).

The system analyzes complaints, classifies them into **Product, Packaging, or Trade**, determines **High, Medium, or Low** priority using complaint content, urgency and sentiment, and generates an actionable resolution recommendation.

The system also supports complaint registration, lifecycle tracking, SLA monitoring, QA review, dashboards and reporting.

The previous GitHub project is **reference material only**. This project is rebuilt from scratch according to this PRD and the finalized UML/architecture design.

---

## 2. Goals

1. Enable easy complaint submission and registration.
2. Support multiple complaint channels.
3. Automatically classify complaints.
4. Analyze sentiment and assign priority.
5. Generate actionable resolution recommendations.
6. Allow CSEs to take action and update status.
7. Track complaint lifecycle and SLA compliance.
8. Support QAT classification and resolution review.
9. Provide OM dashboards and operational insights.
10. Generate PDF and CSV reports.
11. Enforce role-based access.
12. Keep the implementation simple, modular and maintainable.

---

## 3. Users and Roles

### Customer / User

- Submit complaints.
- Receive AI-generated suggestions before formal registration when applicable.
- View complaint status and updates.
- Track complaint progress.

### Customer Support Executive (CSE)

- Receive and directly register complaints.
- Register complaints received through text, calls, chatbot/audio, email and direct communication.
- View category, priority and recommendation.
- Take recommended action.
- Update complaint status and resolution details.
- Escalate unresolved or critical complaints.

### Quality Assurance Team (QAT)

- Review classification.
- Review resolution quality.
- Monitor trends.
- Identify recurring issues.
- Check consistency.
- Generate and analyze reports.

### Operations Manager (OM)

- Monitor dashboard.
- Monitor category, priority and workload distribution.
- Track SLA compliance and resolution progress.
- Identify pending/overdue complaints.
- View analytics.
- Generate reports.

---

## 4. Complaint Channels

- Text complaint.
- Customer support email.
- Customer helpline call.
- Call summary.
- Audio complaint through online chatbot.
- Direct communication with CSE.
- CSE-entered complaint details.

### Call workflow

`Customer → Complaint System → Call Log → Convert Call to Text → AI Analysis`

---

## 5. Complaint Categories

- Product
- Packaging
- Trade

The implementation should keep category handling modular so future categories can be added without major changes.

---

## 6. Priority

Each analyzed complaint receives:

- High
- Medium
- Low

Priority is determined using complaint content, urgency and sentiment.

Urgent/high-priority complaints should be clearly highlighted for timely action.

---

## 7. AI Workflow

`Complaint → Classification → Sentiment Analysis → Priority Assignment → Resolution Recommendation`

### Classification

Classify the complaint as Product, Packaging or Trade.

### Sentiment Analysis

Analyze sentiment and urgency-related signals.

### Priority Assignment

Assign High, Medium or Low based on relevant complaint information.

### Resolution Recommendation

Generate an actionable recommendation based on complaint details, category and priority.

The AI recommends/assists; the CSE performs the operational action for formal complaints.

---

## 8. Complaint Lifecycle

Recommended statuses:

`Received → Analyzed → Registered → Assigned → In Progress → Resolved`

Alternative path:

`In Progress → Escalated`

The backend should control valid status transitions.

---

## 9. Resolution Workflow

After AI recommendation:

`Generate Recommendation → Issue Resolved by AI?`

### Yes

`Provide Recommended Resolution → Update Complaint Status`

### No

`Register Formal Complaint → Assign Complaint to CSE → CSE Reviews Complaint → Follow Recommended Action`

Then:

`Complaint Resolved?`

- Yes → Update Status to Resolved.
- No → Escalate Complaint → Update Complaint Status.

---

## 10. SLA Monitoring

The system should:

- Record complaint receipt time.
- Track elapsed time.
- Track SLA deadlines.
- Identify overdue complaints.
- Highlight high-priority or overdue complaints.
- Allow OM to monitor SLA compliance.

---

## 11. Dashboard

The OM dashboard should display:

- Total complaints.
- Pending complaints.
- Resolved complaints.
- Complaint distribution.
- Category-wise statistics.
- Priority distribution.
- Workload distribution.
- SLA status.
- Resolution progress.
- Pending and overdue complaints.

---

## 12. QAT Workflow

`Login → QA Dashboard → Select Complaint → Fetch Complaint → Verify Classification → AI Analysis → Check Classification → Review Classification → Submit Review`

QAT reviews must be stored for future analysis.

---

## 13. Reporting

Authorized users can generate complaint reports containing relevant:

- Complaint information.
- Category.
- Priority.
- Status.
- SLA information.
- Resolution information.
- Analytics.

Export formats:

- PDF
- CSV

---

## 14. Authentication and Authorization

Roles:

`Customer | CSE | QAT | OM`

The backend must:

- Authenticate users.
- Issue JWT tokens.
- Validate JWT tokens.
- Attach authenticated user information to `req`.
- Restrict endpoints by role.
- Prevent unauthorized complaint access/actions.
- Hash passwords securely using bcrypt.

---

## 15. Functional Requirements

### FR-1: Complaint Submission

Allow complaints through text, email, call summaries, chatbot interactions and direct communication.

### FR-2: Complaint Classification

Automatically classify complaints into Product, Packaging or Trade.

### FR-3: Priority Assignment

Assign High, Medium or Low based on content, urgency and sentiment.

### FR-4: AI-Based Resolution Recommendation

Generate resolution recommendations based on category and priority.

### FR-5: Complaint Lifecycle Management

Maintain and update complaint status from submission to resolution.

### FR-6: SLA Monitoring

Monitor resolution time and SLA compliance and highlight overdue/high-priority complaints.

### FR-7: Dashboard and Analytics

Provide category, priority, workload, distribution and SLA analytics.

### FR-8: Complaint Search and History

Allow authorized users to search, filter and view history by category, priority, status and date.

### FR-9: Report Generation

Generate and export complaint reports in PDF and CSV.

### FR-10: User and Role Management

Provide role-based access for Customer, CSE, QAT and OM.

---

## 16. Non-Functional Requirements

### Performance

Complaint processing and AI results should be provided without noticeable delay during normal operation.

### Security

Only authorized users should access complaint information and permitted operations.

### Reliability

Complaint data should remain consistent throughout its lifecycle.

### Usability

The interface should require minimal effort and training.

### Maintainability

The system should be modular so categories, AI models and features can be updated without unnecessarily affecting existing functionality.

---

## 17. Technology Stack

### Frontend

- React
- Vite
- Tailwind CSS

### Main Backend

- Node.js
- Express.js
- JavaScript

### Database

- MongoDB
- Mongoose
- MongoDB Atlas for deployment
- Database: `ComplaintDB`

### AI/ML Service

- Python
- FastAPI

Responsibilities:

- Classification
- Sentiment analysis
- Priority assignment
- Resolution recommendation

### Authentication

- JWT
- bcrypt

### API

- REST
- JSON

### Testing

- Postman
- Jest
- Supertest
- React Testing Library

### Version Control

- Git
- GitHub

### Deployment

- React: Vercel
- Node.js: Render/Railway or equivalent
- FastAPI: Render/Railway or equivalent
- MongoDB: MongoDB Atlas

---

## 18. Architecture

The main application follows MVC:

```text
React Web App
      ↓
Node.js + Express
      ↓
MongoDB
```

The AI Engine is a separate FastAPI service:

```text
Node.js + Express
      ↓ REST
FastAPI
      ↓
Python AI/ML
```

Overall:

```text
React
  ↓ REST + JWT
Express Backend
  ├── Authentication
  ├── Complaints
  ├── Resolutions
  ├── SLA
  ├── Dashboard
  ├── QA
  └── Reports
        ↓
     MongoDB

Express Backend
        ↓
     FastAPI
        ↓
     AI Engine
```

---

## 19. Backend Structure

```text
backend/
│
├── src/
│   ├── controllers/
│   ├── db/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── app.js
│
├── server.js
├── .env
├── .gitignore
└── package.json
```

Use files such as:

```text
user.controller.js
user.routes.js
user.model.js
user.middleware.js
user.service.js
```

Create files only when they have a clear responsibility.

---

## 20. Backend Request Flow

```text
HTTP Request
     ↓
Route
     ↓
Middleware
     ↓
Controller
     ↓
Service (when required)
     ↓
Mongoose Model
     ↓
MongoDB
```

AI flow:

```text
Controller
     ↓
AI Service
     ↓
FastAPI
     ↓
AI/ML Processing
     ↓
Structured Result
     ↓
Node.js Backend
     ↓
MongoDB
```

---

## 21. Coding Principles

Follow:

- Simple, direct and readable code.
- Modular structure.
- Separation of concerns.
- DRY.
- KISS.
- SOLID where naturally useful.
- Secure authentication/authorization.
- Early returns.
- Explicit HTTP status codes.
- Thin routes.
- Single-responsibility middleware.
- Minimal comments.
- Readable Mongoose queries.

Avoid unnecessary:

- Repository layers.
- Factories.
- DTO layers.
- Dependency injection frameworks.
- Complex design patterns.
- Unnecessary microservices.
- Abstraction for abstraction's sake.

Security and correctness take priority over stylistic imitation.

---

## 22. Main Data Models

### User

```text
userId
name
email
password
role
createdAt
updatedAt
```

### Complaint

```text
complaintId
description
category
priority
status
channel
customer
assignedTo
sentiment
aiRecommendation
receivedAt
slaDeadline
resolvedAt
createdAt
updatedAt
```

### Resolution

```text
resolutionId
complaint
recommendation
remarks
actionTaken
resolvedAt
createdAt
updatedAt
```

### QA Review

```text
reviewId
complaint
reviewer
classificationResult
reviewRemarks
createdAt
updatedAt
```

Exact schemas may evolve during implementation while preserving the requirements and finalized class design.

---

## 23. Frontend Pages

### Common

- Login
- Registration/Profile where required
- Role-based navigation

### Customer

- Dashboard
- Submit Complaint
- Complaint History
- Complaint Details
- Complaint Tracking

### CSE

- Dashboard
- Register Complaint
- Complaint List
- Complaint Details
- AI Analysis
- Resolution Action
- Status Update
- Escalation

### QAT

- Dashboard
- Complaint Review
- Classification Review
- Trends
- Reports

### OM

- Dashboard
- Priority Complaints
- SLA Monitoring
- Workload/Analytics
- Reports

---

## 24. UML Alignment

The implementation must match the finalized UML design.

### Customer Sequence

Supports both:

```text
Text Complaint
Customer → Complaint System → AI Engine → Database → Customer
```

and:

```text
Call Complaint
Customer → Complaint System → Call Log
→ Convert to Text → Database → AI Engine
→ Database → Customer
```

### CSE Sequence

```text
CSE → Complaint System → AI Engine → Database
→ CSE → Complaint System → Database → CSE
```

### QAT Sequence

```text
QAT → Complaint System → Database
→ AI Engine → Complaint System → QAT → Database → QAT
```

### OM Sequence

```text
OM → Dashboard → Database → Dashboard → OM
→ Dashboard → Database → Report → OM
```

---

## 25. Activity Flow Alignment

```text
Start
 ↓
Complaint Received
 ↓
Complaint Source?
 ├── Customer
 │    ↓
 │  Input Channel?
 │    ├── Text → Receive Complaint Text
 │    └── Call → Record Call → Save Call Log → Convert Call to Text
 │
 └── CSE
      ↓
    Receive Complaint → Enter Complaint Details

 ↓
Send Complaint to AI Engine
 ↓
Classify Complaint
 ↓
Analyze Sentiment
 ↓
Assign Priority
 ↓
Generate Resolution Recommendation
 ↓
Issue Resolved by AI?
 ├── Yes → Provide Recommended Resolution → Update Status
 │
 └── No → Register Formal Complaint
          → Assign to CSE
          → CSE Reviews Complaint
          → Follow Recommended Action
          → Complaint Resolved?
             ├── Yes → Update Status to Resolved
             └── No → Escalate → Update Status

 ↓
Monitor SLA Time
 ↓
SLA Exceeded?
 ├── Yes → Highlight Priority Complaint
 └── No → Continue Monitoring

 ↓
Quality Assurance Review
 ↓
Update Dashboard
 ↓
Report Required?
 ├── Yes → Generate Complaint Report → Export Report
 └── No → Continue Monitoring
 ↓
End
```

---

## 26. Component Alignment

Main components:

- Authentication
- Complaint
- Dashboard
- Resolution
- Report
- AI Engine
- MongoDB / ComplaintDB

The AI Engine is implemented through the FastAPI service.

---

## 27. Deployment Alignment

```text
Client Device
(User / CSE / QAT / OM)
        │
        │ HTTP/HTTPS
        │ JWT + REST API
        ↓
Application Server
(Node.js + Express)
        │
        │ REST
        ↓
AI Service
(FastAPI + Python)

Application Server
        │
        │ TCP/IP
        │ Mongoose
        ↓
Database Server
(MongoDB / ComplaintDB)
```

---

## 28. Development Model

Use **Agile + Incremental Development**.

Implementation increments:

1. Project setup.
2. MongoDB connection.
3. Authentication and roles.
4. Complaint model and APIs.
5. Customer complaint submission.
6. CSE registration and processing.
7. AI service.
8. Resolution and escalation.
9. SLA tracking.
10. QAT module.
11. OM dashboard.
12. Reports.
13. Frontend integration.
14. Testing and refinement.

Each major feature should be implemented and tested before moving forward.

---

## 29. MVP

The minimum working system must demonstrate:

1. Authentication.
2. Role-based access.
3. Customer complaint submission.
4. CSE complaint registration.
5. AI classification.
6. Sentiment analysis.
7. Priority assignment.
8. Resolution recommendation.
9. CSE action and status update.
10. Complaint lifecycle tracking.
11. SLA monitoring.
12. QAT review.
13. OM dashboard.
14. Complaint reporting.

---

## 30. Completion Flow

A complete demonstration should be:

```text
Complaint Submission
        ↓
AI Analysis
        ↓
Classification
        ↓
Sentiment
        ↓
Priority
        ↓
Recommendation
        ↓
CSE Action
        ↓
Resolution / Escalation
        ↓
SLA Tracking
        ↓
QA Review
        ↓
OM Dashboard
        ↓
Report
```

---

## 31. Source of Truth

This PRD represents the **new implementation approach**.

The finalized Lab Sessions 01–05 design, UML diagrams and architecture are authoritative.

The previous GitHub project is historical reference material only.

If the previous project conflicts with this PRD:

**New PRD + finalized UML/design > previous GitHub implementation.**
