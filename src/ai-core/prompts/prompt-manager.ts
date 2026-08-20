import { PromptError } from "@/ai-core/errors/prompt-error";
import type { IPromptManager } from "@/ai-core/interfaces/prompt.interface";
import {
  interpolateTemplate,
  validateTemplateVariables,
} from "@/ai-core/prompts/prompt-template";
import type {
  PromptTemplateDefinition,
  PromptVariables,
  RenderedPrompt,
} from "@/ai-core/types/prompt.types";

/**
 * Internal storage shape: every registered version of a template key,
 * keyed by version number, so {@link PromptManager.getTemplate} can
 * retrieve either a specific historical version or the latest one.
 */
type TemplateVersionMap = Map<number, PromptTemplateDefinition>;

/**
 * Central, fully-working implementation of {@link IPromptManager}.
 * Owns registration, versioning, validation, and rendering for every
 * prompt template used across GrowPilot's AI agents. Templates are
 * additive by version — registering `key` a second time adds a new
 * version rather than overwriting history, so an in-flight execution
 * that captured a specific version number in its audit trail can still
 * be re-rendered identically later.
 */
export class PromptManager implements IPromptManager {
  private readonly templates = new Map<string, TemplateVersionMap>();

  /** @inheritdoc */
  public registerTemplate(definition: PromptTemplateDefinition): void {
    const versions = this.templates.get(definition.key) ?? new Map<number, PromptTemplateDefinition>();

    if (versions.has(definition.version)) {
      throw new PromptError(
        `Prompt template "${definition.key}" already has a registered version ${definition.version}`,
        definition.key,
        { version: definition.version },
      );
    }

    versions.set(definition.version, definition);
    this.templates.set(definition.key, versions);
  }

  /** @inheritdoc */
  public getTemplate(key: string, version?: number): PromptTemplateDefinition {
    const versions = this.templates.get(key);

    if (!versions || versions.size === 0) {
      throw PromptError.notFound(key, version);
    }

    const resolvedVersion = version ?? this.latestVersion(versions);
    const definition = versions.get(resolvedVersion);

    if (!definition) {
      throw PromptError.notFound(key, version);
    }

    return definition;
  }

  /** @inheritdoc */
  public validateVariables(definition: PromptTemplateDefinition, variables: PromptVariables): void {
    validateTemplateVariables(definition, variables);
  }

  /** @inheritdoc */
  public render(key: string, variables: PromptVariables, version?: number): RenderedPrompt {
    const definition = this.getTemplate(key, version);

    this.validateVariables(definition, variables);

    return {
      templateKey: definition.key,
      templateVersion: definition.version,
      role: definition.role,
      content: interpolateTemplate(definition.content, variables),
      variables,
    };
  }

  /** @inheritdoc */
  public listTemplates(): ReadonlyMap<string, readonly number[]> {
    const summary = new Map<string, readonly number[]>();

    for (const [key, versions] of this.templates.entries()) {
      summary.set(key, [...versions.keys()].sort((a, b) => a - b));
    }

    return summary;
  }

  private latestVersion(versions: TemplateVersionMap): number {
    return Math.max(...versions.keys());
  }
}
