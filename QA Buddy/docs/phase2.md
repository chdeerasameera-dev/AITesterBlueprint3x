# QABuddy.AI — Phase 2 Project Roadmap

This document outlines features scheduled for Phase 2 implementation.

## 1. JIRA Connector Cron Job
In Phase 1, JIRA tickets are pulled interactively via MCP and saved as JSON. In Phase 2:
- Set up a scheduled runner (cron) in the backend.
- Connect directly to the JIRA REST API using project JQL queries to capture new tickets hourly.
- Implement incremental ingestion updates (only checking modified tickets).

## 2. Figma Webhook Integration
- Connect to the Figma API via Webhooks.
- Parse design guides, bounding components, and styles directly into markdown descriptors.
- Embed textual wireframe frames to enable visual design grounded Q&A.

## 3. Real-time Jenkins Failure Diagnostics
- Trigger automatic diagnostics on Jenkins build failure webhooks.
- Ingest build stack traces immediately.
- Correlate failure traces with recent PR/Git commit history to suggest specific fix lines.

## 4. Multi-Tenant QA Workspace
- Expand collection structures in Qdrant with tenant/namespace payload filters.
- Allow separate testing teams to index different POM framework repos.
