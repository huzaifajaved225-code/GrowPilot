import type { Metadata } from "@/ai-core/types/common.types";

/**
 * The conversational role a single prompt message is authored as,
 * mirroring the roles accepted by modern chat-completion LLM APIs.
 */
export enum PromptRole {
  SYSTEM = "system",
  USER = "user",
  ASSISTANT = "assistant",
}

/**
 * The variable substitution map supplied when rendering a
 * {@link PromptTemplateDefinition}. Keys correspond to `{{variable}}`
 * placeholders inside the template's `content` string.
 */
export type PromptVariables = Record<string, string | number | boolean>;

/**
 * A single, addressable version of a prompt template. Templates are
 * versioned so that in-flight executions keep referencing the exact
 * wording they started with even if a newer version is published mid
 * rollout, and so results remain reproducible for audits.
 */
export interface PromptTemplateDefinition {
  /** Stable identifier shared across all versions (e.g. "seo-audit-system"). */
  readonly key: string;
  /** Monotonically increasing version number for this key. */
  readonly version: number;
  /** The role this template renders under. */
  readonly role: PromptRole;
  /** Raw template content containing `{{variable}}` placeholders. */
  readonly content: string;
  /** Names of variables this template requires to render successfully. */
  readonly requiredVariables: readonly string[];
  /** ISO-8601 timestamp of when this version was authored. */
  readonly createdAt: string;
  /** Free-form metadata (author, changelog note, experiment tag). */
  readonly metadata: Metadata;
}

/**
 * The result of rendering a {@link PromptTemplateDefinition} against a
 * concrete {@link PromptVariables} map — fully interpolated text ready
 * to send to a model provider.
 */
export interface RenderedPrompt {
  /** The template key that was rendered. */
  readonly templateKey: string;
  /** The template version that was rendered. */
  readonly templateVersion: number;
  /** The role this rendered prompt should be sent under. */
  readonly role: PromptRole;
  /** Fully interpolated prompt text. */
  readonly content: string;
  /** The variables that were interpolated, for audit/debugging. */
  readonly variables: PromptVariables;
}
