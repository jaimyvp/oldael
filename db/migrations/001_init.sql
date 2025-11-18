PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS apartments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    building TEXT NOT NULL,
    floor TEXT NOT NULL,
    number TEXT NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS cleaning_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apartment_id INTEGER NOT NULL,
    activity_type TEXT NOT NULL,
    date TEXT NOT NULL,
    cleaner_name TEXT NOT NULL,
    hours_worked REAL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (apartment_id) REFERENCES apartments(id)
);

INSERT OR IGNORE INTO apartments (code, building, floor, number, description) VALUES
('A-101', 'Oldael A', '1', '101', 'Appartement A-101'),
('A-102', 'Oldael A', '1', '102', 'Appartement A-102'),
('B-201', 'Oldael B', '2', '201', 'Appartement B-201');
