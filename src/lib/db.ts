import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? 'postgresql://kanban:kanban@localhost:5432/kanban',
})

export default pool

export async function runMigrations() {
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS boards (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS columns (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        board_id    UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        title       VARCHAR(255) NOT NULL,
        position    INTEGER NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id);

    CREATE TABLE IF NOT EXISTS cards (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        column_id   UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
        title       VARCHAR(255) NOT NULL,
        description TEXT,
        position    INTEGER NOT NULL,
        labels      TEXT[] DEFAULT '{}',
        due_date    TIMESTAMPTZ,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_cards_column_id ON cards(column_id);

    CREATE OR REPLACE FUNCTION update_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DO $$ BEGIN
        CREATE TRIGGER boards_updated_at BEFORE UPDATE ON boards
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
        CREATE TRIGGER columns_updated_at BEFORE UPDATE ON columns
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    DO $$ BEGIN
        CREATE TRIGGER cards_updated_at BEFORE UPDATE ON cards
            FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `)
}
