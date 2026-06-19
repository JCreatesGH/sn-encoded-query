// ServiceNow encoded-query operator tokens.
export const OPERATORS = {
  eq: "=", ne: "!=", gt: ">", lt: "<", gte: ">=", lte: "<=",
  contains: "LIKE", notContains: "NOT LIKE",
  startsWith: "STARTSWITH", endsWith: "ENDSWITH",
  in: "IN", notIn: "NOT IN",
  between: "BETWEEN",
  sameAs: "SAMEAS", notSameAs: "NSAMEAS",   // compare to another field
  isEmpty: "ISEMPTY", isNotEmpty: "ISNOTEMPTY",
} as const;

export type OperatorName = keyof typeof OPERATORS;

// operators that take no value
export const UNARY: OperatorName[] = ["isEmpty", "isNotEmpty"];
// operators whose value is a list
export const LIST_OPS: OperatorName[] = ["in", "notIn"];
// operators whose value is a two-ended range, encoded `low@high`
export const RANGE_OPS: OperatorName[] = ["between"];
