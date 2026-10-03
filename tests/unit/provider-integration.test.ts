import { describe, expect, it, vi, beforeEach } from "vitest";
import { ProviderManager } from "@/lib/ai/provider-manager";
import { ProviderError } from "@/lib/ai/provider-error";
import {
  providerId,
  type AIProviderRequest,
  type AIProviderResponse,
  type ProviderId,
} from "@/lib/ai/provider.types";
import type { IAIProvider } from "@/lib/ai/provider.interface";
import type { AIProviderConfig } from "@/lib/ai/provider-config";

/**
 * Creates a mock IAIProvider that resolves with the given response.
 */
function createMockProvider(
  id: ProviderId,
  response: AIProviderResponse,
  options: { available?: boolean; retryable?: boolean } = {},
): IAIProvider {
  return {
    id,
    name: "Mock " + id,
    isAvailable: () => options.available ?? true,
    generateText: vi.fn().mockImplementation(async (request: AIProviderRequest) => {
      if (request.signal?.aborted) {
        throw new ProviderError("Cancelled", id, { code: "PROVIDER_CANCELLED", retryable: false });
      }
      if (options.retryable) {
        throw ProviderError.unavailable(id);
      }
      return response;
    }),
  };
}

/**
 * Creates a mock IAIProvider that rejects with the given error.
 */
function createFailingProvider(id: ProviderId, error: ProviderError): IAIProvider {
  return {
    id,
    name: "Failing " + id,
    isAvailable: () => true,
    generateText: vi.fn().mockRejectedValue(error),
  };
}

/**
 * Creates a mock IAIProvider that is not available (no API key).
 */
function createUnavailableProvider(id: ProviderId): IAIProvider {
  return {
    id,
    name: "Unavailable " + id,
    isAvailable: () => false,
    generateText: vi.fn(),
  };
}

const MOCK_RESPONSE: AIProviderResponse = {
  text: "Hello from mock provider",
  model: "mock-model",
  usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
  metadata: { finishReason: "stop" },
};

const TEST_CONFIG: AIProviderConfig = Object.freeze({
  defaultProvider: providerId("mock-primary"),
  fallbackProviders: [providerId("mock-fallback")],
  requestTimeoutMs: 5000,
  maxRetriesPerProvider: 0,
  retryBackoffMs: 10,
  apiKeys: Object.freeze({}),
});

