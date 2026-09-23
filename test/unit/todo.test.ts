import { describe, expect, it } from "vitest";
import { resetTodos, todo, todos } from "@/content/todo";

// Own file on purpose: resetTodos() clears the process-wide registry that the
// guard tests read after importing the content modules.
describe("todo() collector (6A)", () => {
  it("returns the value and registers the label once", () => {
    resetTodos();
    expect(todo("a", "x")).toBe("x");
    expect(todo("a", "y")).toBe("y");
    expect(todo("b", ["p", "q"])).toEqual(["p", "q"]);
    expect(todos()).toEqual([
      { label: "a", value: "x" },
      { label: "b", value: "p / q" },
    ]);
  });
});
