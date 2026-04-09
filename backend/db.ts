import Database from 'better-sqlite3';

const db = new Database('chama.db');

function hasColumn(table: string, column: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  return cols.some(c => c.name === column);
}

function ensureColumn(table: string, column: string, typeSql: string) {
  if (!hasColumn(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeSql}`);
  }
}

export function initDb() {
  // Users Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL,
      joinDate TEXT NOT NULL,
      phoneNumber TEXT NOT NULL,
      password TEXT -- For simple auth
    )
  `);

  // Contributions Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS contributions (
      id TEXT PRIMARY KEY,
      memberId TEXT NOT NULL,
      memberName TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      penalty REAL DEFAULT 0,
      FOREIGN KEY (memberId) REFERENCES users(id)
    )
  `);

  // Track who recorded contributions (Treasurer/Admin)
  ensureColumn('contributions', 'recordedBy', 'TEXT');
  ensureColumn('contributions', 'recordedAt', 'TEXT');

  // Loans Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY,
      memberId TEXT NOT NULL,
      memberName TEXT NOT NULL,
      amount REAL NOT NULL,
      purpose TEXT NOT NULL,
      status TEXT NOT NULL,
      requestDate TEXT NOT NULL,
      repaymentDate TEXT,
      interestRate REAL NOT NULL,
      FOREIGN KEY (memberId) REFERENCES users(id)
    )
  `);

  // Track approvals/rejections for workflow + auditing
  ensureColumn('loans', 'approvedBy', 'TEXT');
  ensureColumn('loans', 'approvedAt', 'TEXT');
  ensureColumn('loans', 'rejectedBy', 'TEXT');
  ensureColumn('loans', 'rejectedAt', 'TEXT');
  ensureColumn('loans', 'repaidAt', 'TEXT');
  ensureColumn('loans', 'updatedAt', 'TEXT');
  ensureColumn('loans', 'dueDate', 'TEXT');
  ensureColumn('loans', 'repaidAmount', 'REAL DEFAULT 0');

  // Ledger / statement support
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      memberId TEXT NOT NULL,
      type TEXT NOT NULL, -- contribution|penalty|loan_disbursement|loan_repayment
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      referenceType TEXT, -- contribution|loan
      referenceId TEXT,
      notes TEXT,
      createdBy TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (memberId) REFERENCES users(id)
    )
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_member_date ON transactions(memberId, date)`);

  // Basic audit logs for admin/official actions
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      actorId TEXT,
      actorEmail TEXT,
      action TEXT NOT NULL,
      entityType TEXT,
      entityId TEXT,
      detailsJson TEXT,
      createdAt TEXT NOT NULL
    )
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_audit_logs_createdAt ON audit_logs(createdAt)`);

  // System Settings (k/v store for Admin toggles)
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '1'
    )
  `);

  // Seed default settings
  const defaultSettings = [
    ['automatedPenalties', '1'],
    ['allowLoanRequests', '1'],
    ['publicTransparency', '1'],
  ];
  for (const [key, value] of defaultSettings) {
    db.prepare(`INSERT OR IGNORE INTO system_settings (key, value) VALUES (?, ?)`).run(key, value);
  }

  // Seed Admin if not exists
  const admin = db.prepare('SELECT * FROM users WHERE email = ?').get('photon973@gmail.com');
  if (!admin) {
    db.prepare(`
      INSERT INTO users (id, name, email, role, joinDate, phoneNumber, password)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'admin-1',
      'Photon Admin',
      'photon973@gmail.com',
      'Admin',
      new Date().toISOString().split('T')[0],
      '+254710707461',
      'admin123' // Default password
    );
  }

  console.log('Database initialized');
}

export default db;
