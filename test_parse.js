const fs = require('fs');
const ts = require('typescript');

const fileContent = fs.readFileSync('src/index.tsx', 'utf8');
const sourceFile = ts.createSourceFile(
    'src/index.tsx',
    fileContent,
    ts.ScriptTarget.Latest,
    true
);

function traverse(node) {
    if (node.kind === ts.SyntaxKind.JsxElement || node.kind === ts.SyntaxKind.JsxSelfClosingElement) {
        // Just walking the tree forces ts to parse it
    }
    ts.forEachChild(node, traverse);
}

try {
    traverse(sourceFile);
    console.log("TS parse completed without throwing.");
} catch (e) {
    console.error("Parse Error:", e);
}
