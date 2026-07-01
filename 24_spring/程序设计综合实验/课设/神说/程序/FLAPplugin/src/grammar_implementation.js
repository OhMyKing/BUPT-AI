

// EXAMPLE GRAMMAR IMPLEMENTATION FROM EARLY PARSER cfg-grammar-toolbar.s

import g from "cfgrammar-tool"


let types = g.types;
let Grammar = types.Grammar;
let Rule = types.Rule;

let T = types.T;
let NT = types.NT;
Grammar([
    Rule('E', [NT('E'), T('+'), NT('T')]),
    Rule('E', [NT('T')]),
    Rule('T', [NT('T'), T('*'), NT('F')]),
    Rule('T', [NT('F')]),
    Rule('F', [T('('), NT('E'), T(')')]),
    Rule('F', [T('n')])
]);
