import type { Id } from "@/ai-core/types/common.types";

/**
 * Generates a cryptographically-random hex string of the requested byte
 * length, using the Web Crypto API (available in both the Node.js
 * `globalThis.crypto` and Edge runtimes, so this utility works
 * identically in either).
 *
 * @param byteLength - Number of random bytes to generate. Defaults to 16 (32 hex characters).
 * @returns A lowercase hexadecimal string of length `byteLength * 2`.
 */
function randomHex(byteLength = 16): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Generates a new branded identifier of the requested ID type, prefixed
 * for human readability in logs (e.g. `req_9f2a...`, `agt_1c44...`).
 *
 * @typeParam Brand - The string literal brand tag for the target ID type.
 * @param prefix - A short, human-readable prefix identifying the ID's kind.
 * @returns A new unique identifier branded as `Id<Brand>`.
 */
export function generateId<Brand extends string>(prefix: string): Id<Brand> {
  return `${prefix}_${randomHex(16)}` as Id<Brand>;
}

/**
 * Generates a new {@link RequestId} for a single pipeline execution.
 *
 * @returns A new unique request identifier.
 */
export function generateRequestId(): Id<"RequestId"> {
  return generateId<"RequestId">("req");
}

/**
 * Generates a new {@link SessionId} for a user session.
 *
 * @returns A new unique session identifier.
 */
export function generateSessionId(): Id<"SessionId"> {
  return generateId<"SessionId">("sess");
}

/**
 * Generates a new {@link ConversationId} for a conversation thread.
 *
 * @returns A new unique conversation identifier.
 */
export function generateConversationId(): Id<"ConversationId"> {
  return generateId<"ConversationId">("conv");
}
