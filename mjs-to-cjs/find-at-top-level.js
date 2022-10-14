const { traverse } = require("@babel/core");

const traverseAndReturn = (toReturn, ...args) => (traverse(...args), toReturn);

module.exports = (types, AST,
    present = { },
    pairs = types.map(type => typeof type === "string" ?
        [type, node => node.type === type] :
        [type.name, type])) =>
    traverseAndReturn(present, AST,
    {
        Function: path => path.skip(),

        enter: ({ node }) => pairs
            .filter(([_, type]) => type(node))
            .forEach(([name]) => present[name] = true)
    });
