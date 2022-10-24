const { parse, transformFromAst } = require("@babel/core");

const ModuleTypes = require("./module-types");
const ModuleTypeOnlyPragmaPlugin = require("./module-type-only-pragma-plugin");
const CJSFromMJSPlugin = require("./cjs-from-mjs-plugin");

const { format } = require("prettier");
const prettier = code => format(code, { parser: "babel" });


const DefaultOptions =
{
    retainLines: true,
    parserOpts:
    {
        allowReturnOutsideFunction: true,
        plugins: ["importAssertions"]
    }
};

module.exports = function CJSFromMJS(...arguments)
{
    const code = arguments.length === 2 ?
        arguments[1] :
        arguments[0];

    if (arguments.length === 1)
        return CJSFromMJS(parse(code, DefaultOptions), code);

    const AST = arguments[0];

    return Object.fromEntries(ModuleTypes
        .map(moduleType =>
        [
            moduleType,
            prettier(transformFromAst(AST, code,
            {
                ...DefaultOptions,
                plugins:
                [
                    [ModuleTypeOnlyPragmaPlugin, { moduleType }],
                    moduleType === "cjs" && CJSFromMJSPlugin
                ].filter(x => !!x)
            }).code)
        ]));
}

module.exports.ModuleTypes = ModuleTypes;
