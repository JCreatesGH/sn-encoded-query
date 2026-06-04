import { parseQuery } from "./parse.js";

export interface ValidationIssue {
  severity: "high" | "medium";
  rule: string;
  message: string;
}

export function validate(encoded: string, fields?: Set<string>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const conditions = parseQuery(encoded);
  if (conditions.length === 0) {
    issues.push({ severity: "medium", rule: "empty", message: "Query is empty." });
  }
  for (const c of conditions) {
    if (c.op === "unknown") {
      issues.push({ severity: "high", rule: "bad-operator",
        message: `Could not parse a valid operator in segment for '${c.field}'.` });
    }
    if (fields && c.field && !fields.has(c.field)) {
      issues.push({ severity: "high", rule: "unknown-field",
        message: `Field '${c.field}' is not in the table schema.` });
    }
    if ((c.op === "eq" || c.op === "ne") && c.value === "") {
      issues.push({ severity: "medium", rule: "empty-value",
        message: `'${c.field}${c.token}' has no value — use isEmpty for empty checks.` });
    }
  }
  return issues;
}
