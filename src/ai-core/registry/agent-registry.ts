import { AgentError } from "@/ai-core/errors/agent-error";
import type { IAgent } from "@/ai-core/interfaces/agent.interface";
import type { IAgentRegistry } from "@/ai-core/interfaces/registry.interface";
import type { ILogger } from "@/ai-core/interfaces/logger.interface";
import type { AgentDescriptor } from "@/ai-core/types/agent.types";
import type { Instantiator } from "@/ai-core/types/common.types";
import { defaultLogger } from "@/ai-core/utils/logger";

/**
 * Internal registration record. An agent may be registered as a
 * ready-to-use instance (`kind: "instance"`) or as a
 * constructor/factory for lazy instantiation on first access
 * (`kind: "lazy"`) — the Factory pattern applied to defer the cost of
 * constructing agents that may never be invoked in a given process
 * lifetime.
 */
type AgentRegistration =
  | { readonly kind: "instance"; readonly agent: IAgent }
  | { readonly kind: "lazy"; readonly instantiator: Instantiator<IAgent>; instance?: IAgent };

/**
 * Determines whether a given value is a class constructor (as opposed
 * to a zero-argument factory function) by inspecting its prototype
 * chain — constructors have a non-empty `prototype` with a
 * `constructor` back-reference, plain factory functions do not.
 *
 * Note: a plain (non-arrow) factory function also has a `.prototype`
 * property in JavaScript, so prototype presence alone cannot
 * distinguish a class constructor from a factory. Inspecting the
 * function's own source via `Function.prototype.toString` for the
 * `class` keyword is the reliable discriminator for ES6 classes (every
 * modern JS engine, including Node.js and edge runtimes, preserves this
 * in the stringified source). Callers registering plain-function
 * factories should still prefer arrow functions for clarity, but this
 * check is correct either way.
 *
 * @param value - The instantiator to inspect.
 * @returns `true` if `value` should be invoked with `new`.
 */
function isConstructor(value: Instantiator<IAgent>): value is new (...args: never[]) => IAgent {
  return typeof value === "function" && /^class[\s{]/.test(Function.prototype.toString.call(value));
}

/**
 * Instantiates an {@link Instantiator}, dispatching to `new` for class
 * constructors and a plain call for factory functions.
 *
 * @param instantiator - The constructor or factory to instantiate.
 * @returns The constructed agent instance.
 */
function instantiate(instantiator: Instantiator<IAgent>): IAgent {
  if (isConstructor(instantiator)) {
    return new instantiator();
  }
  return instantiator();
}

/**
 * Central, fully-working implementation of {@link IAgentRegistry}.
 * Implements the Singleton pattern (see {@link AgentRegistry.getInstance})
 * so every part of GrowPilot resolves agents through one shared catalog,
 * while still allowing isolated instances to be constructed directly
 * for testing. Supports both eager instance registration and lazy
 * registration via a constructor/factory, instantiating lazily-registered
 * agents only on first {@link AgentRegistry.getAgent} call and caching
 * the result for subsequent lookups.
 */
export class AgentRegistry implements IAgentRegistry {
  private static instance: AgentRegistry | undefined;

  private readonly agents = new Map<string, AgentRegistration>();
  private readonly logger: ILogger;

  /**
   * @param logger - Logger used for registration-lifecycle diagnostics.
   */
  constructor(logger: ILogger = defaultLogger) {
    this.logger = logger.child({ component: "AgentRegistry" });
  }

  /**
   * Returns the process-wide singleton `AgentRegistry` instance,
   * creating it on first access. Use this for the shared, production
   * agent catalog; construct `new AgentRegistry()` directly in tests
   * that need isolation from other suites.
   *
   * @returns The shared singleton instance.
   */
  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  /**
   * Resets the process-wide singleton, forcing the next
   * {@link AgentRegistry.getInstance} call to create a fresh instance.
   * Intended for test teardown only.
   */
  public static resetInstance(): void {
    AgentRegistry.instance = undefined;
  }

  /** @inheritdoc */
  public registerAgent(agentId: string, instantiator: IAgent | Instantiator<IAgent>): void {
    if (this.agents.has(agentId)) {
      throw new AgentError(`Agent "${agentId}" is already registered`, agentId);
    }

    const isReadyInstance = typeof instantiator === "object";

    this.agents.set(
      agentId,
      isReadyInstance
        ? { kind: "instance", agent: instantiator }
        : { kind: "lazy", instantiator },
    );

    this.logger.debug("Agent registered", {
      agentId,
      lazy: !isReadyInstance,
    });
  }

  /** @inheritdoc */
  public unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.logger.debug("Agent unregistered", { agentId });
  }

  /** @inheritdoc */
  public getAgent(agentId: string): IAgent {
    const registration = this.agents.get(agentId);

    if (!registration) {
      throw AgentError.notFound(agentId);
    }

    if (registration.kind === "instance") {
      return registration.agent;
    }

    if (!registration.instance) {
      this.logger.debug("Lazily instantiating agent on first access", { agentId });
      registration.instance = instantiate(registration.instantiator);
    }

    return registration.instance;
  }

  /** @inheritdoc */
  public listAgents(): readonly AgentDescriptor[] {
    const descriptors: AgentDescriptor[] = [];

    for (const registration of this.agents.values()) {
      if (registration.kind === "instance") {
        descriptors.push(registration.agent.descriptor);
      } else if (registration.instance) {
        // Already resolved lazily — safe to introspect without side effects.
        descriptors.push(registration.instance.descriptor);
      }
      // Note: unresolved lazy registrations are intentionally excluded
      // here, since introspecting a descriptor would otherwise force
      // instantiation of agents that may never actually be invoked.
    }

    return descriptors;
  }

  /** @inheritdoc */
  public hasAgent(agentId: string): boolean {
    return this.agents.has(agentId);
  }
}
