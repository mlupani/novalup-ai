import { describe, it, expect } from "vitest";
import copy from "@/content/copy";

describe("copy", () => {
  it("formats credit labels with the given number", () => {
    expect(copy.credits.freeLabel(3)).toBe("3 créditos gratis");
    expect(copy.credits.remainingLabel(2)).toBe("2 créditos restantes");
  });
  it("keeps batch strings grammatical for a batch of one", () => {
    expect(copy.tool.creatingBatch(0, 1)).toBe("Creando tu foto… 0 de 1 lista");
    expect(copy.tool.batchSummary(1, 2)).toBe("1 foto · 1 crédito usado · te quedan 2");
  });
  it("spells out the cost on the generate button only when it is more than one", () => {
    expect(copy.tool.generateN(1)).toBe("✨ Generar imagen");
    expect(copy.tool.generateN(4)).toBe("✨ Generar 4 imágenes · 4 créditos");
  });
});
