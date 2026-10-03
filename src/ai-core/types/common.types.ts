/**
 * Common, cross-cutting types shared across every module in the AI Core
 * Engine. These are intentionally framework-agnostic — no dependency on
 * any specific agent, tool, or memory implementation lives here.
 */

/**
 * A JSON-serializable value. Used anywhere a payload must be guaranteed
 * safe to persist (memory adapters, logs, tool I/O) or transmit over the
 * wire without losing information.
 */
export type JSONValue =
  string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

/**
 * Free-form structured metadata attached to requests, results, agents,
 * tools, and memory records. Kept as `Record<string, JSONValue>` rather
 * than `Record<string, any>` so every value stored here remains
 * serializable and type-checked.
 */
export type Metadata = Record<string, JSONValue>;

/**
 * Discriminated-union result type used everywhere a fallible operation
 * crosses a module boundary (agent execution, tool execution, memory
 * reads/writes, prompt rendering). Prefer this over throwing across
 * layer boundaries — throw only for truly exceptional, unrecoverable
 * conditions; use `Result` for expected failure modes.
 *
 * @typeParam T - The shape of the successful payload.
 * @typeParam E - The error type on failure. Defaults to `Error`.
 */
export type Result<T, E = Error> =
  { readonly success: true; readonly data: T } | { readonly success: false; readonly error: E };

/**
 * Constructs a successful {@link Result}.
 *
 * @typeParam T - The shape of the successful payload.
 * @param data - The payload to wrap.
 * @returns A `Result` in the success state carrying `data`.
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Constructs a failed {@link Result}.
 *
 * @typeParam E - The error type. Defaults to `Error`.
 * @param error - The error to wrap.
 * @returns A `Result` in the failure state carrying `error`.
 */
export function fail<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Recursively makes every property of `T` optional. Useful for partial
 * configuration overrides (e.g. merging user-supplied agent config with
 * defaults) without losing type safety on nested objects.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepPartial<U>>
      : T[P] extends (...args: unknown[]) => unknown
        ? T[P]
        : T[P] extends object
          ? DeepPartial<T[P]>
          : T[P];
};

/**
 * Recursively makes every property of `T` readonly. Used to expose
 * internal state (execution context, configuration) to consumers
 * without allowing accidental mutation.
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? ReadonlyArray<DeepReadonly<U>>
    : T[P] extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepReadonly<U>>
      : T[P] extends (...args: unknown[]) => unknown
        ? T[P]
        : T[P] extends object
          ? DeepReadonly<T[P]>
          : T[P];
};

/**
 * A constructor type — used by the {@link AgentRegistry} and
 * {@link ToolRegistry} to accept classes (not instances) for lazy
 * instantiation.
 *
 * @typeParam T - The instance type produced by the constructor.
 */
export type Constructor<T> = new (...args: never[]) => T;

/**
 * A factory function type — an alternative to {@link Constructor} for
 * registries that need custom instantiation logic (e.g. dependency
 * injection of a specific config object).
 *
 * @typeParam T - The instance type produced by the factory.
 */
export type Factory<T> = () => T;

/**
 * Represents either a constructor or a factory function — accepted
 * interchangeably wherever a registry needs to lazily produce an
 * instance of `T`.
 *
 * @typeParam T - The instance type produced.
 */
export type Instantiator<T> = Constructor<T> | Factory<T>;

/**
 * Branded string type used for identifiers, preventing accidental
 * cross-assignment between unrelated ID spaces (e.g. an `AgentId`
 * cannot be passed where a `SessionId` is expected) while remaining a
 * plain string at runtime.
 *
 * @typeParam Brand - A unique string literal tag for the ID space.
 */
export type Id<Brand extends string> = string & { readonly __brand: Brand };

/** Unique identifier for an agent registration. */
export type AgentId = Id<"AgentId">;

/** Unique identifier for a tool registration. */
export type ToolId = Id<"ToolId">;

/** Unique identifier for a single execution request. */
export type RequestId = Id<"RequestId">;

/** Unique identifier for a user session. */
export type SessionId = Id<"SessionId">;

/** Unique identifier for a conversation thread. */
export type ConversationId = Id<"ConversationId">;

/** Unique identifier for a platform user. */
export type UserId = Id<"UserId">;

/** Unique identifier for a tenant organization. */
export type OrganizationId = Id<"OrganizationId">;
