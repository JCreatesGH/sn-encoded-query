# Changelog

All notable changes are documented here, following
[Keep a Changelog](https://keepachangelog.com/) and [SemVer](https://semver.org/).

## [0.3.0]

### Added
- **`^NQ` "new query" groups** — ServiceNow's OR-between-whole-groups separator is now a
  first-class join across the builder (`newQuery()`), parser (`join: "NQ"`), validator, and
  explainer (`"…; or …"`). Previously a `^NQ` segment mis-parsed as a field named `NQ<field>`.
- **`sameAs` / `notSameAs`** operators (`SAMEAS` / `NSAMEAS`) for field-to-field comparison,
  with plain-English phrasing.

### Fixed
- `validate()` now checks the real field after an `^NQ` separator against the schema instead
  of reporting a false `unknown-field` for `NQ<field>`.

## [0.2.0]

### Added
- `humanize(encoded)` — render a query as a plain-English sentence ("active is
  true and priority ≤ 2 …, sorted by sys_created_on (descending)"); exposed as
  the `--explain` CLI flag.
- `BETWEEN` operator end-to-end (builder encodes `low@high`, parser reads it,
  humanize renders it), plus `parseOrderBy()` to surface ORDERBY clauses.

## [0.1.0]

### Added
- Typed builder, parser, and validator for ServiceNow encoded queries, binding
  each condition to the earliest operator, plus an `sn-encoded-query` CLI.
