# cjs-from-mjs

`cjs-from-mjs` is a node package that will convert ESM code into idiomatic
CommonJS code.


### Usage

To use `cjs-from-mjs`, just import it and call the default function:

```mjs
import { basename } from "node:path";
import fs from "node:fs/promises";
import CJSFromMJS from "cjs-from-mjs";

const { cjs, mjs } = CJSFromMJS(await fs.readFile(import.meta.url, "utf-8"));

await fs.writeFile(new URL("converted.js", import.meta.url), "utf-8");
```

### How it works

It does this by performing the following transforms:

1. `import` declarations are converted into `const`/`require` declarations.
2. `await import` expressions are converted into `require` expressions.
3. `export` declarations are converted into the corresponding `default` and `named` `module.exports` assignments.
4. Instnaces of `new URL(relative, import.meta.url)` are converted into `join(__dirname, relative)`.
5. If the code contains a top-level await, it will wrap the code *following* the import/require block in an async IIFE (`(async () => {})()`).
6. Lines of code preceded by `// @pragma cjs only` comments will be included, but the pragma comment itself will be removed.
7. Lines of code preceded by `// @pragma mjs only` comments will be removed, along with the pragma comment as well.


### Installing cjs-from-mjs

[`cjs-from-mjs` is available on npm](https://npmjs.com/cjs-from-mjs).

To use the `CJSFromMJS` function, install it locally:

```bash
$ npm install cjs-from-mjs
```
