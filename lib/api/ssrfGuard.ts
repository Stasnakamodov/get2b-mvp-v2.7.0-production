/**
 * SSRF protection: blocks requests to internal/private network addresses.
 * Returns true if the URL points to a private/internal address.
 */
export function isPrivateUrl(urlString: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(urlString)
  } catch {
    return true // Malformed URLs are blocked
  }

  // Block non-http(s) protocols (file://, javascript://, data://, ftp://, etc.)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return true
  }

  const hostname = parsed.hostname.toLowerCase()

  // Block localhost variants
  if (
    hostname === 'localhost' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    return true
  }

  // Block IPv6 loopback and private ranges
  // Remove brackets for IPv6 e.g. [::1]
  const bare = hostname.replace(/^\[/, '').replace(/\]$/, '')
  if (bare === '::1' || bare.startsWith('fc') || bare.startsWith('fd') || bare.startsWith('fe80')) {
    return true
  }

  // Block private IPv4 ranges
  const ipv4Match = bare.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number)
    if (
      a === 127 ||                         // 127.0.0.0/8 loopback
      a === 10 ||                           // 10.0.0.0/8 private
      (a === 172 && b >= 16 && b <= 31) ||  // 172.16.0.0/12 private
      (a === 192 && b === 168) ||           // 192.168.0.0/16 private
      (a === 169 && b === 254) ||           // 169.254.0.0/16 link-local
      a === 0                               // 0.0.0.0/8
    ) {
      return true
    }
  }

  return false
}
