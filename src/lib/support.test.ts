import { afterEach, describe, expect, it } from "vitest";
import { supportUrl } from "./support";

const set = (v: string | undefined) => {
  if (v === undefined) delete process.env.NEXT_PUBLIC_SUPPORT_URL;
  else process.env.NEXT_PUBLIC_SUPPORT_URL = v;
};

describe("supportUrl", () => {
  afterEach(() => set(undefined));

  it("未設定や空なら表示しない", () => {
    set(undefined);
    expect(supportUrl()).toBeNull();
    set("  ");
    expect(supportUrl()).toBeNull();
  });

  it("https の URL だけを通す", () => {
    set("https://example.com/temora");
    expect(supportUrl()).toBe("https://example.com/temora");
  });

  it("https 以外や壊れた値は通さない", () => {
    for (const v of [
      "http://example.com",
      "javascript:alert(1)",
      "data:text/html,x",
      "example.com",
      "//evil.example",
    ]) {
      set(v);
      expect(supportUrl()).toBeNull();
    }
  });
});
