import type { IAgent } from "@/ai-core/interfaces/agent.interface";
import type { AgentDescriptor } from "@/ai-core/types/agent.types";
import type { Instantiator } from "@/ai-core/types/common.types";

/**
 * Contract for the central agent registry — supports both eager
 * (instance) and lazy (constructor/factory) registration, retrieval,
 * and introspection. Implemented by {@link AgentRegistry}, which is
 * itself a process-wide singleton (see {@link AgentRegistry.getInstance}).
 */
export interface IAgentRegistry {
  /**
   * Registers an agent under a given id, either as a ready-to-use
   * instance or as a constructor/factory for lazy instantiation on
   * first use.
   *
   * @param agentId - The stable identifier to register the agent under.
   * @param instantiator - A concrete agent instance, a class constructor, or a factory function producing one.
   * @throws {AgentError} If an agent is already registered under `agentId`.
   */
  registerAgent(agentId: string, instantiator: IAgent | Instantiator<IAgent>): void;

  /**
   * Removes a previously registered agent, discarding any cached
   * lazily-instantiated instance.
   *
   * @param agentId - The identifier of the agent to remove.
   */
  unregisterAgent(agentId: string): void;

  /**
   * Retrieves an agent by id, lazily instantiating it on first access
   * if it was registered as a constructor/factory.
   *
   * @param agentId - The identifier of the agent to retrieve.
   * @returns The resolved agent instance.
   * @throws {AgentError} If no agent is registered under `agentId`.
   */
  getAgent(agentId: string): IAgent;

  /**
   * Lists identity metadata for every registered agent, without forcing
   * lazy instantiation of any that haven't been resolved yet.
   *
   * @returns Descriptors for all currently registered agents.
   */
  listAgents(): readonly AgentDescriptor[];

  /**
   * Determines whether an agent is currently registered under `agentId`.
   *
   * @param agentId - The identifier to check.
   * @returns `true` if an agent is registered under that id.
   */
  hasAgent(agentId: string): boolean;
}
