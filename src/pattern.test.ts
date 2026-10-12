import { describe, expect, test } from "vitest";
import { matchesUrl, toHostname, toUrlFilter, toUrlPattern } from "./pattern";

describe("toHostname", () => {
  test.each([
    ["x.com", "x.com"],
    ["  x.com  ", "x.com"],
    ["X.COM", "x.com"],
    ["https://x.com/home", "x.com"],
    ["http://www.x.com:8080/a?b=c#d", "www.x.com"],
    ["x.com/home", "x.com"],
    ["x.com.", "x.com"],
  ])("%j → %j", (input, want) => {
    expect(toHostname(input)).toBe(want);
  });

  test.each(["", "   ", "https://", "a b", "file:///etc/hosts"])(
    "%j は undefined",
    (input) => {
      expect(toHostname(input)).toBeUndefined();
    }
  );
});

describe("toUrlFilter", () => {
  test.each([
    [toUrlPattern("x.com"), "||x.com^"],
    // 以前の版が保存したパターン
    ["||X.COM", "||x.com^"],
    ["||https://x.com/home", "||x.com^"],
  ])("%s → %s", (urlPattern, want) => {
    expect(toUrlFilter(urlPattern)).toBe(want);
  });

  test("ドメインとして読めないパターンは undefined", () => {
    expect(toUrlFilter("||a b")).toBeUndefined();
  });
});

describe("matchesUrl", () => {
  const pattern = toUrlPattern("x.com");

  test.each(["||X.COM", "||https://x.com/home"])(
    "以前の版が保存したパターン %s でもブロックする",
    (legacy) => {
      expect(matchesUrl(legacy, "https://x.com/")).toBe(true);
    }
  );

  // ドメインを undefined のまま比べると、末尾が ".undefined" のホスト名に一致してしまう
  test.each(["https://x.com/", "https://a.undefined/"])(
    "ドメインとして読めないパターンは %s をブロックしない",
    (url) => {
      expect(matchesUrl("||a b", url)).toBe(false);
    }
  );

  test.each([
    "https://x.com/",
    "https://x.com/home",
    "http://x.com:8080/",
    "https://www.x.com/",
    "https://a.b.x.com/",
    "https://X.COM/",
    "https://x.com./",
  ])("%s はブロックする", (url) => {
    expect(matchesUrl(pattern, url)).toBe(true);
  });

  test.each([
    "https://netflix.com/",
    "https://box.com/",
    "https://x.com.example/",
    "https://www.google.com/search?q=x.com",
    "https://example.com/x.com",
    "chrome://newtab/",
    "not a url",
  ])("%s はブロックしない", (url) => {
    expect(matchesUrl(pattern, url)).toBe(false);
  });
});
