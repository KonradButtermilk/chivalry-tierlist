-- 1. Dodanie kolumny 'description' (opis gracza)
ALTER TABLE players ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Dodanie ograniczenia unikalności (case-insensitive)
-- To zapobiegnie dodaniu "Leonardo" jeśli istnieje "leonardo"
CREATE UNIQUE INDEX IF NOT EXISTS players_name_lower_idx ON players (lower(name));
