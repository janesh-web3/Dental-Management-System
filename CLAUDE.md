# Dental Management System – Team Shared Instructions

---

## Project Architecture

### High-Level System Overview
- **Frontend:** React (TypeScript), Tailwind CSS, Vite
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Database:** MongoDB
- **Integrations:** 
  - SMS (Aakash SMS API)
  - Cloudinary (file uploads)
  - Gemini API (AI-powered analytics/reports)

### Technologies and Frameworks
- React, TypeScript, Tailwind CSS, Vite
- Node.js, Express, Mongoose
- MongoDB
- Cloudinary, Aakash SMS API, Gemini API

### Folder Structure & Module Breakdown
- `admin/`: Frontend app
  - `src/components/`: UI components
  - `src/pages/`: Page-level components
  - `src/types/`: TypeScript types
- `backend/`: Backend API
  - `controller/`: Express controllers
  - `model/`: Mongoose models
  - `routes/`: API routes
  - `gemini/`: AI analytics integration
  - `config/`: Configuration

### Deployment Process & Environments
- **Frontend:** Built with Vite, deployed as static assets
- **Backend:** Node.js server, environment variables in `.env`
- **Environments:** `.env`, `.env.example`
- **Deployment:** Node.js standard

---

## Coding Standards

### Naming Conventions
- **Files:** kebab-case for JS/TS files, PascalCase for React components
- **Variables:** camelCase for variables/functions, PascalCase for types/classes
- **Components:** PascalCase

### Linting/Formatting Rules
- ESLint config: `admin/eslint.config.js`
- Tailwind CSS config: `admin/tailwind.config.js`
- Prettier recommended

### Git Commit Message Format
- Conventional Commits (e.g., `feat:`, `fix:`, `docs:`)

### Component Structure & Best Practices
- Functional components and hooks
- TypeScript interfaces for props/state
- Responsive design with Tailwind CSS
- Logic in hooks, UI in components

---

## Common Workflows

### Branching Strategy
- Feature branches for new features
- Pull requests for code review
- Main branch for production

### Feature Development & Pull Request Process
1. Create feature branch
2. Implement feature
3. Open pull request
4. Code review and approval
5. Merge to main

### Code Review Guidelines
- Ensure type safety
- Check for linting errors
- Validate business logic and UI
- Test new features

### Testing & QA Workflow
- Unit tests (recommended)
- Manual QA for new features

### CI/CD Pipeline Instructions
- Standard Node.js/React CI/CD

---


## Features Overview

### Key Features
- **Patient Management:** Registration, profile, medical history, treatment plans, document uploads , add prescription , edit payment , add services payment , send email , send whatsapp , ai reports  , view edit update and delete patients   
- **Doctor Module:** Doctor profiles, assignments, treatment tracking
- **Treatment Tracking:** Daily treatments, group treatments, orthodontic plans, X-Ray plans
- **Invoices & Payments:** Service payments, orthodontic payments, payment tracking, due/paid calculation
- **Analytics & Dashboard:** Patient statistics, financial analytics, AI-powered reports (Gemini) , filter patients by registration date , follow-up date , by patients group , treated by doctor , by procedure 
- **SMS Notifications:** Single/bulk SMS, template management, history, credit monitoring (Aakash SMS API)
- **File Uploads:** Cloudinary integration for patient documents and X-Rays
- **Role-Based Access:** Admin, doctor, patient roles with permissions
- **Appointment Scheduling:** (if implemented) Patient appointments, reminders
- **Audit & History:** Treatment and SMS history tracking
- **Customizable Templates:** SMS and document templates
- **Reporting:** Monthly usage, treatment completion, financial reports
- **Integrations:** Cloudinary, Aakash SMS API, Gemini AI analytics

---

**Refer to this document for team-shared instructions. Update as needed for new standards