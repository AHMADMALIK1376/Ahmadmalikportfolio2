/**
 * What the computer types, over and over: a chat loop for Claude, the API in
 * front of it, the React client that calls it and the query behind a projects
 * page. Lines are kept short enough to fit the screen.
 */

const SNIPPETS = [
  `# chat_loop.py
from anthropic import Anthropic

client = Anthropic()
history = []

while True:
    prompt = input("you › ")
    history.append({
        "role": "user",
        "content": prompt,
    })
    reply = client.messages.create(
        model="claude-opus-5-5",
        max_tokens=1024,
        messages=history,
    )
    history.append({
        "role": "assistant",
        "content": reply.content,
    })
    print(reply.content[0].text)`,

  `# api.py
from fastapi import FastAPI

app = FastAPI()

@app.post("/chat")
async def chat(msg: Message):
    reply = await agent.run(msg.text)
    return {"reply": reply}`,

  `// Chat.tsx
export function Chat() {
  const [log, setLog] = useState([]);

  async function send(text) {
    const res = await fetch("/chat", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setLog((l) => [...l, data.reply]);
  }
}`,

  `-- projects.sql
SELECT id, title, created_at
FROM projects
WHERE owner = 'ahmad'
ORDER BY created_at DESC
LIMIT 10;`,
];

/** Syntax colours from the site's own inks, chosen to read on the screen's dark glass. */
export const SYNTAX = {
  plain: "#eaebe6",
  keyword: "#e0916f",
  string: "#b8c9a6",
  number: "#ecbea9",
  call: "#d3ddc6",
  comment: "#868b84",
} as const;

export type Token = { text: string; colour: string };

const KEYWORDS = new Set(
  "from import while for in if else return def async await const let function export class new True False None SELECT FROM WHERE ORDER BY LIMIT DESC".split(" "),
);

// a comment, a string, a number, a name being called, or any other name
const PATTERN = /(#.*|\/\/.*|--.*)|("[^"]*"|'[^']*')|\b(\d+)\b|([A-Za-z_]\w*)(?=\()|([A-Za-z_]\w*)/g;

function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const match of line.matchAll(PATTERN)) {
    const [text, comment, string, number, call, word] = match;
    const start = match.index ?? 0;
    if (start > last) tokens.push({ text: line.slice(last, start), colour: SYNTAX.plain });
    const colour = comment
      ? SYNTAX.comment
      : string
        ? SYNTAX.string
        : number
          ? SYNTAX.number
          : call
            ? SYNTAX.call
            : KEYWORDS.has(word)
              ? SYNTAX.keyword
              : SYNTAX.plain;
    tokens.push({ text, colour });
    last = start + text.length;
  }
  if (last < line.length) tokens.push({ text: line.slice(last), colour: SYNTAX.plain });
  return tokens;
}

/** Every line of every snippet, a blank line after each, already coloured. */
export const PROGRAM: Token[][] = SNIPPETS.flatMap((snippet) => [...snippet.split("\n"), ""]).map(tokenize);

export const lineLength = (tokens: Token[]) => tokens.reduce((sum, token) => sum + token.text.length, 0);

/** The first `count` characters of a coloured line. */
export function typedPart(tokens: Token[], count: number): Token[] {
  const typed: Token[] = [];
  let left = count;
  for (const token of tokens) {
    if (left <= 0) break;
    typed.push(left >= token.text.length ? token : { text: token.text.slice(0, left), colour: token.colour });
    left -= token.text.length;
  }
  return typed;
}
