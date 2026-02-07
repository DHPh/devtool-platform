// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React, { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ColorDisplay } from "@/lib/tools/color-studio/components/ColorDisplay";
import { ColorPicker } from "@/lib/tools/color-studio/components/ColorPicker";
import { getColorInfo } from "@/lib/utils/color";

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverStub);
afterEach(cleanup);

describe("Color Studio CSS Color 4 integration", () => {
  it("accepts modern color syntax and keeps the native picker on mapped HEX", () => {
    const onChange = vi.fn();
    const { container } = render(<ColorPicker value="oklch(62% .18 245 / .4)" onChange={onChange} />);

    const textInput = screen.getByLabelText("Color Value");
    expect(textInput).toHaveValue("oklch(62% .18 245 / .4)");
    expect(container.querySelector('input[type="color"]')).toHaveValue(getColorInfo("oklch(62% .18 245 / .4)")!.hex.toLowerCase());
    expect(screen.getByText(/^sRGB:/)).toBeInTheDocument();
    expect(screen.getByText(/^Display-P3:/)).toBeInTheDocument();

    fireEvent.change(textInput, { target: { value: "color(display-p3 1 0 0 / .5)" } });
    expect(onChange).toHaveBeenLastCalledWith("color(display-p3 1 0 0 / .5)");
  });

  it("offers OKLCH editing without removing legacy slider spaces", () => {
    render(<ColorPicker value="#336699" onChange={vi.fn()} />);

    expect(screen.getByRole("tab", { name: "HSL" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "RGB" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "HSV" })).toBeInTheDocument();
    const oklchTab = screen.getByRole("tab", { name: "OKLCH" });
    fireEvent.mouseDown(oklchTab, { button: 0, ctrlKey: false });
    expect(screen.getByText("Chroma")).toBeInTheDocument();
    expect(screen.getByText(/Chroma boundaries depend/)).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  it.each(["HSL", "RGB", "HSV"])("preserves alpha while editing %s controls", tab => {
    function Harness() {
      const [value, setValue] = useState("#33669980");
      return <ColorPicker value={value} onChange={setValue} showPresets={false} />;
    }
    render(<Harness />);
    if (tab !== "HSL") {
      fireEvent.mouseDown(screen.getByRole("tab", { name: tab }), { button: 0, ctrlKey: false });
    }
    fireEvent.keyDown(screen.getAllByRole("slider")[0], { key: "ArrowRight" });
    expect(getColorInfo((screen.getByLabelText("Color Value") as HTMLInputElement).value)?.alpha).toBeCloseTo(0x80 / 255, 5);
  });

  it("keeps alpha separate when using the opaque native color input", () => {
    const onChange = vi.fn();
    const { container } = render(<ColorPicker value="#33669980" onChange={onChange} showPresets={false} />);
    const native = container.querySelector('input[type="color"]') as HTMLInputElement;
    expect(native.value).toBe("#336699");
    fireEvent.change(native, { target: { value: "#abcdef" } });
    expect(onChange).toHaveBeenCalled();
    const changedColor = onChange.mock.calls.at(-1)?.[0];
    expect(typeof changedColor).toBe("string");
    expect(getColorInfo(changedColor!)?.alpha).toBeCloseTo(0x80 / 255, 5);
  });

  it("shows alpha, Color 4 serializations, gamut status, and an explicit clipped preview", () => {
    const info = getColorInfo("color(display-p3 1 0 0 / .5)")!;
    render(<ColorDisplay color={info} />);

    expect(screen.getByText("Alpha:").parentElement).toHaveTextContent("50%");
    expect(screen.getByText("OKLCH")).toBeInTheDocument();
    expect(screen.getByText("OKLab")).toBeInTheDocument();
    expect(screen.getByText("Lab")).toBeInTheDocument();
    expect(screen.getByText("LCH")).toBeInTheDocument();
    expect(screen.getByText("HWB")).toBeInTheDocument();
    expect(screen.getByText("Display-P3")).toBeInTheDocument();
    expect(screen.getByText("sRGB clipped")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("explicitly clipped to sRGB");
    expect(screen.getByTestId("mapped-color-preview")).toHaveStyle({ backgroundColor: "rgb(255 0 0 / 0.5)" });
  });
});
