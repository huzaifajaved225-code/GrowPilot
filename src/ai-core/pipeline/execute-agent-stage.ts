import type { IAgent } from "@/ai-core/interfaces/agent.interface";
import type { IExecutionContext, IPipelineStage } from "@/ai-core/interfaces/pipeline.interface";
import type { IAgentRegistry } from "@/ai-core/interfaces/registry.interface";
import type { PipelinePayload } from "@/ai-core/pipeline/pipeline-payload";
import { PipelineStageName } from "@/ai-core/types/pipeline.types";

/**
 * Sixth stage of the {@link ExecutionPipeline}: `EXECUTE_AGENT`.
 * Resolves the target agent from the {@link IAgentRegistry} (injected
 * via constructor — Dependency Injection, so this stage never reaches
 * for a global singleton directly) and drives its complete
 * `validate -> prepare -> run -> finalize` lifecycle via
 * {@link IAgent.execute}. This is the one stage where the bulk of an
 * agent's own tool calls and prompt rendering typically happen, inside
 * the agent's own `run()` implementation using the same shared
 * `context` this stage receives.
 *
 * @typeParam TPayload - The shape of the target agent's input payload.
 * @typeParam TResult - The shape of the target agent's result payload.
 */
export class ExecuteAgentStage<TPayload, TResult> implements IPipelineStage<
  PipelinePayload<TPayload, TResult>,
  PipelinePayload<TPayload, TResult>
> {
  /** @inheritdoc */
  public readonly name = PipelineStageName.EXECUTE_AGENT;

  /**
   * @param agentRegistry - The registry this stage resolves the target agent from.
   */
  constructor(private readonly agentRegistry: IAgentRegistry) {}

  /**
   * Resolves and executes the target agent, attaching its output to the
   * pipeline payload.
   *
   * @param input - The pipeline payload produced by {@link RenderPromptStage}.
   * @param context - The shared, request-scoped execution context.
   * @returns The payload with `result` populated from the agent's output.
   * @throws {AgentError} If the agent is not registered or its execution fails.
   * @throws {ValidationError} If the agent's own `validate()` hook rejects the input.
   */
  public async execute(
    input: PipelinePayload<TPayload, TResult>,
    context: IExecutionContext,
  ): Promise<PipelinePayload<TPayload, TResult>> {
    const agent = this.agentRegistry.getAgent(input.agentId) as IAgent<TPayload, TResult>;

    context.logger.info("Executing agent", {
      agentId: input.agentId,
      agentVersion: agent.descriptor.version,
    });

    const result = await agent.execute(input.input, context);

    return { ...input, result };
  }
}
