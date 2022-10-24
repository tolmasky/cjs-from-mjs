import assert from "node:assert";
import fs, { readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, it, test } from "node:test";

import { format } from "prettier";

import CJSFromMJS from "../cjs-from-mjs.js";


const given = f => f();

const prettier = code => format(code, { parser: "babel" });
const toPrettyCode = filename => prettier(readFileSync(filename, "utf-8"));

const fail = error => { throw error; };
const recoverable = (f, recover = fail) =>
    (...args) =>
        { try { return f(); } catch (error) { return recover(error) }; }

const readdir = (dirname, matching) => fs
    .readdirSync(dirname)
    .map(filename => join(dirname, filename))
    .filter(filename => matching.test(filename));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fixturesPath = join(__dirname, "fixtures");
const FixtureRegExp = /.input\.mjs$/g;

const toDescription = filename => basename(filename, ".input.mjs")
    .replace(/[\-]([a-z])/g, (_, character) => ` ${character}`)

const toOutputPath = (moduleType, filename) =>
    filename.replace(FixtureRegExp, `.output.${moduleType}`);

const toCoordinates = filename => given((
    input = toPrettyCode(filename)) =>
    ({
        input,
        output:
        {
            cjs: toPrettyCode(toOutputPath("cjs", filename)),
            mjs:
                recoverable(toPrettyCode, () => input)
                    (toOutputPath("mjs", filename)),
        }
    }));

readdir(fixturesPath, FixtureRegExp)
    .map(filename => describe(toDescription(filename), function ()
    {
        const { input, output } = toCoordinates(filename);
        const { cjs, mjs } = CJSFromMJS(input);

        it ("Correctly generates CommonJS code",
            () => assert.strictEqual(cjs, output.cjs));

        it ("Correctly generates ESM code",
            () => assert.strictEqual(mjs, output.mjs));
    }));
