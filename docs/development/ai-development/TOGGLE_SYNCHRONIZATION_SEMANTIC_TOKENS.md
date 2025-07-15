# TOGGLE_SYNCHRONIZATION_SEMANTIC_TOKENS.md

## Semantic Tokens for Toggle Synchronization

This document defines the semantic tokens used for the toggle synchronization feature between the popup and overlay windows. All code, tests, and documentation related to this feature must reference these tokens for traceability and cross-referencing.

---

### Token Table

| Token Name                  | Description                                                      | Usage Scope                |
|-----------------------------|------------------------------------------------------------------|----------------------------|
| `TOGGLE_SYNC_ACTION`        | Action/event for synchronizing toggle state                      | Code, tests, docs          |
| `TOGGLE_SYNC_POPUP`         | Toggle state in popup window                                     | Code, docs, UI             |
| `TOGGLE_SYNC_OVERLAY`       | Toggle state in overlay window                                   | Code, docs, UI             |
| `TOGGLE_SYNC_SITE_RECORD`   | Site record update on toggle                                     | Code, docs                 |
| `TOGGLE_SYNC_MESSAGE`       | Message/event for cross-window communication                     | Code, docs, protocol       |
| `TOGGLE_SYNC_TEST`          | Test cases for toggle synchronization                            | Test files, test plans     |
| `TOGGLE_SYNC_ARCH_DECISION` | Architectural decisions for toggle synchronization               | Architecture docs          |
| `TOGGLE_SYNC_SPEC`          | Specification for toggle synchronization                         | Specification docs         |

---

## Usage Requirements

- All new and updated documentation, code, and tests for toggle synchronization must reference the relevant semantic tokens.
- Tokens must be included in file headers, code comments, and test descriptions where applicable.
- Cross-referencing with these tokens is required for traceability and maintainability.

---

## Example Usage

- In code: `// [TOGGLE_SYNC_ACTION] Dispatch toggle sync event`
- In documentation: `This section describes the [TOGGLE_SYNC_MESSAGE] protocol for cross-window communication.`
- In tests: `Test verifies [TOGGLE_SYNC_TEST] for overlay and popup synchronization.`

---

## Cross-Referencing

- All related documents (specification, implementation plan, architectural decisions, summary) must reference these tokens.
- Updates to tokens must be reflected in all cross-referenced files. 