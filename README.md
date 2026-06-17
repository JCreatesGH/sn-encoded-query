# sn-encoded-query

[![CI](https://github.com/JCreatesGH/sn-encoded-query/actions/workflows/ci.yml/badge.svg)](https://github.com/JCreatesGH/sn-encoded-query/actions)
[![TypeScript](https://img.shields.io/badge/types-included-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

Build, parse, and validate ServiceNow **encoded queries** with a typed fluent API — no more hand-concatenating `active=true^priority<=2^ORDERBYDESC...` strings and hoping the operators are right.

![screenshot](assets/screenshot.png)

## Install

```bash
npm install sn-encoded-query
```

## Build

```ts
import { query } from "sn-encoded-query";

query()
  .where("active", "eq", true)
  .and("priority", "lte", 2)
  .or("assigned_to", "isEmpty")
  .orderByDesc("sys_created_on")
  .build();
// "active=true^priority<=2^ORassigned_toISEMPTY^ORDERBYDESCsys_created_on"
```

Operators are a typed union: `eq, ne, gt, lt, gte, lte, contains, notContains, startsWith, endsWith, in, notIn, isEmpty, isNotEmpty`. Unary and list operators are handled correctly.

## Parse & validate

```ts
import { parseQuery, validate } from "sn-encoded-query";

parseQuery("active=true^priority>=2^ORstate=6");   // structured conditions

validate("active=true^bogus_field=1", new Set(["active", "priority"]));
// [{ severity: "high", rule: "unknown-field", message: "Field 'bogus_field' is not in the table schema." }]
```

The validator catches unknown fields (when given a schema), unparseable operators, and empty `field=` values that should be `isEmpty` checks. The parser binds each condition to the **earliest** operator, so a value that contains operator text (e.g. `state=INPROGRESS`, `descriptionLIKEa=b`) parses correctly instead of splitting on the `IN`/`=` inside the value.

## CLI

Installing the package adds an `sn-encoded-query` command — parse and validate a query string (exits 1 on a HIGH issue):

```bash
$ sn-encoded-query "active=true^priority>=2^ORstate=6"
$ sn-encoded-query "state=INPROGRESS^assigned_toISEMPTY" --json
```

## Development

```bash
npm install && npm test    # 15 tests
npm run build              # tsc, clean
```

## License

MIT
