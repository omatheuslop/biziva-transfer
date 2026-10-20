const MAX_FILE = 64 * 1024 * 1024,
  MAX_TOTAL = 512 * 1024 * 1024;
function validateFiles(files) {
  if (!files.length || files.length > 100)
    throw Error("Escolha entre 1 e 100 arquivos.");
  let total = 0;
  const names = new Set();
  for (const f of files) {
    if (
      !f.name ||
      f.name.length > 255 ||
      /[\\/\x00]/.test(f.name) ||
      names.has(f.name)
    )
      throw Error(
        "Nomes repetidos ou inválidos. Renomeie os arquivos antes de conferir.",
      );
    names.add(f.name);
    if (!Number.isSafeInteger(f.size) || f.size < 0 || f.size > MAX_FILE)
      throw Error("Cada arquivo deve ter até 64 MiB para a conferência.");
    total += f.size;
  }
  if (total > MAX_TOTAL) throw Error("O lote deve ter até 512 MiB.");
}
export async function fingerprint(files, cryptoApi = globalThis.crypto) {
  validateFiles(files);
  const records = [];
  for (const f of files) {
    const buf = await f.arrayBuffer();
    if (buf.byteLength !== f.size)
      throw Error("Arquivo mudou durante a leitura.");
    const hash = await cryptoApi.subtle.digest("SHA-256", buf);
    records.push({
      name: f.name,
      size: f.size,
      sha256: Array.from(new Uint8Array(hash), (x) =>
        x.toString(16).padStart(2, "0"),
      ).join(""),
    });
  }
  return {
    format: "biziva-transfer",
    version: 1,
    algorithm: "SHA-256",
    files: records,
  };
}
export function validateManifest(text) {
  if (typeof text !== "string" || text.length > 100000)
    throw Error("Manifesto muito grande.");
  const m = JSON.parse(text);
  if (
    m.format !== "biziva-transfer" ||
    m.version !== 1 ||
    m.algorithm !== "SHA-256" ||
    !Array.isArray(m.files) ||
    !m.files.length ||
    m.files.length > 100
  )
    throw Error("Manifesto inválido.");
  const names = new Set();
  for (const f of m.files) {
    if (
      typeof f.name !== "string" ||
      !f.name ||
      f.name.length > 255 ||
      /[\\/\x00]/.test(f.name) ||
      names.has(f.name) ||
      !Number.isSafeInteger(f.size) ||
      f.size < 0 ||
      f.size > MAX_FILE ||
      typeof f.sha256 !== "string" ||
      !/^[a-f0-9]{64}$/.test(f.sha256)
    )
      throw Error("Registro inválido no manifesto.");
    names.add(f.name);
  }
  return m;
}
export function compare(expected, actual) {
  const current = new Map(actual.files.map((f) => [f.name, f]));
  const report = expected.files.map((f) => {
    const a = current.get(f.name);
    current.delete(f.name);
    return {
      name: f.name,
      status: !a
        ? "ausente"
        : a.size === f.size && a.sha256 === f.sha256
          ? "ok"
          : "divergente",
    };
  });
  for (const name of current.keys()) report.push({ name, status: "extra" });
  return { complete: report.every((x) => x.status === "ok"), report };
}
export async function process(input, files) {
  const expected = input.manifest?.trim()
    ? validateManifest(input.manifest)
    : null;
  const actual = await fingerprint(files);
  if (!expected)
    return {
      text: JSON.stringify(actual, null, 2),
      filename: "manifesto-biziva.json",
      mime: "application/json",
      summary:
        actual.files.length +
        " arquivos conferidos localmente. Envie o manifesto junto dos arquivos pelo PairDrop.",
    };
  const report = compare(expected, actual);
  return {
    text: JSON.stringify(report, null, 2),
    filename: "conferencia-biziva.json",
    mime: "application/json",
    summary: report.complete
      ? "Integridade conferida: todos os arquivos correspondem."
      : "Conferência incompleta: há arquivos ausentes, extras ou divergentes.",
  };
}
