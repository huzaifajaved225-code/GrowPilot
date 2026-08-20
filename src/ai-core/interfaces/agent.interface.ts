import type { AgentDescriptor, AgentInput, AgentOutput } from "@/ai-core/types/agent.types";
import type { IExecutionContext } from "@/ai-core/interfaces/pipeline.interface";

/**
 * The contract every executable agent must satisfy. Implemented by
 * {@link BaseAgent}; concrete agents extend `BaseAgent` rather than
 * implementing this interface directly, but the {@link AgentRegistry}
 * and {@link ExecutionPipeline} depend on this interface so any
 * conforming implementation can be registered and executed.
 *
 * @typeParam TPayload - The shape of this agent's input payload.
 * @typeParam TResult - The shape of this agent's result payload.
 */
export interface IAgent<TPayload = unknown, TResult = unknown> {
  /** Static identity metadata for this agent. */
  readonly descriptor: AgentDescriptor;

  /**
   * Validates the incoming input before any work begins. Should throw a
   * {@link ValidationError} (or subclass) on failure; must not mutate
   * shared state.
   *
   * @param input - The raw input for this execution.
   * @param context - The shared execution context (memory, tools, logger).
   */
  validate(input: AgentInput<TPayload>, context: IExecutionContext): Promise<void>;

  /**
   * Prepares everything the agent needs to run: loading memory,
   * rendering prompts, resolving configuration. Runs after `validate`
   * and before `run`.
   *
   * @param input - The raw input for this execution.
   * @param context - The shared execution context (memory, tools, logger).
   */
  prepare(input: AgentInput<TPayload>, context: IExecutionContext): Promise<void>;

  /**
   * Executes the agent's core logic and produces a result. Runs after
   * `prepare` and before `finalize`.
   *
   * @param input - The raw input for this execution.
   * @param context - The shared execution context (memory, tools, logger).
   * @returns The agent-specific result payload.
   */
  run(input: AgentInput<TPayload>, context: IExecutionContext): Promise<TResult>;

  /**
   * Performs any cleanup/persistence after `run` completes successfully
   * (e.g. writing to memory, emitting metrics). Not invoked if `run`
   * throws.
   *
   * @param input - The raw input for this execution.
   * @param result - The result produced by `run`.
   * @param context - The shared execution context (memory, tools, logger).
   */
  finalize(input: AgentInput<TPayload>, result: TResult, context: IExecutionContext): Promise<void>;

  /**
   * Orchestrates the full lifecycle (`validate` -> `prepare` -> `run` ->
   * `finalize`) for a single execution and returns the complete
   * {@link AgentOutput}. This is the single method the
   * {@link ExecutionPipeline} calls; individual lifecycle methods are
   * exposed separately so subclasses can override just one phase.
   *
   * @param input - The raw input for this execution.
   * @param context - The shared execution context (memory, tools, logger).
   * @returns The full execution output, including timing and audit metadata.
   */
  execute(input: AgentInput<TPayload>, context: IExecutionContext): Promise<AgentOutput<TResult>>;
}
