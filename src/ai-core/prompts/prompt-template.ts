import { PromptError } from "@/ai-core/errors/prompt-error";
import type { PromptTemplateDefinition, PromptVariables } from "@/ai-core/types/prompt.types";
import { PROMPT_VARIABLE_PATTERN } from "@/ai-core/utils/constants";

/**
 * Determines which of a template's {@link PromptTemplateDefinition.requiredVariables}
 * are absent from the supplied variable map.
 *
 * @param definition - The template being validated against.
 * @param variables - The candidate variable map.
 * @returns The list of required variable names not present in `variables`.
 */
export function findMissingVariables(
  definition: PromptTemplateDefinition,
  variables: PromptVariables,
): readonly string[] {
  return definition.requiredVariables.filter(
    (variableName) => !Object.prototype.hasOwnProperty.call(variables, variableName),
  );
}

/**
 * Validates that `variables` satisfies every required variable declared
 * by `definition`.
 *
 * @param definition - The template to validate against.
 * @param variables - The candidate variable map.
 * @throws {PromptError} If any required variable is missing.
 */
export function validateTemplateVariables(
  definition: PromptTemplateDefinition,
  variables: PromptVariables,
): void {
  const missing = findMissingVariables(definition, variables);

  if (missing.length > 0) {
    throw PromptError.missingVariables(definition.key, missing);
  }
}

/**
 * Interpolates every `{{variableName}}` placeholder in `content` with
 * its corresponding value from `variables`. Placeholders whose name is
 * not present in `variables` are left untouched in the output (rather
 * than silently rendered as empty strings) — callers should validate
 * required variables via {@link validateTemplateVariables} *before*
 * calling this function so a missing variable is caught as an explicit
 * {@link PromptError} rather than surfacing as a literal `{{name}}` in
 * the final prompt sent to a model provider.
 *
 * @param content - The raw template string containing `{{variable}}` placeholders.
 * @param variables - The values to substitute into the template.
 * @returns The fully interpolated string.
 */
export function interpolateTemplate(content: string, variables: PromptVariables): string {
  return content.replace(PROMPT_VARIABLE_PATTERN, (match, variableName: string) => {
    if (!Object.prototype.hasOwnProperty.call(variables, variableName)) {
      return match;
    }
    return String(variables[variableName]);
  });
}

/**
 * Extracts every `{{variableName}}` placeholder referenced inside a
 * template's raw content, used by {@link PromptManager.registerTemplate}
 * to sanity-check that `requiredVariables` and the template body stay in
 * sync (catching typos in either at registration time rather than at
 * render time).
 *
 * @param content - The raw template string to scan.
 * @returns The set of distinct variable names referenced in `content`.
 */
export function extractReferencedVariables(content: string): ReadonlySet<string> {
  const referenced = new Set<string>();
  const pattern = new RegExp(PROMPT_VARIABLE_PATTERN);
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    const variableName = match[1];
    if (variableName) referenced.add(variableName);
  }

  return referenced;
}
