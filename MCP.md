# cc-kanban MCP

Kanban board exposed as an MCP server over streamable HTTP. Any Claude Code project can point at it to create/read/update boards, columns, and cards — and read images attached to cards.

## Endpoints

| Mode | URL |
|---|---|
| Local dev | `http://localhost:3005/mcp` |
| Remote (when deployed) | `https://kanban.geminiwen.com/mcp` |

The server also serves the web UI on the same origin: `http://localhost:3005/`.

## Connect from another Claude Code project

Add the server to that project's `.claude/settings.local.json`:

```json
{
  "mcpServers": {
    "kanban": {
      "type": "http",
      "url": "http://localhost:3005/mcp"
    }
  }
}
```

Restart Claude Code so it picks up the new server. Tools will appear prefixed with `mcp__kanban__`.

For shared/team use, put the block into `.mcp.json` (project-scoped, checked into git) or user-wide `~/.claude/settings.json` instead.

## Tools

| Tool | Purpose |
|---|---|
| `list_boards` | List all boards |
| `get_board` | Full board tree (columns + cards + attachment metadata) |
| `get_board_summary` | Markdown summary of a board |
| `get_card` | **Single card with inlined image content blocks** — Claude can see attached screenshots directly |
| `create_board` / `create_column` / `create_card` | Create entities |
| `update_column` / `update_card` | Patch fields |
| `move_card` | Move between columns / reorder |
| `delete_column` / `delete_card` | Remove entities |

## Image attachments — the point of `get_card`

Upload images via the web UI (drag / paste / click in the card modal). Then any Claude Code session can call:

```
mcp__kanban__get_card(card_id: "<uuid>")
```

Response is a list of content blocks:

```
[
  { type: "text",  text: "# Card title\n..." },
  { type: "image", data: "<base64>", mimeType: "image/png" },
  { type: "image", data: "<base64>", mimeType: "image/jpeg" }
]
```

Claude sees the pixels directly — no URL fetching, no ambiguity. Intended flow: **PM drops screenshots into a card** → **engineer's Claude Code reads the card** → **Claude understands the full requirement**.

Supported types: `jpg / png / gif / webp`, max 5 MB per file.

## Typical agent workflow

```
1. list_boards                         → find board UUID
2. get_board(board_id)                 → scan columns for new requirements
3. For each card with attachments:
     get_card(card_id)                 → read text + images
4. Work on the task
5. update_card(card_id, …)             → log progress in description
6. move_card(…)                        → move to Doing / Done
```

## Local dev startup

```bash
# .env.local
DATABASE_URL=mysql://root@localhost:3306/kanban
PORT=3005
WS_PORT=3001
NEXT_PUBLIC_WS_PORT=3001

bun run dev
# HTTP on  http://localhost:3005
# WS   on  ws://localhost:3001/ws
# MCP  on  http://localhost:3005/mcp
```

Migrations run automatically on the first request. Uploaded files go to `public/uploads/`.
