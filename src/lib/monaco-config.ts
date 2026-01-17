
export async function registerFerretLanguage() {

    const monaco = await import("monaco-editor");
    // Register Ferret language
    monaco.languages.register({ id: "ferret" });

    // Define Ferret syntax highlighting
    monaco.languages.setMonarchTokensProvider("ferret", {
        keywords: [
            "let", "const", "type", "struct", "fn", "interface", "enum",
            "map", "if", "else", "for", "in", "while", "break", "continue",
            "match", "true", "false", "none", "defer", "import", "catch",
            "as", "return", "fork", "mut",
        ],

        typeKeywords: [
            "i8", "i16", "i32", "i64", "i128", "i256",
            "u8", "u16", "u32", "u64", "u128", "u256",
            "f32", "f64", "f128", "f256",
            "bool", "str", "byte", "char", "void",
        ],

        operators: [
            "=", ">", "<", "!", "~", "?", ":", "==", "<=", ">=", "!=",
            "&&", "||", "++", "--", "+", "-", "*", "/", "&", "|", "^",
            "%", "<<", ">>", ">>>", "+=", "-=", "*=", "/=", "&=", "|=",
            "^=", "%=", "<<=", ">>=", ">>>=", "=>", ":=", "?:", "::",
            "..", "..=", "..."
        ],

        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

        tokenizer: {
            root: [
                // Identifiers and keywords
                [
                    /[a-z_$][\w\$]*/,
                    {
                        cases: {
                            "@typeKeywords": "type",
                            "@keywords": "keyword",
                            "@default": "identifier",
                        },
                    },
                ],
                [/[A-Z][\w\$]*/, "type.identifier"],

                // Whitespace
                { include: "@whitespace" },

                // Delimiters and operators
                [/[{}()\[\]]/, "@brackets"],
                [/[<>](?!@symbols)/, "@brackets"],
                [
                    /@symbols/,
                    {
                        cases: {
                            "@operators": "operator",
                            "@default": "",
                        },
                    },
                ],

                // Numbers
                [/\d*\.\d+([eE][\-+]?\d+)?/, "number.float"],
                [/0[xX][0-9a-fA-F]+/, "number.hex"],
                [/\d+/, "number"],

                // Strings
                [/"([^"\\]|\\.)*$/, "string.invalid"],
                [/"/, "string", "@string"],

                // Characters
                [/'[^\\']'/, "string"],
                [/(')(@escapes)(')/, ["string", "string.escape", "string"]],
                [/'/, "string.invalid"],
            ],

            whitespace: [
                [/[ \t\r\n]+/, ""],
                [/\/\*/, "comment", "@comment"],
                [/\/\/.*$/, "comment"],
            ],

            comment: [
                [/[^\/*]+/, "comment"],
                [/\*\//, "comment", "@pop"],
                [/[\/*]/, "comment"],
            ],

            string: [
                [/[^\\"]+/, "string"],
                [/@escapes/, "string.escape"],
                [/\\./, "string.escape.invalid"],
                [/"/, "string", "@pop"],
            ],
        },
    });
}

export async function defineThemes() {
    // Dark theme
    const monaco = await import("monaco-editor");
    monaco.editor.defineTheme("ferret-one-dark-pro", {
        base: "vs-dark",
        inherit: true,
        rules: [
            { token: "keyword", foreground: "C678DD", fontStyle: "bold" },
            { token: "type", foreground: "56B6C2" },
            { token: "type.identifier", foreground: "56B6C2" },
            { token: "string", foreground: "98C379" },
            { token: "comment", foreground: "5C6370", fontStyle: "italic" },
            { token: "number", foreground: "D19A66" },
            { token: "operator", foreground: "ABB2BF" },
        ],
        colors: {
            "editor.background": "#282C34",
            "editor.foreground": "#ABB2BF",
            "editor.lineHighlightBackground": "#2C313C",
            "editorLineNumber.foreground": "#636D83",
            "editorLineNumber.activeForeground": "#ABB2BF",
            "editorCursor.foreground": "#528BFF",
            "editor.selectionBackground": "#3E4451",
            "editor.inactiveSelectionBackground": "#3E4451",
            "editorIndentGuide.background": "#3B4048",
            "editorIndentGuide.activeBackground": "#ABB2BF",
        },
    });

    // Light theme
    monaco.editor.defineTheme("ferret-one-light", {
        base: "vs",
        inherit: true,
        rules: [
            { token: "keyword", foreground: "C678DD", fontStyle: "bold" },
            { token: "type", foreground: "56B6C2" },
            { token: "type.identifier", foreground: "56B6C2" },
            { token: "string", foreground: "98C379" },
            { token: "comment", foreground: "5C6370", fontStyle: "italic" },
            { token: "number", foreground: "D19A66" },
            { token: "operator", foreground: "ABB2BF" },
        ],
        colors: {
            "editor.background": "#fafafa",
            "editor.foreground": "#23272e",
            "editor.lineHighlightBackground": "#f0f0f0",
            "editorLineNumber.foreground": "#a0a0a0",
            "editorLineNumber.activeForeground": "#23272e",
            "editorCursor.foreground": "#528BFF",
            "editor.selectionBackground": "#add6ff",
            "editor.inactiveSelectionBackground": "#e5ebf1",
            "editorIndentGuide.background": "#d3d3d3",
            "editorIndentGuide.activeBackground": "#939393",
        },
    });
}

export function getCurrentTheme(): string {
    const themeAttr = document.documentElement.getAttribute("data-theme");
    return themeAttr === "light" ? "ferret-one-light" : "ferret-one-dark-pro";
}
