const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'database.sqlite');
const migrationDir = path.join(__dirname, 'migrations');

const db = new Database(dbPath);

function runMigrations() {
  if (!fs.existsSync(migrationDir)) {
    return;
  }

  const migrationFiles = fs
    .readdirSync(migrationDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  migrationFiles.forEach((file) => {
    const migration = fs.readFileSync(path.join(migrationDir, file), 'utf-8');
    db.exec(migration);
  });
}

runMigrations();

function getApartmentByCode(code) {
  return db.prepare('SELECT * FROM apartments WHERE code = ?').get(code);
}

function createCleaningActivity({ apartmentId, activityType, date, cleanerName, hoursWorked }) {
  const statement = db.prepare(
    `INSERT INTO cleaning_activities (apartment_id, activity_type, date, cleaner_name, hours_worked)
     VALUES (?, ?, ?, ?, ?)`
  );

  statement.run(apartmentId, activityType, date, cleanerName, hoursWorked ?? null);
}

function getActivitiesWithinRange(startDate, endDate) {
  const statement = db.prepare(
    `SELECT ca.*, a.code AS apartment_code, a.building, a.number
     FROM cleaning_activities ca
     JOIN apartments a ON ca.apartment_id = a.id
     WHERE ca.date BETWEEN ? AND ?
     ORDER BY ca.date ASC, ca.created_at ASC`
  );

  return statement.all(startDate, endDate);
}

function getTotals(startDate, endDate) {
  const totalsByTypeStmt = db.prepare(
    `SELECT activity_type, COUNT(*) AS count
     FROM cleaning_activities
     WHERE date BETWEEN ? AND ?
     GROUP BY activity_type`
  );

  const hoursStmt = db.prepare(
    `SELECT SUM(hours_worked) AS total_hours
     FROM cleaning_activities
     WHERE activity_type = 'OPLEVERINGSSCHOONMAAK'
       AND date BETWEEN ? AND ?`
  );

  const totalsByType = totalsByTypeStmt.all(startDate, endDate);
  const hoursResult = hoursStmt.get(startDate, endDate);

  const totals = totalsByType.reduce((acc, row) => {
    acc[row.activity_type] = row.count;
    return acc;
  }, {});

  return {
    totalsByType: totals,
    totalHours: hoursResult?.total_hours || 0,
  };
}

module.exports = {
  db,
  getApartmentByCode,
  createCleaningActivity,
  getActivitiesWithinRange,
  getTotals,
};