describe("ProviderManager", () => {
  beforeEach(() => {
    ProviderManager.resetInstance();
  });

  describe("successful generation", () => {
    it("returns a response from the primary provider", async () => {
      const primary = createMockProvider(providerId("mock-primary"), MOCK_RESPONSE);
      const fallback = createMockProvider(providerId("mock-fallback"), {
        text: "fallback response",
        model: "fallback-model",
        metadata: {},
      });

      const providers = new Map<ProviderId, IAIProvider>([
        [providerId("mock-primary"), primary],
        [providerId("mock-fallback"), fallback],
      ]);

      const manager = new ProviderManager({ config: TEST_CONFIG, providers });
      const result = await manager.generateText({
        model: "test-model",
        messages: [{ role: "user", content: "Hello" }],
      });

      expect(result.text).toBe("Hello from mock provider");
      expect(result.model).toBe("mock-model");
      expect(result.usage).toEqual({ promptTokens: 10, completionTokens: 20, totalTokens: 30 });
      expect(primary.generateText).toHaveBeenCalledOnce();
      expect(fallback.generateText).not.toHaveBeenCalled();
    });
  });

  describe("provider context injection", () => {
    it("is injectable into execution context via IAIProviderManager interface", () => {
      const primary = createMockProvider(providerId("mock-primary"), MOCK_RESPONSE);
      const providers = new Map<ProviderId, IAIProvider>([[providerId("mock-primary"), primary]]);

      const manager = new ProviderManager({ config: TEST_CONFIG, providers });

      // Verify ProviderManager satisfies IAIProviderManager structurally
      const managerAsInterface: {
        generateText(r: AIProviderRequest): Promise<AIProviderResponse>;
      } = manager;
      expect(typeof managerAsInterface.generateText).toBe("function");
    });
  });

  describe("fallback behavior", () => {
    it("falls back to the next provider when the primary fails", async () => {
      const fallbackResponse: AIProviderResponse = {
        text: "fallback response",
        model: "fallback-model",
        metadata: {},
      };

      const primary = createFailingProvider(
        providerId("mock-primary"),
        ProviderError.unavailable(providerId("mock-primary")),
      );
      const fallback = createMockProvider(providerId("mock-fallback"), fallbackResponse);

      const providers = new Map<ProviderId, IAIProvider>([
        [providerId("mock-primary"), primary],
        [providerId("mock-fallback"), fallback],
      ]);

      const manager = new ProviderManager({ config: TEST_CONFIG, providers });
      const result = await manager.generateText({
        model: "test-model",
        messages: [{ role: "user", content: "Hello" }],
      });

      expect(result.text).toBe("fallback response");
      expect(primary.generateText).toHaveBeenCalledOnce();
      expect(fallback.generateText).toHaveBeenCalledOnce();
    });

    it("skips unavailable providers in the chain", async () => {
      const fallbackResponse: AIProviderResponse = {
        text: "from fallback",
        model: "fallback-model",
        metadata: {},
      };

      const unavailable = createUnavailableProvider(providerId("mock-primary"));
      const fallback = createMockProvider(providerId("mock-fallback"), fallbackResponse);

      const providers = new Map<ProviderId, IAIProvider>([
        [providerId("mock-primary"), unavailable],
        [providerId("mock-fallback"), fallback],
      ]);

      const manager = new ProviderManager({ config: TEST_CONFIG, providers });
      const result = await manager.generateText({
        model: "test-model",
        messages: [{ role: "user", content: "Hello" }],
      });

      expect(result.text).toBe("from fallback");
      expect(unavailable.generateText).not.toHaveBeenCalled();
      expect(fallback.generateText).toHaveBeenCalledOnce();
    });

    it("throws allProvidersFailed when every provider fails", async () => {
      const primary = createFailingProvider(
        providerId("mock-primary"),
        ProviderError.unavailable(providerId("mock-primary")),
      );
      const fallback = createFailingProvider(
        providerId("mock-fallback"),
        ProviderError.unavailable(providerId("mock-fallback")),
      );

      const providers = new Map<ProviderId, IAIProvider>([
        [providerId("mock-primary"), primary],
        [providerId("mock-fallback"), fallback],
      ]);

      const manager = new ProviderManager({ config: TEST_CONFIG, providers });

      await expect(
        manager.generateText({
          model: "test-model",
          messages: [{ role: "user", content: "Hello" }],
        }),
      ).rejects.toThrow(/All AI providers failed/);
    });
  });

  describe("timeout behavior", () => {
    it("throws ProviderError when a provider exceeds the timeout", async () => {
      const slowProvider: IAIProvider = {
        id: providerId("mock-primary"),
        name: "Slow",
        isAvailable: () => true,
        generateText: vi
          .fn()
          .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 10_000))),
      };

      const providers = new Map<ProviderId, IAIProvider>([
        [providerId("mock-primary"), slowProvider],
      ]);

      const fastConfig: AIProviderConfig = {
        ...TEST_CONFIG,
        requestTimeoutMs: 50,
        fallbackProviders: [],
      };

      const manager = new ProviderManager({ config: fastConfig, providers });

      await expect(
        manager.generateText({
          model: "test-model",
          messages: [{ role: "user", content: "Hello" }],
        }),
      ).rejects.toThrow();
    }, 10_000);
  });

  describe("cancellation behavior", () => {
    it("propagates AbortSignal to the provider", async () => {
      const primary = createMockProvider(providerId("mock-primary"), MOCK_RESPONSE);
      const providers = new Map<ProviderId, IAIProvider>([[providerId("mock-primary"), primary]]);

      const manager = new ProviderManager({ config: TEST_CONFIG, providers });
      const controller = new AbortController();
      controller.abort();

      await expect(
        manager.generateText({
          model: "test-model",
          messages: [{ role: "user", content: "Hello" }],
          signal: controller.signal,
        }),
      ).rejects.toThrow();
    });
  });

  describe("provider failure handling", () => {
    it("wraps errors as ProviderError with correct provider id", async () => {
      const primary = createFailingProvider(
        providerId("mock-primary"),
        ProviderError.rateLimited(providerId("mock-primary")),
      );

      const providers = new Map<ProviderId, IAIProvider>([[providerId("mock-primary"), primary]]);

      const noFallbackConfig: AIProviderConfig = {
        ...TEST_CONFIG,
        fallbackProviders: [],
      };

      const manager = new ProviderManager({ config: noFallbackConfig, providers });

      try {
        await manager.generateText({
          model: "test-model",
          messages: [{ role: "user", content: "Hello" }],
        });
        expect.unreachable("should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(ProviderError);
        expect((error as ProviderError).providerId).toBe(providerId("mock-primary"));
        expect((error as ProviderError).code).toBe("ALL_PROVIDERS_FAILED");
      }
    });
  });
});
