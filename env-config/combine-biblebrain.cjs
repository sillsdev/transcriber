const writeFile = require("write");

async function combine() {
  const arg1Name =
    process.argv.length > 2 ? process.argv[2] : "biblebrain_2024-08-22";
  const arg2Name =
    process.argv.length > 2
      ? process.argv[2]
      : "biblebrain-timing-filesets_2024-09-05";

  const mod1 = await import(`./${arg1Name}.js`);
  const opts = new Map(mod1.default.map((e) => [e["bible_id"], e]));
  const mod2 = await import(`./${arg2Name}.js`);
  const tims = new Set(mod2.default.map((e) => e["fileset_id"]));

  // create map of language iso to bible ids
  let lang = new Map();
  opts.forEach((v, k) => {
    const key = v["iso"].toLowerCase();
    const bible_id = v["bible_id"];
    const cur = lang.get(key)?.ids;
    lang.set(key, cur ? { ids: [...cur, bible_id] } : { ids: [bible_id] });
  });

  // add timing fields to opts
  opts.forEach((v, k) => {
    opts.set(k, { ...v, ot_timing: "false", nt_timing: "false" });
  });

  const iso_with_timings = new Set();

  // set timing fields to true for filesets in tims
  tims.forEach((e) => {
    const bible_id = e.slice(0, 6);
    const iso = e.slice(0, 3).toLowerCase();
    if (!opts.has(bible_id)) {
      const cur = lang.get(iso);
      if (!cur?.missing || cur.missing.indexOf(bible_id) === -1) {
        // add missing bible_id to lang map
        lang.set(iso, {
          ...cur,
          missing: cur?.missing ? [...cur.missing, bible_id] : [bible_id],
        });
      }
      return;
    }
    const opt = opts.get(bible_id);
    iso_with_timings.add(`${opt["lang_name"]} [${iso}]`);
    const key = `${e.slice(6, 7).toLowerCase()}t_timing`;
    opts.set(bible_id, { ...opt, [key]: "true" });
  });

  // report iso with timing
  console.log(`${iso_with_timings.size} iso with timing: `);
  Array.from(iso_with_timings)
    .sort((a, b) => (a <= b ? -1 : 1))
    .forEach((e) => console.log(e));

  // report missing ids
  console.log("\nMissing ids (ids marked with T have timings):");
  Array.from(lang)
    .sort((a, b) => (a[0] <= b[0] ? -1 : 1))
    .forEach((i) => {
      const [k, v] = i;
      if (v.missing) {
        console.log(
          `iso ${k} Missing: ${v?.missing}, ids: ${v?.ids?.map((e) =>
            opts.get(e)?.ot_timing === "true" ||
            opts.get(e)?.nt_timing === "true"
              ? `${e}(T)`
              : e
          )}`
        );
      }
    });

  const json = JSON.stringify([...opts.values()], null, 2);

  writeFile.sync(__dirname + `/../src/assets/${arg1Name}.json`, json);
}

combine();
