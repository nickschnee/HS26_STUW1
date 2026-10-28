# SQLite

## Präsentation

[Crashkurs Datenbanken](https://docs.google.com/presentation/d/12E9Mi7tVeNxzrlCm7UL9cJIKEbCsFJ_3fVTiZygLLvo/edit?usp=sharing)

## Setup

### CLI Installation

#### Mac

```bash
# Installation (macOS):
brew install sqlite


# Neue DB anlegen & öffnen
sqlite3 app.db


-- Im Prompt:
.tables -- Tabellen auflisten
.schema users -- Schema anzeigen
.mode box -- hübsche Ausgabe
.headers on
SELECT * FROM users;
.quit
```

#### Windows

1. Gehe auf [https://sqlite.org/download.html](https://sqlite.org/download.html) und lade `sqlite-tools-win-arm64-3500400.zip` (oder so ähnlich) (wichtig: tools) herunter

2. Extrahiere die ZIP Datei und verschiebe den Ordner auf `C:\sqlite`

3. Füge SQLite zum System Path hinzu

- Press Win + R, type `sysdm.cpl` and hit Enter.
- Go to the Advanced tab → click Environment Variables…
- In the “System variables” section, find and select Path, then click Edit.
- Click New, then add the path to your SQLite folder, e.g.:`C:\sqlite`
- Click OK on all windows to save.

4. Teste die Installation im Terminal mit `sqlite3`(kein Fehler = gut).Falls weiterhin Fehler auftreten, Terminal oder PC neu starten.

### DBeaver

Free Open-Source Database Management Tool

[Download DBeaver (Windows / Mac / Linux)](https://dbeaver.io/download/)

## Tabellen aufsetzen

### Datenbankschema importieren

```sql
-- foreign keys müssen in SQLite pro Verbindung aktiviert werden
PRAGMA foreign_keys = ON;


CREATE TABLE IF NOT EXISTS users (
id INTEGER PRIMARY KEY AUTOINCREMENT,
email TEXT NOT NULL UNIQUE,
name TEXT,
created_at TEXT NOT NULL DEFAULT (datetime('now'))
);


CREATE TABLE IF NOT EXISTS posts (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
title TEXT NOT NULL,
body TEXT,
created_at TEXT NOT NULL DEFAULT (datetime('now')),
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
```

### Einfache CRUD Beispiele

```sql
-- Create
INSERT INTO users (email, name) VALUES ('ada@ex.com', 'Ada');
INSERT INTO posts (user_id, title, body) VALUES (1, 'Hello', 'First post');


-- Read
SELECT u.name, p.title
FROM posts p JOIN users u ON u.id = p.user_id
ORDER BY p.id DESC
LIMIT 10;


-- Update
UPDATE users SET name = 'Ada Lovelace' WHERE id = 1;


-- Delete
DELETE FROM posts WHERE id = 1;

```

## Scripting

#### Node-Packages installieren

```
npm init -y
npm install better-sqlite3
```

and add `"type": "module",` in `package.json` so that node.js treats js-files as ES-modules.

db.js

```js
// db.js
import Database from "better-sqlite3";

// Erstellt Datei, wenn nicht vorhanden
const db = new Database("app.db");

// WICHTIG: Foreign Keys aktivieren pro Verbindung
db.pragma("foreign_keys = ON");

// Schema (idempotent)
db.exec(`
CREATE TABLE IF NOT EXISTS users (
id INTEGER PRIMARY KEY AUTOINCREMENT,
email TEXT NOT NULL UNIQUE,
name TEXT,
created_at TEXT NOT NULL DEFAULT (datetime('now'))
);


CREATE TABLE IF NOT EXISTS posts (
id INTEGER PRIMARY KEY AUTOINCREMENT,
user_id INTEGER NOT NULL,
title TEXT NOT NULL,
body TEXT,
created_at TEXT NOT NULL DEFAULT (datetime('now')),
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
`);

export default db;
```

seed.js

```js
// seed.js
import db from "./db.js";

const insertUser = db.prepare("INSERT INTO users (email, name) VALUES (?, ?)");
const insertPost = db.prepare(
  "INSERT INTO posts (user_id, title, body) VALUES (?, ?, ?)",
);

const tx = db.transaction(() => {
  const { lastInsertRowid: userId } = insertUser.run("ada@ex.com", "Ada");
  insertPost.run(userId, "Hello", "First post");
  insertPost.run(userId, "Zweite Nachricht", "Mit mehr Text");
});

tx();

console.log("Seeded ✅");
```

query.js

```js
// query.js
import db from "./db.js";

// Prepared Query (schnell & sicher)
const stmt = db.prepare(`
SELECT u.name, u.email, p.title, p.created_at
FROM posts p JOIN users u ON u.id = p.user_id
ORDER BY p.id DESC
LIMIT 10
`);

for (const row of stmt.iterate()) {
  console.log(row);
}
```

Run it with:

```
node seed.js
node query.js
```
