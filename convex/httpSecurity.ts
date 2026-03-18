export function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor
      .split(",")
      .map((value) => value.trim())
      .find(Boolean);
    if (firstIp) {
      return firstIp;
    }
  }

  const directIp = headers.get("cf-connecting-ip") ?? headers.get("x-real-ip");
  if (directIp?.trim()) {
    return directIp.trim();
  }

  return "unknown";
}

export function hashString(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16);
}

export function buildReplayKey(parts: Array<string | undefined>) {
  return parts.filter(Boolean).join(":");
}
