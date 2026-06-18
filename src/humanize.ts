import { parseQuery, parseOrderBy, ParsedCondition } from "./parse.js";
import { OperatorName } from "./operators.js";

// Plain-English phrasing for each operator.
const PHRASES: Record<OperatorName, string> = {
  eq: "is", ne: "is not", gt: ">", lt: "<", gte: "≥", lte: "≤",
  contains: "contains", notContains: "does not contain",
  startsWith: "starts with", endsWith: "ends with",
  in: "is one of", notIn: "is not one of",
  between: "is between",
  isEmpty: "is empty", isNotEmpty: "is not empty",
};

function describe(c: ParsedCondition): string {
  if (c.op === "unknown") return `${c.field} (unparsed)`;
  const op = c.op;
  if (op === "isEmpty" || op === "isNotEmpty") return `${c.field} ${PHRASES[op]}`;
  if (op === "between") {
    const [a, b] = c.value.split("@");
    return `${c.field} is between ${a || "?"} and ${b || "?"}`;
  }
  if (op === "in" || op === "notIn") {
    return `${c.field} ${PHRASES[op]} [${c.value.split(",").map((s) => s.trim()).join(", ")}]`;
  }
  return `${c.field} ${PHRASES[op]} ${c.value === "" ? '""' : c.value}`;
}

/** Render a ServiceNow encoded query as a plain-English sentence. */
export function humanize(encoded: string): string {
  const parts = parseQuery(encoded).map((c, i) => {
    const prefix = i === 0 ? "" : c.join === "OR" ? "or " : "and ";
    return prefix + describe(c);
  });
  let text = parts.join(" ");
  const order = parseOrderBy(encoded);
  if (order.length) {
    const by = order.map((o) => `${o.field}${o.desc ? " (descending)" : ""}`).join(", ");
    text += `${text ? ", " : ""}sorted by ${by}`;
  }
  return text || "(empty query)";
}
