import { expect, test } from "bun:test";
import { compactionGenerationRequest } from "../src/adapters/chatgpt-web/compaction-handoff";
import type { CodexParsedRequest } from "../src/types";
const capabilities = { localToolsEnabled: false, solAvailable: true, extraHighAvailable: true, proAvailable: true };
const parsed: CodexParsedRequest = { modelId: "gpt-5.6-sol", stream: true, context: { messages: [] }, options: { reasoning: "max" }, _compactionRequest: true };
test("explicit compaction effort leaves native identity and ordinary requests unchanged", () => {
  const summary = compactionGenerationRequest(parsed, "xhigh", capabilities);
  expect(summary.options.reasoning).toBe("xhigh");
  expect(summary.context).toBe(parsed.context);
  expect(parsed.options.reasoning).toBe("max");
  expect(compactionGenerationRequest(parsed, undefined, capabilities)).toBe(parsed);
  const normal = { ...parsed, _compactionRequest: false };
  expect(compactionGenerationRequest(normal, "xhigh", capabilities)).toBe(normal);
});
test("unavailable compaction effort fails explicitly without downgrading", () => {
  expect(() => compactionGenerationRequest(parsed, "xhigh", { ...capabilities, extraHighAvailable: false })).toThrow("not available");
});

test("provider config forwards the explicit effort only to automatic mode", async () => {
  const { defaultConfig, providerConfig } = await import("../src/config");
  const config = defaultConfig("full");
  config.solAvailable = true;
  config.extraHighAvailable = true;
  config.compactionReasoning = "xhigh";
  expect(providerConfig(config).chatgptWeb?.compactionReasoning).toBe("xhigh");
  config.browserInteractionMode = "manual";
  expect(providerConfig(config).chatgptWeb?.compactionReasoning).toBeUndefined();
});
