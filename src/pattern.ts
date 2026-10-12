// declarativeNetRequest の urlFilter で、ドメインの先頭に一致させる記号
const DOMAIN_ANCHOR = "||";
// urlFilter の区切り文字（"/"、":"、"?" や URL の末尾）。ドメインの直後に置いて、
// x.com が x.com.example のような別のドメインに一致しないようにする
const SEPARATOR = "^";
// スキームから始まる入力かどうか（例: https://）
const SCHEME = /^[a-z][a-z\d+.-]*:\/\//i;
// 完全修飾ドメイン名の末尾のドット（x.com. は x.com と同じサイト）
const TRAILING_DOT = /\.$/;

// 入力されたドメインや URL をホスト名に正規化する（スキーム、ポート、パス、末尾のドットを除き、小文字にする）。
// ホスト名として読めないときは undefined を返す
export function toHostname(input: string): string | undefined {
  const trimmed = input.trim();
  const url = SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`;
  if (!URL.canParse(url)) {
    return undefined;
  }
  const hostname = new URL(url).hostname.replace(TRAILING_DOT, "");
  return hostname === "" ? undefined : hostname;
}

export function toUrlPattern(hostname: string): string {
  return `${DOMAIN_ANCHOR}${hostname}`;
}

// 保存されたパターンのドメイン。以前の版は入力をそのまま保存していた（||X.COM や ||x.com/home）ため、
// ここでも正規化する
function patternDomain(urlPattern: string): string | undefined {
  return toHostname(urlPattern.slice(DOMAIN_ANCHOR.length));
}

// declarativeNetRequest の urlFilter を返す。ドメインとして読めないパターンは undefined
export function toUrlFilter(urlPattern: string): string | undefined {
  const domain = patternDomain(urlPattern);
  return domain === undefined
    ? undefined
    : `${DOMAIN_ANCHOR}${domain}${SEPARATOR}`;
}

// URL のホスト名が、パターンのドメインと一致するか、そのサブドメインのときに true を返す
export function matchesUrl(urlPattern: string, url: string): boolean {
  const domain = patternDomain(urlPattern);
  if (domain === undefined || !URL.canParse(url)) {
    return false;
  }
  const hostname = new URL(url).hostname.replace(TRAILING_DOT, "");
  return hostname === domain || hostname.endsWith(`.${domain}`);
}
