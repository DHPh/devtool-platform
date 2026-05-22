"use client";

import { useMemo, useState } from "react";
import {
  CopyableResult,
  ToolErrorResult as ErrorResult,
  ToolSectionHeader as Header,
} from "@/components/layout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildSelectQuery,
  type SqlCondition,
} from "@/lib/processors/data-workflow-core";

const SQL_OPERATORS: SqlCondition["operator"][] = [
  "=",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
  "LIKE",
  "IS NULL",
  "IS NOT NULL",
];

export function SqlQueryBuilderTab() {
  const [table, setTable] = useState("users");
  const [columns, setColumns] = useState("id, name, email");
  const [conditionColumn, setConditionColumn] = useState("active");
  const [operator, setOperator] = useState<SqlCondition["operator"]>("=");
  const [conditionValue, setConditionValue] = useState("true");
  const [orderBy, setOrderBy] = useState("name");
  const [sortDirection, setSortDirection] = useState<"ASC" | "DESC">("ASC");
  const [limit, setLimit] = useState("25");

  const result = useMemo(
    () =>
      buildSelectQuery({
        table,
        columns: columns.split(","),
        conditions: conditionColumn
          ? [{ column: conditionColumn, operator, value: conditionValue }]
          : [],
        orderBy: orderBy || undefined,
        descending: sortDirection === "DESC",
        limit: limit ? Number(limit) : undefined,
      }),
    [
      table,
      columns,
      conditionColumn,
      operator,
      conditionValue,
      orderBy,
      sortDirection,
      limit,
    ],
  );

  return (
    <section className="space-y-5">
      <Header
        title="SQL Query Builder"
        description="Build a SELECT query with escaped literal values. Review generated SQL before execution."
      />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-medium">Table</span>
          <Input
            value={table}
            onChange={(event) => setTable(event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Columns</span>
          <Input
            value={columns}
            onChange={(event) => setColumns(event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Condition column</span>
          <Input
            value={conditionColumn}
            onChange={(event) => setConditionColumn(event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Operator</span>
          <Select
            value={operator}
            onValueChange={(value) =>
              setOperator(value as SqlCondition["operator"])
            }
          >
            <SelectTrigger aria-label="Operator">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SQL_OPERATORS.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Condition value</span>
          <Input
            value={conditionValue}
            onChange={(event) => setConditionValue(event.target.value)}
            disabled={operator.includes("NULL")}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Order by</span>
          <Input
            value={orderBy}
            onChange={(event) => setOrderBy(event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Sort direction</span>
          <Select
            value={sortDirection}
            onValueChange={(value) => setSortDirection(value as "ASC" | "DESC")}
          >
            <SelectTrigger aria-label="Sort direction">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ASC">ASC (Ascending)</SelectItem>
              <SelectItem value="DESC">DESC (Descending)</SelectItem>
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium">Limit</span>
          <Input
            type="number"
            min="1"
            max="1000000"
            value={limit}
            onChange={(event) => setLimit(event.target.value)}
          />
        </label>
      </div>
      {result.ok ? (
        <CopyableResult
          value={result.value}
          label="SELECT query (escaped literals)"
          copyLabel="Copy SELECT query"
          language="sql"
          rows={8}
        />
      ) : (
        <ErrorResult message={result.error} />
      )}
    </section>
  );
}
