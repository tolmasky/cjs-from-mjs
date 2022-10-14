const { parse, transformFromAst } = require("@babel/core");
const MJSToCJSPlugin = require("./mjs-to-cjs-plugin");

const DefaultOptions =
{
    retainLines: true,
    parserOpts:
    {
        allowReturnOutsideFunction: true,
        plugins: ["importAssertions"]
    }
};

module.exports = function MJSToCJS(...arguments)
{
    const code = arguments.length === 2 ?
        arguments[1] :
        arguments[0];

    if (arguments.length === 1)
        return MJSToCJS(parse(code, DefaultOptions), code);

    const AST = arguments[0];

    return transformFromAst(AST, code,
    {
        ...DefaultOptions,
        plugins: [MJSToCJSPlugin]
    }).code;
}
