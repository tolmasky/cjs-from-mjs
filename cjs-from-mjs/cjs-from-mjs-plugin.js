const findAtTopLevel = require("./find-at-top-level");


const toRequireExpression = (t, awaitImportCallExpression) =>
    t.CallExpression(
        t.Identifier("require"),
        awaitImportCallExpression.argument.arguments);

const toRequireDeclaration = (t, importDeclaration) =>
    t.VariableDeclaration("const", [
        t.VariableDeclarator(
            toPattern(t, importDeclaration.specifiers),
            t.CallExpression(
                t.Identifier("require"),
                [importDeclaration.source]))]);

const toPattern = (t, specifiers) =>
    t.isImportDefaultSpecifier(specifiers[0]) ?
        specifiers[0].local :
    t.isImportNamespaceSpecifier(specifiers[0]) ?
        specifiers[0].local :
        t.ObjectPattern(specifiers
            .map(({ imported, local }) =>
                t.ObjectProperty(
                    imported,
                    local,
                    false,
                    imported.name === local.name)));

const isMetaMember = (t, name, node) =>
    t.isMemberExpression(node) &&
    t.isMetaProperty(node.object) &&
    t.isIdentifier(node.property, { name });

const isAwaitImportCallExpression = (t, node) =>
    t.isAwaitExpression(node) &&
    t.isCallExpression(node.argument) &&
    t.isImport(node.argument.callee);

const hasTopLevelAwait = AST =>
    findAtTopLevel(["AwaitExpression"], AST).AwaitExpression;

// default and function name === null
const toMemberExpression = (t, names) => names
    .filter(name => !!name)
    .map(name => typeof name === "string" ? t.Identifier(name) : name)
    .reduce((lhs, rhs) => t.MemberExpression(lhs, rhs));

const toExportAssignment = (t, named, id) =>
    t.ExpressionStatement(
        t.AssignmentExpression(
            "=",
            toMemberExpression(t, ["module", "exports", named && id]),
            id));

// default and function name === null
const toCJSExports = (
    t,
    { declaration, type },
    isDefaultExport = type === "ExportDefaultDeclaration") =>
[
    declaration,
    ...(isDefaultExport ? [declaration] : declaration.declarations)
        .map(({ id }) => toExportAssignment(t, !isDefaultExport, id))
];

const isRequire = (t, node) =>
    t.isCallExpression(node) &&
    t.isIdentifier(node.callee, { name: "require" });

module.exports = ({ types: t }) =>
({
    visitor:
    {
        ImportDeclaration: path =>
            void(path.replaceWith(toRequireDeclaration(t, path.node))),
        
        AwaitExpression: path => void(
            isAwaitImportCallExpression(t, path.node) &&
            path.replaceWith(toRequireExpression(t, path.node))),

        ExportDeclaration: path =>
            void(path.replaceWithMultiple(toCJSExports(t, path.node))),

        MemberExpression: path => void(
            isMetaMember(t, "url", path.node) &&
            path.replaceWith(t.Identifier("__filename"))),

        NewExpression: path => void(
            t.isIdentifier(path.node.callee, { name: "URL" }) &&
            path.node.arguments.length === 2 &&
            isMetaMember(t, "url", path.node.arguments[1]) &&
            path.replaceWith(t.CallExpression(
                t.Identifier("join"),
                [t.Identifier("__dirname"), path.node.arguments[0]]))),

        Program:
        {
            exit(path, state)
            {
                if (!hasTopLevelAwait(path.node))
                    return;

                const { body } = path.node;
                const lastRequireStatement =
                    body.findLastIndex(node =>
                        node.type === "VariableDeclaration" &&
                        node.declarations
                            .find(({ init }) => isRequire(t, init)));
                const firstNonRequireStatement = lastRequireStatement + 1;

                const imports = body.slice(0, firstNonRequireStatement);
                const rest = body.slice(firstNonRequireStatement);

                path.node.body = [...imports, t.ExpressionStatement(
                    t.CallExpression(t.ArrowFunctionExpression(
                        [],
                        t.BlockStatement(rest),
                        true), []))];

                path.replaceWith(path.node);
            }
        }
    }
});
