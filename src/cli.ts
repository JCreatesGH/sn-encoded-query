#!/usr/bin/env node
import { parseQuery } from "./parse.js";
import { validate } from "./validate.js";
import { humanize } from "./humanize.js";

const HELP = `sn-encoded-query — parse, explain & validate a ServiceNow encoded query

Usage:
  sn-encoded-query "<encoded query>" [--json] [--explain]

Options:
  --explain     print the query as a plain-English sentence
  --json        emit parsed conditions + issues as JSON
  -h, --help    show this help

Exit code: 1 if validation finds a HIGH-severity issue, otherwise 0.`;

/** Pure core: parse + validate a query, returning an exit code and printable text. */
export function run(args: string[]): { code: number; output: string } {
  if (args.length === 0) return { code: 1, output: HELP };
  if (args.includes("-h") || args.includes("--help")) return { code: 0, output: HELP };

  const json = args.includes("--json");
  const explain = args.includes("--explain");
  const encoded = args.filter((a) => a !== "--json" && a !== "--explain").join(" ");
  if (explain) return { code: 0, output: humanize(encoded) };
  const conditions = parseQuery(encoded);
  const issues = validate(encoded);
  const high = issues.some((i) => i.severity === "high");

  if (json) {
    return { code: high ? 1 : 0, output: JSON.stringify({ conditions, issues }, null, 2) };
  }

  const lines = conditions.map((c) =>
    c.op === "unknown"
      ? `  ?  ${c.field}  (unparsed)`
      : `  ${c.join === "OR" ? "OR " : "   "}${c.field} ${c.op} ${c.value}`.replace(/\s+$/, ""));
  if (issues.length) {
    lines.push("", "Issues:");
    for (const i of issues) lines.push(`  ${i.severity.toUpperCase()} ${i.rule}: ${i.message}`);
  } else {
    lines.push("", "✓ no issues");
  }
  return { code: high ? 1 : 0, output: lines.join("\n") };
}

// Execute only as the CLI binary (not when imported by tests).
if (process.argv[1] && /cli\.js$/.test(process.argv[1])) {
  const { code, output } = run(process.argv.slice(2));
  (code === 0 ? console.log : console.error)(output);
  process.exit(code);
}
