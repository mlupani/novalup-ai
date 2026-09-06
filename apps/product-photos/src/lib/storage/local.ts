import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Storage } from "@/lib/storage/index";

export class LocalStorage implements Storage {
  constructor(private root: string) {}

  private full(key: string) {
    return join(this.root, key);
  }

  async put(key: string, data: Buffer, contentType: string) {
    const path = this.full(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, data);
    await writeFile(`${path}.meta`, contentType, "utf8");
    return { url: key };
  }

  async read(key: string) {
    const path = this.full(key);
    const data = await readFile(path);
    let contentType = "application/octet-stream";
    try {
      contentType = (await readFile(`${path}.meta`, "utf8")).trim() || contentType;
    } catch {
      /* no sidecar — fall back */
    }
    return { data, contentType };
  }
}
