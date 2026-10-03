import { ValidationError } from "@/ai-core/errors/validation-error";
import type { IExecutionContext, IPipelineStage } from "@/ai-core/interfaces/pipeline.interface";
import type { PipelinePayload } from "@/ai-core/pipeline/pipeline-payload";
import { PipelineStageName } from "@/ai-core/types/pipeline.types";

/**
 * Second stage of the {@link ExecutionPipeline}: `VALIDATION`. Performs
 * engine-level structural validation common to every agent (identity
 * present, request id present, payload present) — deliberately shallow
 * and agent-agnostic, since deep, payload-shape-specific validation is
 * the target agent's own responsibility via `IAgent.validate()`,
 * invoked later inside {@link ExecuteAgentStage}. Catching malformed
 * requests here means a broken caller never reaches memory or prompt
 * subsystems in the first place.
 *
 * @typeParam TPayload - The shape of the target agent's input payload.
 * @typeParam TResult - The shape of the target agent's result payload.
 */
export class ValidationStage<TPayload, TResult> implements IPipelineStage<
  PipelinePayload<TPayload, TResult>,
  PipelinePayload<TPayload, TResult>
> {
  /** @inheritdoc */
  public readonly name = PipelineStageName.VALIDATION;

  /**
   * Verifies the pipeline payload is structurally well-formed.
   *
   * @param input - The pipeline payload produced by {@link InputStage}.
   * @param context - The shared, request-scoped execution context.
   * @returns The same payload, unmodified.
   * @throws {ValidationError} If the request id, identity, or payload is missing.
   */
  public async execute(
    input: PipelinePayload<TPayload, TResult>,
    context: IExecutionContext,
  ): Promise<PipelinePayload<TPayload, TResult>> {
    const issues: { path: readonly (string | number)[]; message: string }[] = [];

    if (!input.agentId) {
      issues.push({ path: ["agentId"], message: "agentId is required" });
    }
    if (!input.input.requestId) {
      issues.push({ path: ["requestId"], message: "requestId is required" });
    }
    if (!input.input.identity?.organizationId) {
      issues.push({ path: ["identity", "organizationId"], message: "organizationId is required" });
    }
    if (!input.input.identity?.userId) {
      issues.push({ path: ["identity", "userId"], message: "userId is required" });
    }
    if (!input.input.identity?.sessionId) {
      issues.push({ path: ["identity", "sessionId"], message: "sessionId is required" });
    }
    if (input.input.payload === undefined || input.input.payload === null) {
      issues.push({ path: ["payload"], message: "payload is required" });
    }

    if (issues.length > 0) {
      context.logger.warn("Pipeline request failed structural validation", {
        agentId: input.agentId,
        issueCount: issues.length,
      });
      throw new ValidationError("Request failed structural validation", issues);
    }

    return input;
  }
}
