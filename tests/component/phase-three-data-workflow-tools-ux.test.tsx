// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { DataToSqlTab as DataToSqlTool } from "@/lib/tools/data-api-studio/tabs/DataToSqlTab";
import { FakeDataGeneratorTab as FakeDataGeneratorTool } from "@/lib/tools/data-api-studio/tabs/FakeDataGeneratorTab";
import { GraphqlFormatterTab as GraphqlFormatterTool } from "@/lib/tools/data-api-studio/tabs/GraphqlFormatterTab";
import { OpenApiValidatorTab as OpenApiValidatorTool } from "@/lib/tools/data-api-studio/tabs/OpenApiValidatorTab";
import { SqlFormatterTab as SqlFormatterTool } from "@/lib/tools/data-api-studio/tabs/SqlFormatterTab";
import { SqlQueryBuilderTab as SqlQueryBuilderTool } from "@/lib/tools/data-api-studio/tabs/SqlQueryBuilderTab";

afterEach(cleanup);

describe("Phase 3 data-workflow UX", () => {
  it("provides a copy action for formatted SQL", () => {
    render(<SqlFormatterTool />);
    expect(screen.getByRole("button", { name: "Copy result" })).toBeVisible();
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Result" }).value).toContain("ORDER BY");
  });

  it("provides a copy action for a built SELECT query", () => {
    render(<SqlQueryBuilderTool />);
    expect(screen.getByRole("button", { name: "Copy SELECT query" })).toBeVisible();
  });

  it("provides a copy action for generated INSERT SQL", () => {
    render(<DataToSqlTool />);
    expect(screen.getByRole("button", { name: "Copy result" })).toBeVisible();
    expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Result" }).value).toContain("INSERT INTO");
  });

  it("provides independent OpenAPI summary copy actions", () => {
    render(<OpenApiValidatorTool />);
    expect(screen.getByRole("button", { name: "Copy OpenAPI version" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy API title" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy path count" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy operation count" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Copy validation result" })).toBeVisible();
  });

  it("formats GraphQL and exposes the result copy action", async () => {
    const user = userEvent.setup();
    render(<GraphqlFormatterTool />);
    await user.click(screen.getByRole("button", { name: "Format GraphQL" }));
    expect(await screen.findByRole("button", { name: "Copy result" })).toBeVisible();
    await waitFor(() => expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Result" }).value).toContain("query User"));
  });

  it("updates and copies deterministic fake data", async () => {
    const user = userEvent.setup();
    render(<FakeDataGeneratorTool />);
    const count = screen.getByRole("spinbutton", { name: "Record count" });
    await user.clear(count);
    await user.type(count, "2");
    expect(screen.getByRole("button", { name: "Copy generated JSON" })).toBeVisible();
    expect(JSON.parse(screen.getByRole<HTMLInputElement>("textbox", { name: "Generated JSON" }).value)).toHaveLength(2);
  });
});
