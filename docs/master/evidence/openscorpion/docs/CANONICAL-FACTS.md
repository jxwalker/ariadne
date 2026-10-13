# Canonical Facts

Last verified: 2026-09-27

This file is the repository baseline for numeric claims that commonly drift in documentation. If a document needs a current count, cite this file rather than repeating the number. Release notes may retain historical counts when they are explicitly labelled as release-time facts.

## Verified Counts

| Fact | Current value | Methodology |
|---|---:|---|
| Workspace crates | 16 | `find crates -mindepth 1 -maxdepth 1 -type d \| sort \| wc -l` |
| Product binaries | 5 | Count the product-facing runtime binaries listed below. Excludes internal utility/demo targets returned by Cargo metadata. |
| Cargo binary targets | 7 | `cargo metadata --no-deps --format-version 1 \| jq -r '.packages[] \| .name as $pkg \| .targets[] \| select(.kind[] == "bin") \| "\($pkg)\t\(.name)"'` |
| Literal `#[test]` attributes in `crates/` | 1773 | `grep -r '#\[test\]' crates/ \| wc -l` |
| Production SQL migrations | 104 | `find migrations -maxdepth 1 -type f -name '*.sql' \| wc -l` |
| Verification SQL migrations | 17 | `find verification/migrations -maxdepth 1 -type f -name '*.sql' \| wc -l` |
| HTML template files in `crates/` | 123 | `find crates -name '*.html' -type f \| wc -l` |
| Dashboard HTML templates | 102 | `find crates/scorpion-dashboard/templates -name '*.html' -type f \| wc -l` |
| Verification-server HTML templates | 21 | `find crates/scorpion-verify-server/templates -name '*.html' -type f \| wc -l` |
| Signal definition types | 9 | `sed -n '/pub enum SignalDefinition/,/^}/p' crates/scorpion-types/src/protocol/config.rs \| rg '^[[:space:]]+[A-Z][A-Za-z0-9]*\(' \| wc -l` |
| Router pipeline stages | 7 | `rg '\\.add_stage\\(' crates/scorpion-router/src/pipeline/mod.rs \| wc -l` |
| Argumentation semantics | 5 | `sed -n '/pub enum Semantics/,/^}/p' crates/scorpion-types/src/lib.rs \| rg '^[[:space:]]+[A-Z][A-Za-z0-9]*,' \| wc -l` |

Note on test counting: the literal `#[test]` count intentionally excludes `#[tokio::test]` and other async-test attributes. Use single quotes so the shell does not expand brackets, and escape the brackets so grep treats them as literal characters: `grep -r '#\[test\]' crates/ | wc -l`. The unescaped grep pattern `#[test]` is a regex character class and does not count literal Rust test attributes. To count all Rust test attributes in `crates/`, run `grep -r '#\[.*test\]' crates/ | wc -l`.

## Canonical Crate List

- `scorpion-types`
- `scorpion-providers`
- `scorpion-apcg`
- `scorpion-engine`
- `scorpion-signals`
- `scorpion-grpc`
- `scorpion-dashboard`
- `scorpion-control`
- `scorpion-router`
- `scorpion-verify-types`
- `scorpion-verify-store`
- `scorpion-verify-runner`
- `scorpion-verify-server`
- `scorpion-profiler`
- `scorpion-verify-proof`
- `scorpion-wasm`

## Canonical Product Binary List

These are the shipped product/runtime binaries. The workspace also contains Cargo binary targets used for evaluation and data seeding; those are tracked separately above.

- `scorpion-control`
- `scorpion-router`
- `scorpion-verify`
- `scorpion-profiler`
- `scorpion-verify-proof`

The workspace also contains utility binary targets:

- `scorpion-eval`
- `seed_bank_demo_proofs`

## Canonical Signal Type List

- `Keyword`
- `Regex`
- `Embedding`
- `Language`
- `ContextLength`
- `Complexity`
- `Domain`
- `External`
- `Modality`

## Canonical Pipeline Stage List

- `Guard`
- `Protection`
- `Intelligence`
- `Optimize`
- `Governance`
- `Selection`
- `Dispatch`

Quality evaluation and reputation feedback run inside `DispatchStage`; they are not separate top-level pipeline stages.

## Canonical Argumentation Semantics

- `Grounded`
- `Stable`
- `Preferred`
- `Ideal`
- `Auto`
