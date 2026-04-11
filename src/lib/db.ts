import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  uri: process.env.DATABASE_URL ?? 'mysql://geminiwen:silentlove0449!@rm-bp16794mvudl80p3o.mysql.rds.aliyuncs.com:3306/kanban',
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

}
