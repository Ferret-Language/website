export async function registerFerretLanguage() {
  const monaco = await import("monaco-editor");

  // Register Ferret language
  monaco.languages.register({ id: "ferret" });

  monaco.languages.setMonarchTokensProvider("ferret", {
    keywords: [
      "let", "const", "type", "struct", "fn", "interface", "enum",
      "union",
      "map", "if", "else", "for", "in", "while", "break", "continue",
      "match", "defer", "import", "catch", "as", "return", "fork", "mut",
      "constraint",
    ],

    literals: ["true", "false", "none"],

    typeKeywords: [
      "i8", "i16", "i32", "i64", "i128", "i256",
      "u8", "u16", "u32", "u64", "u128", "u256",
      "f32", "f64", "f128", "f256",
      "bool", "str", "byte", "char", "void",
      "complex", "complex64", "complex128", "complex256", "complex512"
    ],

    operators: [
      "->",
      "=", ">", "<", "!", "~", "?", ":", "==", "<=", ">=", "!=",
      "&&", "||", "++", "--", "+", "-", "*", "/", "&", "|", "^",
      "%", "<<", ">>", ">>>", "+=", "-=", "*=", "/=", "&=", "|=",
      "^=", "%=", "<<=", ">>=", ">>>=", "=>", ":=", "?:", "::",
      "..", "..=", "..."
    ],

    // Includes '.' and ':' so .. ... :: := tokenize correctly
    symbols: /[=><!~?:&|+\-*\/\^%:.]+/,

    escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

    tokenizer: {
      root: [
        { include: "@whitespace" },

        // Function declaration: fn name
        [/\bfn\b/, "keyword", "@afterFn"],

        // Brackets
        [/[{}()\[\]]/, "@brackets"],

        // Arrow operator (so it doesn't tokenize as '-' + '>')
        [/->/, "operator"],

        // Type annotations (best-effort)
        // Matches: : ...T / : ...t
        [
          /(:)(\s*)(\.\.\.)(\s*)([a-zA-Z_$][\w$]*)/,
          [
            "operator",
            "",
            "operator",
            "",
            {
              cases: {
                "@typeKeywords": "type",
                "@keywords": "keyword",
                "@default": "type.identifier",
              },
            },
          ],
        ],

        // Matches: -> ...T / -> ...t
        [
          /(->)(\s*)(\.\.\.)(\s*)([a-zA-Z_$][\w$]*)/,
          [
            "operator",
            "",
            "operator",
            "",
            {
              cases: {
                "@typeKeywords": "type",
                "@keywords": "keyword",
                "@default": "type.identifier",
              },
            },
          ],
        ],

        [
          /(:)(\s*)([a-zA-Z_$][\w$]*)/,
          [
            "operator",
            "",
            {
              cases: {
                "@typeKeywords": "type",
                "@keywords": "keyword",
                "@default": "type.identifier",
              },
            },
          ],
        ],
        [
          /(->)(\s*)([a-zA-Z_$][\w$]*)/,
          [
            "operator",
            "",
            {
              cases: {
                "@typeKeywords": "type",
                "@keywords": "keyword",
                "@default": "type.identifier",
              },
            },
          ],
        ],

        // Operators
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
        [/0[xX][0-9a-fA-F_]+/, "number.hex"],
        [/0[oO][0-7_]+/, "number.oct"],
        [/0[bB][01_]+/, "number.bin"],
        [/\d+/, "number"],

        // Strings
        [/"([^"\\]|\\.)*$/, "string.invalid"],
        [/"/, "string", "@string"],

        // Characters
        [/\'([^\\']|\\.)\'/, "string"],
        [/'/, "string.invalid"],

        // Function calls (both lowercase and CapitalCase)
        [
          /[a-zA-Z_$][\w$]*(?=\s*\()/,
          {
            cases: {
              "@keywords": "keyword",
              "@default": "function",
            },
          },
        ],

        // Capitalized identifiers treated as type-ish (Printable, Vec, etc.)
        [/[A-Z][\w$]*/, "type.identifier"],

        // Identifiers / keywords
        [
          /[a-zA-Z_$][\w$]*/,
          {
            cases: {
              "@typeKeywords": "type",
              "@literals": "constant",
              "@keywords": "keyword",
              "@default": "identifier",
            },
          },
        ],
      ],

      afterFn: [
        [/[ \t\r\n]+/, ""],
        [/[a-zA-Z_$][\w$]*/, "function.declaration", "@pop"],
        [/./, "", "@pop"],
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
  const monaco = await import("monaco-editor");

  // Dark theme
  monaco.editor.defineTheme("ferret-one-dark-pro", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "C678DD", fontStyle: "bold" },
      { token: "type", foreground: "56B6C2" },
      { token: "type.identifier", foreground: "56B6C2" },

      // Functions
      { token: "function", foreground: "61AFEF" },
      { token: "function.declaration", foreground: "61AFEF", fontStyle: "bold" },

      { token: "string", foreground: "98C379" },
      { token: "comment", foreground: "5C6370", fontStyle: "italic" },
      { token: "number", foreground: "D19A66" },
      { token: "operator", foreground: "ABB2BF" },
      { token: "constant", foreground: "E5C07B" },
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

      // Functions
      { token: "function", foreground: "61AFEF" },
      { token: "function.declaration", foreground: "61AFEF", fontStyle: "bold" },

      { token: "string", foreground: "98C379" },
      { token: "comment", foreground: "5C6370", fontStyle: "italic" },
      { token: "number", foreground: "D19A66" },
      { token: "operator", foreground: "ABB2BF" },
      { token: "constant", foreground: "E5C07B" },
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
