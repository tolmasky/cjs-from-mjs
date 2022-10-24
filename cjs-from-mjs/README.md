# cjs-from-mjs

`cjs-from-mjs` is a node package that will convert ESM code into idiomatic
CommonJS code.


### Usage

To use `cjs-from-mjs`, just import it and call the default function:

```mjs
import { basename } from "node:path";
import fs from "node:fs/promises";
import CJSFromMJS from "cjs-from-mjs";

const contents = await fs.readFile(new URL(import.meta.url), "utf-8");
const { cjs, mjs } = CJSFromMJS(contents);

await fs.writeFile(new URL("converted.js", import.meta.url), cjs, "utf-8");
```

### How it works

It does this by performing the following transforms:

1. [*ImportDeclaration*s][] are converted into the corresponding `const`/`require` declarations:

    ```mjs
    import fs, { readFile } from "node:fs";
    ```

    becomes:

    ```mjs
    const fs = require("node:fs");
    const { readFile } = fs;
    ```

2. `await import` expressions are converted into `require` expressions.
3. [*ExportDeclaration*s][] are converted into the corresponding direct and property [`module.exports`][] assignments.
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

[*ExportDeclaration*s]: https://262.ecma-international.org/13.0/#prod-ExportDeclaration
[*ImportDeclaration*s]: https://262.ecma-international.org/13.0/#prod-ImportDeclaration
[`module.exports`]: https://nodejs.org/api/modules.html#moduleexports

https://262.ecma-international.org/13.0/#prod-NamedExports