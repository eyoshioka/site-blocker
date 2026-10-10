// declarativeNetRequest の urlFilter で、ドメインの先頭に一致させる記号
const DOMAIN_ANCHOR = "||";

export function toUrlPattern(domain: string): string {
  return `${DOMAIN_ANCHOR}${domain}`;
}

export function matchesUrl(urlPattern: string, url: string): boolean {
  return url.includes(urlPattern.replace(DOMAIN_ANCHOR, ""));
}
