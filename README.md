# SDET Take-Home Challenge — User Management API Test Suite

An end-to-end (E2E) automated testing suite and CI/CD regression pipeline for the **User Management API**. Built with **TypeScript** and **Playwright Test API Request Context**, targeting multi-environment (`dev` and `prod`) isolated deployments.

---

## 📋 Table of Contents

* Architecture & Tech Stack
* Key Features & Highlighted Practices
* Project Structure
* Getting Started Locally
* Prerequisites
* Installation & Setup
* Running the API Container
* Executing Tests

* CI/CD Pipeline (GitHub Actions)
* Bug Reporting & Known Issues

---

## 🛠 Architecture & Tech Stack

* **Language:** TypeScript (`ES2021`, Strict Mode)
* **Framework:** [Playwright Test](https://www.google.com/search?q=https://playwright.dev/) (`@playwright/test`)
* **Design Pattern:** API Client Wrapper / Page Object Model for API Services (`UserApiClient`)
* **Data Generation:** Factory Pattern (`UserFactory`) powered by `@faker-js/faker`
* **Containerization & CI/CD:** Docker, GitHub Actions (Parallel Job Execution)

---

## ✨ Key Features & Highlighted Practices

This repository goes beyond basic assertions to demonstrate production-ready test architecture and engineering rigor:

1. **API Client Abstraction Layer (`UserApiClient`)**
* Encapsulates low-level HTTP calls, request headers, and route construction (`/{env}/users`).
* Promotes DRY (Don't Repeat Yourself) code and clean test spec files.


2. **Custom Playwright Fixtures (`fixtures.ts`)**
* Leverages Playwright’s dependency injection system to instantiate `UserApiClient` per test.
* Provides clean fixture scopes without repetitive setup/teardown boilerplate.


3. **Dynamic Data Generation (`UserFactory`)**
* Uses `@faker-js/faker` to build realistic, isolated test payloads on the fly.
* Prevents state contamination and hardcoded test data collisions.


4. **Self-Documenting Regression Test Suite (Spec-First Assertions)**
* Tests assert against the official OpenAPI specification (`sdet_challenge_api.yml`).
* Known bug behaviors are intentionally left asserting expected spec behavior with detailed code comments explaining the regression status. Once backend bugs are resolved, the suite automatically passes green without requiring code modifications.


5. **Multi-Environment Parallel Pipeline (Dev & Prod)**
* GitHub Actions workflow runs `dev` and `prod` stages **in parallel** as independent matrix jobs using `ghcr.io/danielsilva-loanpro/sdet-interview-challenge:latest` service containers.
* Prevents pipeline blockage when environment-specific bugs occur.


6. **Automated Artifact Reporting**
* Configured with `if: always()` step execution in CI to capture and preserve Playwright HTML reports for failed/passed runs.



---

## 📂 Project Structure

```text
.
├── .github/
│   └── workflows/
│       └── api-regression.yml   # GitHub Actions pipeline for DEV & PROD
├── src/
│   ├── api/
│   │   └── UserApiClient.ts     # Encapsulated API HTTP client
│   ├── factories/
│   │   └── UserFactory.ts       # Dynamic fake data generator
│   ├── fixtures/
│   │   └── fixtures.ts          # Custom Playwright fixtures
│   └── types/
│       └── User.ts              # TypeScript interfaces for API models
├── tests/
│   ├── users.create.spec.ts     # POST /users test cases
│   ├── users.get.spec.ts        # GET /users & GET /users/{email} test cases
│   ├── users.update.spec.ts     # PUT /users/{email} test cases
│   └── users.delete.spec.ts     # DELETE /users/{email} test cases
├── BUGS_REPORT.md               # Detailed markdown bug findings report
├── tsconfig.json                # Strict TypeScript configuration with path aliases
├── playwright.config.ts         # Playwright multi-project config (dev/prod)
└── package.json                 # Scripts and dependencies

```

---

## 🚀 Getting Started Locally

### Prerequisites

* **Node.js**: v20 or higher (v22 recommended)
* **Docker Desktop**: Installed and running

### Installation & Setup

1. Clone this repository:
```bash
git clone https://github.com/<your-username>/sdet-challenge.git
cd sdet-challenge

```


2. Install dependencies:
```bash
npm ci

```


3. Install Playwright browsers/dependencies:
```bash
npx playwright install --with-deps

```



---

### Running the API Container

Start the local target API using the official Docker container:

```bash
docker run -d -p 3000:3000 --name sdet-api ghcr.io/danielsilva-loanpro/sdet-interview-challenge:latest

```

Verify the service is running:

```bash
curl http://localhost:3000/dev/users

```

---

### Executing Tests

| Command | Description |
| --- | --- |
| `npm test` | Runs the full test suite across all configured projects (`dev` and `prod`) |
| `npm run test:dev` | Runs tests exclusively against the **DEV** environment project |
| `npm run test:prod` | Runs tests exclusively against the **PROD** environment project |
| `npm run test:report` | Opens the interactive HTML Playwright execution report |

---

## 🔄 CI/CD Pipeline (GitHub Actions)

The workflow file `.github/workflows/api-regression.yml` automates the regression suite on every push or pull-request to `main`/`master` (or manual trigger via `workflow_dispatch`).

### Workflow Highlights

* **Service Container**: Spins up `ghcr.io/danielsilva-loanpro/sdet-interview-challenge:latest` mapping port `3000:3000`.
* **Parallel Jobs**: `test-dev` and `test-prod` run in parallel to prevent single-environment test failures from blocking the pipeline.
* **Artifact Upload**: Playwright HTML reports (`playwright-report-dev` and `playwright-report-prod`) are automatically published and downloadable on each run.

---

## 🐛 Bug Reporting & Known Issues

Discrepancies found between the actual API behavior and the official specification (`sdet_challenge_api.yml`) have been documented in detail in **BUGS_REPORT.md**.

### Summary of Identified Issues:

* **BUG-004 / BUG-006**: `DELETE /{env}/users/{email}` does not validate authentication credentials (requests succeed even without headers or with invalid tokens).
* **BUG-005**: `GET /{env}/users/{email}` returns `500 Internal Server Error` instead of `404 Not Found` when requesting a deleted or non-existent record.
* **BUG-007**: Resource lookup precedes authentication validation, returning `404` instead of `401` when unauthenticated requests are sent for non-existent users (Potential User Enumeration vulnerability).

---
## 👨‍💻 Author & Strategic Contact

* **Vanesa Santos** — *Software Engineer & QA Specialist*
* **LinkedIn:** [linkedin.com/in/santosvanesa](https://www.linkedin.com/in/santosvanesa/)
* **Credentials:** ISTQB® Certified | University Professor
* **Email:** vanesa.santos.qa@gmail.com
