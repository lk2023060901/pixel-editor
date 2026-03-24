import { describe, expect, it } from "vitest";

import { CommandHistory, createHistoryCommand, createMacroCommand } from "./index";

describe("CommandHistory", () => {
  it("supports execute, undo, and redo", () => {
    const history = new CommandHistory({ count: 0 });

    history.execute(
      createHistoryCommand({
        id: "count.increment",
        description: "Increment count",
        run: (state) => ({ count: state.count + 1 })
      })
    );

    expect(history.state.count).toBe(1);

    history.undo();
    expect(history.state.count).toBe(0);

    history.redo();
    expect(history.state.count).toBe(1);
  });

  it("merges compatible commands into one history entry", () => {
    const history = new CommandHistory({ tool: "stamp" });

    const createSetToolCommand = (tool: string) =>
      createHistoryCommand({
        id: "tool.set",
        description: `Set tool ${tool}`,
        run: () => ({ tool }),
        canMerge: (next) => next.id === "tool.set",
        merge: (next) => next
      });

    history.execute(createSetToolCommand("stamp"));
    history.execute(createSetToolCommand("eraser"));

    expect(history.past).toHaveLength(1);
    expect(history.state.tool).toBe("eraser");
  });

  it("runs macro commands as one history entry", () => {
    const history = new CommandHistory({ count: 0 });

    history.execute(
      createMacroCommand("Increment twice", [
        createHistoryCommand({
          id: "count.increment",
          description: "Increment count",
          run: (state) => ({ count: state.count + 1 })
        }),
        createHistoryCommand({
          id: "count.increment",
          description: "Increment count",
          run: (state) => ({ count: state.count + 1 })
        })
      ])
    );

    expect(history.state.count).toBe(2);
    expect(history.past).toHaveLength(1);
  });
});
