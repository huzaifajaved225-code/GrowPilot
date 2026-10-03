import type { ITool } from "@/ai-core/interfaces/tool.interface";
import type { ToolDescriptor } from "@/ai-core/types/tool.types";

/**
 * Abstract base class every concrete tool must extend. Implements the
 * Template Method pattern: `validateInput`/`validateOutput` provide
 * permissive no-op defaults so simple tools can skip boilerplate, while
 * tools that need strict schema checks (typically via Zod) override
 * them — the {@link ToolRegistry} always calls `validateInput` before
 * `execute` and `validateOutput` after, regardless of which hooks a
 * given subclass overrides.
 *
 * @typeParam TInput - The shape of this tool's input payload.
 * @typeParam TOutput - The shape of this tool's output payload.
 *
 * @example
 * ```ts
 * interface KeywordLookupInput { readonly keyword: string }
 * interface KeywordLookupOutput { readonly searchVolume: number }
 *
 * class KeywordLookupTool extends BaseTool<KeywordLookupInput, KeywordLookupOutput> {
 *   public readonly descriptor: ToolDescriptor = {
 *     id: "keyword-lookup" as ToolId,
 *     name: "Keyword Lookup",
 *     description: "Looks up search volume for a keyword",
 *     version: "1.0.0",
 *     requiredPermissions: ["seo:read"],
 *   };
 *
 *   public async execute(input: KeywordLookupInput): Promise<KeywordLookupOutput> {
 *     const searchVolume = await fetchSearchVolume(input.keyword);
 *     return { searchVolume };
 *   }
 * }
 * ```
 */
export abstract class BaseTool<TInput = unknown, TOutput = unknown> implements ITool<
  TInput,
  TOutput
> {
  /** Static identity metadata for this tool. Every concrete tool must define its own. */
  public abstract readonly descriptor: ToolDescriptor;

  /**
   * Validates the tool's input payload before execution. Default
   * implementation is a permissive no-op; override to enforce a schema
   * (typically via a Zod `parse` call that throws a
   * {@link ValidationError} on failure).
   *
   * @param _input - The raw input payload for this invocation.
   */
  public async validateInput(_input: TInput): Promise<void> {
    // Intentionally permissive by default — subclasses override to enforce a schema.
  }

  /**
   * Validates the tool's output payload after execution. Default
   * implementation is a permissive no-op; override to enforce a schema.
   *
   * @param _output - The output payload produced by `execute`.
   */
  public async validateOutput(_output: TOutput): Promise<void> {
    // Intentionally permissive by default — subclasses override to enforce a schema.
  }

  /**
   * Executes the tool's core logic. Every concrete tool must implement
   * this method; it is invoked by the {@link ToolRegistry} only after
   * `validateInput` succeeds, and its result is passed through
   * `validateOutput` before being returned to the caller.
   *
   * @param input - The raw input payload for this invocation.
   * @returns The tool-specific output payload.
   */
  public abstract execute(input: TInput): Promise<TOutput>;
}
