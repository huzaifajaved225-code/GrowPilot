import type { Metadata, ToolId } from "@/ai-core/types/common.types";

/**
 * Identity metadata describing a registered tool, independent of any
 * single invocation. Returned by {@link IToolRegistry.listTools} for
 * introspection and for building agent-facing tool catalogs.
 */
export interface ToolDescriptor {
  readonly id: ToolId;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  /** Permission scopes required to invoke this tool (e.g. ["gbp:write"]). */
  readonly requiredPermissions: readonly string[];
}

/**
 * Configuration governing how a tool invocation is executed by the
 * {@link ToolRegistry} — independent of the tool's own business logic.
 */
export interface ToolExecutionConfig {
  /** Maximum wall-clock time (ms) a single invocation may take. */
  readonly timeoutMs: number;
  /** Number of automatic retries on transient (non-validation) failure. */
  readonly maxRetries: number;
  /** Base delay (ms) for exponential backoff between retries. */
  readonly retryBackoffMs: number;
}

/**
 * The permission scopes granted to the caller of a tool. Checked by the
 * {@link ToolRegistry} against a tool's {@link ToolDescriptor.requiredPermissions}
 * before invocation is allowed to proceed.
 */
export interface ToolPermissionContext {
  readonly grantedPermissions: readonly string[];
}

/**
 * The input payload handed to a tool for a single invocation.
 *
 * @typeParam TInput - The shape of the tool-specific input payload.
 */
export interface ToolInput<TInput = Metadata> {
  readonly toolId: ToolId;
  readonly payload: TInput;
  readonly permissionContext: ToolPermissionContext;
  readonly metadata: Metadata;
}

/**
 * The output payload returned by a successful tool invocation.
 *
 * @typeParam TOutput - The shape of the tool-specific output payload.
 */
export interface ToolOutput<TOutput = Metadata> {
  readonly toolId: ToolId;
  readonly result: TOutput;
  readonly durationMs: number;
  readonly retryCount: number;
  readonly metadata: Metadata;
}
