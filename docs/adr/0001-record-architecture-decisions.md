# ADR 0001: Record Architecture Decisions

## Status

Accepted

## Context

AuraOS is a greenfield project with many architectural choices ahead: desktop framework, database, sync strategy, AI integration, and capture pipelines. Without a decision log, rationale gets lost and the same debates repeat.

## Decision

We will use Architecture Decision Records (ADRs) to document significant technical decisions in `docs/adr/`.

Each ADR will:

- Be numbered sequentially
- Include status, context, decision, and consequences
- Be immutable once accepted (supersede with a new ADR if the decision changes)

## Consequences

**Positive:**

- New contributors and future-you can understand why choices were made
- Agents and tooling can reference stable decision context
- Revisiting decisions is explicit (new ADR supersedes old)

**Negative:**

- Small overhead to write ADRs for non-trivial decisions
- Requires discipline to keep the index updated
