import type {
  PromptTemplateDefinition,
  PromptVariables,
  RenderedPrompt,
} from "@/ai-core/types/prompt.types";

/**
 * Contract for the central prompt management system — template
 * registration/versioning, validation, and variable-interpolated
 * rendering. Implemented by {@link PromptManager}.
 */
export interface IPromptManager {
  /**
   * Registers a new version of a prompt template. Registering a key
   * that already has versions adds a new version rather than replacing
   * history, so in-flight executions referencing an older version keep
   * working.
   *
   * @param definition - The full template definition, including its explicit version number.
   * @throws {PromptError} If a template with the same key and version already exists.
   */
  registerTemplate(definition: PromptTemplateDefinition): void;

  /**
   * Retrieves a specific template definition.
   *
   * @param key - The template's stable key.
   * @param version - A specific version to retrieve; when omitted, the latest registered version is returned.
   * @returns The matching template definition.
   * @throws {PromptError} If no template is registered under `key` (and `version`, if supplied).
   */
  getTemplate(key: string, version?: number): PromptTemplateDefinition;

  /**
   * Validates that `variables` satisfies a template's
   * {@link PromptTemplateDefinition.requiredVariables} before rendering.
   *
   * @param definition - The template to validate against.
   * @param variables - The candidate variable map.
   * @throws {PromptError} If any required variable is missing.
   */
  validateVariables(definition: PromptTemplateDefinition, variables: PromptVariables): void;

  /**
   * Renders a registered template against a variable map, interpolating
   * every `{{variable}}` placeholder in its content.
   *
   * @param key - The template's stable key.
   * @param variables - The values to interpolate into the template.
   * @param version - A specific version to render; when omitted, the latest registered version is used.
   * @returns The fully interpolated prompt, ready to send to a model provider.
   * @throws {PromptError} If the template is not found or required variables are missing.
   */
  render(key: string, variables: PromptVariables, version?: number): RenderedPrompt;

  /**
   * Lists every registered template key along with its available
   * version numbers, for admin/debug tooling.
   *
   * @returns A map of template key to the sorted list of registered version numbers.
   */
  listTemplates(): ReadonlyMap<string, readonly number[]>;
}
