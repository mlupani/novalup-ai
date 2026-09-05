export function buildAlternates(pathname: string) {
  const path = pathname === "/" ? "" : pathname;

  return {
    languages: {
      es: path || "/",
      en: `/en${path}`,
    },
  };
}
