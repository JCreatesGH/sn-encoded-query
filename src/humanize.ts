import { parseQuery, parseOrderBy, ParsedCondition } from "./parse.js";
import { OperatorName } from "./operators.js";

// Plain-English phrasing for each operator.
const PHRASES: Record<OperatorName, string> = {
  eq: "is", ne: "is not", gt: ">", lt: "<", gte: "≥", lte: "≤",
  contains: "contains", notContains: "does not contain",
  startsWith: "starts with", endsWith: "ends with",
  in: "is one of", notIn: "is not one of",
  between: "is between",
  sameAs: "is the same as", notSameAs: "is not the same as",
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
  let text = "";
  parseQuery(encoded).forEach((c, i) => {
    if (i === 0) text += describe(c);
    else if (c.join === "NQ") text += "; or " + describe(c);   // new-query group boundary
    else if (c.join === "OR") text += " or " + describe(c);
    else text += " and " + describe(c);
  });
  const order = parseOrderBy(encoded);
  if (order.length) {
    const by = order.map((o) => `${o.field}${o.desc ? " (descending)" : ""}`).join(", ");
    text += `${text ? ", " : ""}sorted by ${by}`;
  }
  return text || "(empty query)";
}
