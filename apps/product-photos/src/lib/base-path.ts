// Must match `basePath` in next.config.ts. Next prefixes it for <Link>, router and
// redirect(), but NOT for fetch(), Auth.js callbackUrl or other raw URL strings.
export const BASE_PATH = "/product-photos";
export const AUTH_BASE_PATH = `${BASE_PATH}/api/auth`;
