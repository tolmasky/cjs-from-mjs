const { assign, fromEntries } = Object;
const ModuleTypes = require("./module-types");
const hasLeadingPragma = require("./had-leading-pragma");

const ModuleInverse = fromEntries(ModuleTypes
    .map((name, index) => [name, ModuleTypes[ModuleTypes.length - index - 1]]));

const hasModuleTypeOnlyPragma = fromEntries(ModuleTypes
    .map(name => [name, hasLeadingPragma(`${name}-only`)]));

const ModuleTypeOnlyPragmaRegExp = fromEntries(ModuleTypes
    .map(name => [name, new RegExp(`^\\s*@pragma\\s+${name}-only(?:\\s|$)`)]));

const CommentNodeTypes =
    ["leadingComments", "trailingComments", "innerComments"];


module.exports = ({ types: t }) =>
({
    visitor:
    {
        Statement(path, state)
        {
            const { moduleType } = state.opts;
            const { node } = path;
            const removeCommentPragmaRegExp =
                ModuleTypeOnlyPragmaRegExp[moduleType];

            for (const type of CommentNodeTypes)
                if (node[type])
                    node[type] = node[type]
                        .filter(comment =>
                            !removeCommentPragmaRegExp.test(comment.value));
        }
    }
});
