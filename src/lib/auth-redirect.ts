/** Keep sign-in and sign-up return paths inside this application. */
export function safeAuthRedirect(value: unknown): string {
  if (typeof value !== "string" || value.length > 2048) return "/dashboard";
  if (!value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return "/dashboard";
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(decoded)) return "/dashboard";
  } catch {
    return "/dashboard";
  }
  return value;
}
