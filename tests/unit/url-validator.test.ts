import { describe, it, expect } from "vitest";
import { validateUrl } from "@/ai-core/tools/schema-builder/url-validator";

describe("URL Validator (SSRF Protection)", () => {
    it("accepts valid HTTPS URL", () => {
        const result = validateUrl("https://example.com");
        expect(result.valid).toBe(true);
        expect(result.url).toBe("https://example.com/");
    });

    it("accepts valid HTTP URL", () => {
        const result = validateUrl("http://example.com/page");
        expect(result.valid).toBe(true);
    });

    it("blocks localhost", () => {
        expect(validateUrl("http://localhost").valid).toBe(false);
        expect(validateUrl("http://localhost:3000").valid).toBe(false);
    });

    it("blocks 127.0.0.1", () => {
        expect(validateUrl("http://127.0.0.1").valid).toBe(false);
    });

    it("blocks 0.0.0.0", () => {
        expect(validateUrl("http://0.0.0.0").valid).toBe(false);
    });

    it("blocks private IPv4 10.x.x.x", () => {
        expect(validateUrl("http://10.0.0.1").valid).toBe(false);
        expect(validateUrl("http://10.255.255.255").valid).toBe(false);
    });

    it("blocks private IPv4 172.16.x.x", () => {
        expect(validateUrl("http://172.16.0.1").valid).toBe(false);
        expect(validateUrl("http://172.31.255.255").valid).toBe(false);
    });

    it("blocks private IPv4 192.168.x.x", () => {
        expect(validateUrl("http://192.168.1.1").valid).toBe(false);
    });

    it("blocks link-local 169.254.x.x", () => {
        expect(validateUrl("http://169.254.169.254").valid).toBe(false);
    });

    it("blocks cloud metadata endpoint", () => {
        expect(validateUrl("http://169.254.169.254/latest/meta-data/").valid).toBe(false);
    });

    it("blocks file:// protocol", () => {
        expect(validateUrl("file:///etc/passwd").valid).toBe(false);
    });

    it("blocks data:// protocol", () => {
        expect(validateUrl("data://text/html,<h1>hi</h1>").valid).toBe(false);
    });

    it("blocks javascript:// protocol", () => {
        expect(validateUrl("javascript://alert(1)").valid).toBe(false);
    });

    it("blocks ftp:// protocol", () => {
        expect(validateUrl("ftp://example.com/file").valid).toBe(false);
    });

    it("rejects empty string", () => {
        expect(validateUrl("").valid).toBe(false);
    });

    it("rejects invalid URL", () => {
        expect(validateUrl("not-a-url").valid).toBe(false);
    });

    it("blocks .internal domains", () => {
        expect(validateUrl("http://secret.internal").valid).toBe(false);
    });

    it("blocks .local domains", () => {
        expect(validateUrl("http://mynas.local").valid).toBe(false);
    });

    it("blocks ::1 IPv6", () => {
        expect(validateUrl("http://[::1]").valid).toBe(false);
    });

    it("blocks fe80:: link-local IPv6", () => {
        expect(validateUrl("http://[fe80::1]").valid).toBe(false);
    });
});