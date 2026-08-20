import type { ToolDescriptor, ToolInput, ToolOutput } from "@/ai-core/types/tool.types";

/**
 * The contract every executable tool must satisfy. Implemented by
 * {@link BaseTool}; concrete tools extend `BaseTool` rather than
 * implementing this interface directly. The {@link ToolRegistry}
 * depends on this interface for registration and invocation.
 *
 * @typeParam TInput - The shape of this tool's input payload.
 * @typeParam TOutput - The shape of this tool's output payload.
 */
export interface ITool<TInput = unknown, TOutput = unknown> {
  /** Static identity metadata for this tool. */
  readonly descriptor: ToolDescriptor;

  /**
   * Validates the tool's input payload before execution. Should throw a
   * {@link ValidationError} on failure.
   *
   * @param input - The raw input payload for this invocation.
   */
  validateInput(input: TInput): Promise<void>;

  /**
   * Validates the tool's output payload after execution, before it is
   * returned to the caller. Should throw a {@link ValidationError} on
   * failure.
   *
   * @param output - The output payload produced by `execute`.
   */
  validateOutput(output: TOutput): Promise<void>;

  /**
   * Executes the tool's core logic. Invoked by the {@link ToolRegistry}
   * only after `validateInput` succeeds, and its result is passed
   * through `validateOutput` before being returned to the caller.
   *
   * @param input - The raw input payload for this invocation.
   * @returns The tool-specific output payload.
   */
  execute(input: TInput): Promise<TOutput>;
}

/**
 * Contract for the central tool registry — supports registration,
 * discovery, and governed invocation (permission checks, input/output
 * validation, timeout, and retry handling applied uniformly regardless
 * of which tool is being called).
 */
export interface IToolRegistry {
  /**
   * Registers a tool instance under its own {@link ToolDescriptor.id}.
   *
   * @param tool - The tool instance to register.
   * @throws {ToolError} If a tool is already registered under the same id.
   */
  registerTool(tool: ITool): void;

  /**
   * Removes a previously registered tool.
   *
   * @param toolId - The identifier of the tool to remove.
   */
  unregisterTool(toolId: string): void;

  /**
   * Retrieves a registered tool by id.
   *
   * @param toolId - The identifier of the tool to retrieve.
   * @returns The registered tool instance.
   * @throws {ToolError} If no tool is registered under `toolId`.
   */
  getTool(toolId: string): ITool;

  /**
   * Lists identity metadata for every registered tool.
   *
   * @returns Descriptors for all currently registered tools.
   */
  listTools(): readonly ToolDescriptor[];

  /**
   * Invokes a registered tool with full governance: permission checking,
   * input validation, timeout enforcement, retry handling, and output
   * validation.
   *
   * @typeParam TInput - The shape of the tool's input payload.
   * @typeParam TOutput - The shape of the tool's output payload.
   * @param input - The governed tool input, including permission context.
   * @returns The validated tool output, wrapped with execution metadata.
   * @throws {ToolError} On not-found, permission-denied, timeout, or retry exhaustion.
   * @throws {ValidationError} On input or output schema validation failure.
   */
  invoke<TInput, TOutput>(input: ToolInput<TInput>): Promise<ToolOutput<TOutput>>;
}
