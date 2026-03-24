export interface HistoryCommand<TState> {
  id: string;
  description: string;
  run(state: TState): TState;
  canMerge?(next: HistoryCommand<TState>): boolean;
  merge?(next: HistoryCommand<TState>): HistoryCommand<TState>;
}

export interface HistoryEntry<TState> {
  command: HistoryCommand<TState>;
  before: TState;
  after: TState;
}

export interface CommandFactoryInput<TState> {
  id: string;
  description: string;
  run(state: TState): TState;
  canMerge?(next: HistoryCommand<TState>): boolean;
  merge?(next: HistoryCommand<TState>): HistoryCommand<TState>;
}

export function createHistoryCommand<TState>(
  input: CommandFactoryInput<TState>
): HistoryCommand<TState> {
  return {
    id: input.id,
    description: input.description,
    run: input.run,
    ...(input.canMerge ? { canMerge: input.canMerge } : {}),
    ...(input.merge ? { merge: input.merge } : {})
  };
}

export function createMacroCommand<TState>(
  description: string,
  commands: Array<HistoryCommand<TState>>,
  id = "command.macro"
): HistoryCommand<TState> {
  return createHistoryCommand({
    id,
    description,
    run: (state) => commands.reduce((currentState, command) => command.run(currentState), state)
  });
}

export class CommandHistory<TState> {
  private readonly pastEntries: HistoryEntry<TState>[] = [];
  private readonly futureEntries: HistoryEntry<TState>[] = [];

  constructor(private presentState: TState) {}

  get state(): TState {
    return this.presentState;
  }

  get canUndo(): boolean {
    return this.pastEntries.length > 0;
  }

  get canRedo(): boolean {
    return this.futureEntries.length > 0;
  }

  get past(): ReadonlyArray<HistoryEntry<TState>> {
    return this.pastEntries;
  }

  get future(): ReadonlyArray<HistoryEntry<TState>> {
    return this.futureEntries;
  }

  execute(command: HistoryCommand<TState>): TState {
    const lastEntry = this.pastEntries.at(-1);

    if (
      lastEntry &&
      typeof lastEntry.command.canMerge === "function" &&
      lastEntry.command.canMerge(command) &&
      typeof lastEntry.command.merge === "function"
    ) {
      const mergedCommand = lastEntry.command.merge(command);
      const mergedAfter = mergedCommand.run(lastEntry.before);
      lastEntry.command = mergedCommand;
      lastEntry.after = mergedAfter;
      this.presentState = mergedAfter;
      this.futureEntries.length = 0;
      return this.presentState;
    }

    const before = this.presentState;
    const after = command.run(before);

    this.pastEntries.push({
      command,
      before,
      after
    });
    this.presentState = after;
    this.futureEntries.length = 0;

    return this.presentState;
  }

  undo(): TState {
    const entry = this.pastEntries.pop();

    if (!entry) {
      return this.presentState;
    }

    this.futureEntries.push(entry);
    this.presentState = entry.before;
    return this.presentState;
  }

  redo(): TState {
    const entry = this.futureEntries.pop();

    if (!entry) {
      return this.presentState;
    }

    this.pastEntries.push(entry);
    this.presentState = entry.after;
    return this.presentState;
  }
}
