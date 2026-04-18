import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
})

export default pool

export async function runMigrations() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS boards (
        id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS \`columns\` (
        id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        board_id    CHAR(36) NOT NULL,
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        position    INT NOT NULL,
        created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
        INDEX idx_columns_board_id (board_id)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cards (
        id          CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        column_id   CHAR(36) NOT NULL,
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        position    INT NOT NULL,
        labels      JSON DEFAULT ('[]'),
        due_date    TIMESTAMP NULL,
        created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (column_id) REFERENCES \`columns\`(id) ON DELETE CASCADE,
        INDEX idx_cards_column_id (column_id)
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS card_attachments (
        id            CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        card_id       CHAR(36) NOT NULL,
        filename      VARCHAR(255) NOT NULL,
        original_name VARCHAR(512),
        mime_type     VARCHAR(128) NOT NULL,
        size          INT NOT NULL,
        created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
        INDEX idx_attachments_card_id (card_id)
    )
  `)
}
