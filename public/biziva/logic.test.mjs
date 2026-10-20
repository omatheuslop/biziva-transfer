import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "./server.mjs";
test("local server serves assets but refuses writes, source and traversal", async () => {
  const server = createServer();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + server.address().port;
  try {
    const good = await fetch(base + "/biziva/index.html");
    assert.equal(good.status, 200);
    assert.ok(
      good.headers
        .get("content-security-policy")
        .includes("connect-src 'none'"),
    );
    assert.equal(good.headers.get("cache-control"), "no-store");
    for (const p of [
      "/biziva/server.mjs",
      "/biziva/../../package.json",
      "/biziva/%2e%2e%2fpackage.json",
      "/.env",
    ])
      assert.equal((await fetch(base + p)).status, 404);
    assert.equal(
      (await fetch(base + "/biziva/app.mjs", { method: "POST" })).status,
      405,
    );
  } finally {
    await new Promise((r) => server.close(r));
  }
});
import { webcrypto } from "node:crypto";
import { fingerprint, validateManifest, compare } from "./logic.mjs";
const file = (name, content) => ({
  name,
  size: Buffer.byteLength(content),
  arrayBuffer: async () => Uint8Array.from(Buffer.from(content)).buffer,
});
test("SHA256 matches known vector and detects modification/missing/extra", async () => {
  const m = await fingerprint([file("a.txt", "abc")], webcrypto);
  assert.equal(
    m.files[0].sha256,
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  assert.equal(compare(m, m).complete, true);
  const other = await fingerprint(
    [file("a.txt", "abd"), file("b.txt", "x")],
    webcrypto,
  );
  assert.deepEqual(
    compare(m, other).report.map((x) => x.status),
    ["divergente", "extra"],
  );
  assert.equal(compare(m, { files: [] }).report[0].status, "ausente");
  assert.deepEqual(validateManifest(JSON.stringify(m)), m);
});
test("ambiguous names, oversized inputs and forged manifests are rejected before reading", async () => {
  await assert.rejects(
    fingerprint([file("a", "x"), file("a", "y")], webcrypto),
  );
  await assert.rejects(
    fingerprint(
      [
        {
          name: "large",
          size: 65 * 1024 * 1024,
          arrayBuffer: () => {
            throw Error("must not read");
          },
        },
      ],
      webcrypto,
    ),
    /64 MiB/,
  );
  assert.throws(() =>
    validateManifest(
      JSON.stringify({
        format: "biziva-transfer",
        version: 1,
        algorithm: "SHA-256",
        files: [{ name: "../a", size: 1, sha256: "a".repeat(64) }],
      }),
    ),
  );
});
