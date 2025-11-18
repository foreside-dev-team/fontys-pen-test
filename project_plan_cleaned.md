# Project Plan

## Contents

-   Definition
-   Project Overview
-   Scope
-   Regulatory and Legal Framework
-   Deliverables
-   Strategies
-   Methodology
-   Activities
-   Social Engineering
-   Risk Rating Classification
-   Project Organization
-   Scheduling
-   Communication & Updates

------------------------------------------------------------------------

## Definition

### Project Overview

**Project Name:** Group K\
**Company:** Foreside\
**Timeline:** 28-10-2025 -- 15-1-2025\
**Objective:** Identify security vulnerabilities in client applications,
provide actionable remediation advice, and support continuous security
improvement.

------------------------------------------------------------------------

## Scope

This penetration test focuses on assessing the security of an API within
a white‑box environment with full access to source code, configuration,
and documentation. Testing includes:

-   API endpoint analysis\
-   Identifying vulnerabilities and misconfigurations\
-   Reviewing authentication/authorization flows (JWT, OAuth 2.0)\
-   Understanding token behavior\
-   Using RESTler for API fuzzing

------------------------------------------------------------------------

## Regulatory and Legal Framework

Testing will only begin after formal permission from the system owner.
All activities follow ethical and legal requirements including GDPR.
AI-driven tools will be used cautiously with human oversight.

------------------------------------------------------------------------

## Deliverables

-   Full penetration report\
-   Executive summary with remediation advice\
-   Retest results (if applicable)\
-   Evidence and logs\
-   Final presentation

------------------------------------------------------------------------

## Strategies & Methodology

### 1. Planning and Preparation

-   Define scope\
-   Obtain authorization\
-   Establish communication and escalation rules\
-   Define testing hours and engagement rules

### 2. Reconnaissance

-   Analyze workflows and interactions\
-   Identify endpoints and dependencies\
-   Determine data flows and threats

### 3. Scanning and Enumeration

-   Automated and manual scanning\
-   Authenticated and unauthenticated tests

### 4. Vulnerability Analysis

-   Static code analysis\
-   Review auth & data handling\
-   Validate and prioritize findings

### 5. Exploitation

-   Analyze scan results\
-   Review business logic\
-   Document successful findings

### 6. Post‑Exploitation

-   Demonstrate data access or privilege escalation\
-   Log all accessed elements

### 7. Reporting

-   Executive summary\
-   Technical findings\
-   Reproduction steps\
-   Remediation advice

------------------------------------------------------------------------

## Activities

### Authentication & Token Testing

Simulate MITM attacks with Burp Suite, analyze TLS settings, and test
JWT security.

### Fuzz Testing

Send malformed/random data to uncover crashes and flaws.

### Input Validation Testing

Evaluate NestJS Validation Pipe configuration, ensuring sanitization,
safe error handling, and whitelisted fields.

### API Reconnaissance & Fuzzing

Analyze documentation and code, fuzz endpoints, and inspect
authentication/authorization flows.

### Command Injection Testing

Review source code for injection vulnerabilities.

### SAST Tools

Use Semgrep and similar tools for automated code analysis.

### Additional Activities

Performed as new information emerges.

------------------------------------------------------------------------

## Social Engineering

Social engineering attempts will be restricted to gathering technical
insights for penetration testing.\
(*Personal names removed as requested.*)

------------------------------------------------------------------------

## Risk Rating Classification

### Very High Risk

High impact and high probability. Requires immediate remediation.

### High Risk

High impact and medium probability, or very high impact with low
probability.

### Some Risk

Medium impact with low probability, or low impact with high probability.

### Low Risk

Low impact and low probability.

Final risk rating is based on a probability--impact matrix.

------------------------------------------------------------------------

## Project Organization

### Stakeholders & Team Members

(*All personal information removed as requested.*)

------------------------------------------------------------------------

## Scheduling

-   **Delivery date:** 15‑1‑2026\
-   **Sprint 2:** 4‑11‑2025 → 11‑11‑2025\
-   **Sprint 3:** 20‑11‑2025 → 27‑11‑2025\
-   **Sprint 4:** 11‑12‑2025 → 18‑12‑2025\
-   **Christmas vacation:** 22‑12‑2025 → 05‑01‑2026

------------------------------------------------------------------------

## Communication & Updates

Weekly reports will be sent via agreed communication channels.
Additional meetings can be scheduled when clarification is required.
