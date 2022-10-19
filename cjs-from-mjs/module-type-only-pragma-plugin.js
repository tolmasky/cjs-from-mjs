const given = f => f();
const { assign, fromEntries } = Object;

const ModuleTypes = require("./module-types");


const ModuleTypeInverses = fromEntries(ModuleTypes
    .map((name, index) => [name, ModuleTypes[ModuleTypes.length - index - 1]]));

const CommentNodeTypes =
    ["leadingComments", "trailingComments", "innerComments"];

const toModuleTypeOnlyCommentPredicate = type => given((
    PragmaRegExp = new RegExp(`^\\s*@pragma\\s+${type}-only(?:\\s|$)`)) =>
        comment => PragmaRegExp.test(comment.value));

const ModuleTypeOnlyCommentPredicates = fromEntries(ModuleTypes
    .map(type => [type, toModuleTypeOnlyCommentPredicate(type)]));
const isModuleTypeOnlyComment =
    toModuleTypeOnlyCommentPredicate(`(${ModuleTypes.join("|")})`);

module.exports = ({ types: t }) =>
({
    visitor:
    {
        Statement(path, state)
        {
            const { moduleType } = state.opts;
            const { node } = path;
            const isExcludedModuleTypeOnlyComment =
                ModuleTypeOnlyCommentPredicates[ModuleTypeInverses[moduleType]];

            if (node.leadingComments &&
                node.leadingComments.some(isExcludedModuleTypeOnlyComment))
            {
                for (const type of CommentNodeTypes)
                    node[type] = null;

                return path.remove();
            }

            for (const type of CommentNodeTypes)
                if (node[type])
                    node[type] = node[type]
                        .filter(comment => !isModuleTypeOnlyComment(comment));
        }
    }
});
