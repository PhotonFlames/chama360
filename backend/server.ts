import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import FileStoreFactory from "session-file-store";
import db, { initDb } from "./db.js";
import { v4 as uuidv4 } from "uuid";

const FileStore = FileStoreFactory(session);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

declare module "express-session" {
  interface SessionData {
    user: any;
  }
}

// Initialize Database
initDb();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  const isProd = process.env.NODE_ENV === "production";
  // On Windows, session-file-store can intermittently fail with EPERM on rename.
  // Use the default in-memory store in development for stability.
  const sessionStore = isProd ? new FileStore({ path: "./sessions" }) : undefined;

  app.use(session({
    ...(sessionStore ? { store: sessionStore } : {}),
    secret: "chama-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Auth Middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.session.user || req.session.user.role !== "Admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };

  const requireOfficial = (req: any, res: any, next: any) => {
    const role = req.session.user?.role;
    if (!req.session.user || !["Admin", "Treasurer"].includes(role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };

  const nowIso = () => new Date().toISOString();

  const logAudit = (opts: { req: any; action: string; entityType?: string; entityId?: string; details?: any }) => {
    try {
      const id = uuidv4();
      const actorId = opts.req.session?.user?.id ?? null;
      const actorEmail = opts.req.session?.user?.email ?? null;
      db.prepare(`
        INSERT INTO audit_logs (id, actorId, actorEmail, action, entityType, entityId, detailsJson, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        actorId,
        actorEmail,
        opts.action,
        opts.entityType ?? null,
        opts.entityId ?? null,
        opts.details ? JSON.stringify(opts.details) : null,
        nowIso(),
      );
    } catch {
      // best-effort
    }
  };

  const recordTransaction = (t: {
    memberId: string;
    type: string;
    amount: number;
    date: string;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
    createdBy?: string;
  }) => {
    const id = uuidv4();
    db.prepare(`
      INSERT INTO transactions (id, memberId, type, amount, date, referenceType, referenceId, notes, createdBy, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      t.memberId,
      t.type,
      t.amount,
      t.date,
      t.referenceType ?? null,
      t.referenceId ?? null,
      t.notes ?? null,
      t.createdBy ?? null,
      nowIso(),
    );
  };

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Auth API
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    
    if (user && user.password && user.password === password) {
      const { password: _, ...userWithoutPassword } = user;
      req.session.user = userWithoutPassword;
      res.json({ success: true, user: userWithoutPassword });
    } else {
      res.status(401).json({ success: false, error: "Invalid credentials" });
    }
  });

  app.post("/api/auth/register", (req, res) => {
    const { name, email, phoneNumber, password } = req.body ?? {};
    if (!name || !email || !phoneNumber || !password) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    const id = uuidv4();
    const joinDate = new Date().toISOString().split("T")[0];
    const role = "Member";

    try {
      db.prepare(`
        INSERT INTO users (id, name, email, role, joinDate, phoneNumber, password)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, email, role, joinDate, phoneNumber, password);

      const userWithoutPassword = { id, name, email, role, joinDate, phoneNumber };
      req.session.user = userWithoutPassword;
      res.json({ success: true, user: userWithoutPassword });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Could not log out" });
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.session.user) {
      res.json({ user: req.session.user });
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  // Users API
  app.get("/api/users", requireAuth, (req, res) => {
    const users = db.prepare("SELECT id, name, email, role, joinDate, phoneNumber FROM users").all();
    res.json(users);
  });

  app.post("/api/users", requireAdmin, (req, res) => {
    const { name, email, role, phoneNumber, password } = req.body;
    const id = uuidv4();
    const joinDate = new Date().toISOString().split("T")[0];
    
    try {
      db.prepare(`
        INSERT INTO users (id, name, email, role, joinDate, phoneNumber, password)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(id, name, email, role, joinDate, phoneNumber, password ?? null);
      
      logAudit({ req, action: "user.created", entityType: "user", entityId: id, details: { name, email, role } });
      res.json({ id, name, email, role, joinDate, phoneNumber });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/users/:id", requireAuth, (req, res) => {
    const { id } = req.params;
    const { name, email, role, phoneNumber } = req.body ?? {};
    
    // Normal users can only update themselves. Admins can update anyone.
    if (req.session.user.id !== id && req.session.user.role !== "Admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (!name || !email || !role || !phoneNumber) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Prevent non-admins from changing their role
    const safeRole = req.session.user.role === "Admin" ? role : req.session.user.role;

    try {
      db.prepare(`
        UPDATE users
        SET name = ?, email = ?, role = ?, phoneNumber = ?
        WHERE id = ?
      `).run(name, email, safeRole, phoneNumber, id);

      if (req.session.user.id === id) {
        req.session.user = { ...req.session.user, name, email, role: safeRole, phoneNumber };
      }

      logAudit({ req, action: "user.updated", entityType: "user", entityId: id, details: { name, email, role: safeRole } });
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/users/:id/password", requireAuth, (req, res) => {
    const { id } = req.params;
    const { password } = req.body ?? {};
    
    if (req.session.user.id !== id && req.session.user.role !== "Admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (!password) {
      return res.status(400).json({ error: "Missing password" });
    }

    try {
      db.prepare(`UPDATE users SET password = ? WHERE id = ?`).run(password, id);
      logAudit({ req, action: "user.password.set", entityType: "user", entityId: id });
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Delete user (Admin only)
  app.delete("/api/users/:id", requireAdmin, (req, res) => {
    const { id } = req.params;
    if (id === req.session.user.id) {
      return res.status(400).json({ error: "Cannot delete yourself" });
    }
    try {
      db.prepare("DELETE FROM users WHERE id = ?").run(id);
      logAudit({ req, action: "user.deleted", entityType: "user", entityId: id });
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Contributions API
  app.get("/api/contributions", requireAuth, (req, res) => {
    const contributions = db.prepare("SELECT * FROM contributions ORDER BY date DESC").all();
    res.json(contributions);
  });

  app.post("/api/contributions", requireOfficial, (req, res) => {
    const { memberId, memberName, amount, date, status, penalty } = req.body;
    const id = uuidv4();
    
    try {
      db.prepare(`
        INSERT INTO contributions (id, memberId, memberName, amount, date, status, penalty, recordedBy, recordedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        memberId,
        memberName,
        amount,
        date,
        status,
        penalty || 0,
        req.session.user.id,
        nowIso(),
      );

      recordTransaction({
        memberId,
        type: "contribution",
        amount: Number(amount),
        date,
        referenceType: "contribution",
        referenceId: id,
        createdBy: req.session.user.id,
      });
      if (penalty && Number(penalty) > 0) {
        recordTransaction({
          memberId,
          type: "penalty",
          amount: Number(penalty),
          date,
          referenceType: "contribution",
          referenceId: id,
          notes: "Late payment penalty",
          createdBy: req.session.user.id,
        });
      }
      logAudit({ req, action: "contribution.recorded", entityType: "contribution", entityId: id, details: { memberId, amount, penalty: penalty || 0 } });
      
      res.json({ id, memberId, memberName, amount, date, status, penalty });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Loans API
  app.get("/api/loans", requireAuth, (req, res) => {
    const loans = db.prepare("SELECT * FROM loans ORDER BY requestDate DESC").all();
    res.json(loans);
  });

  app.post("/api/loans", requireAuth, (req, res) => {
    const { memberId, memberName, amount, purpose, status, requestDate, interestRate, dueDate } = req.body;
    const id = uuidv4();
    const computedDueDate = dueDate || new Date(new Date(requestDate).getTime() + 30*24*60*60*1000).toISOString().split("T")[0];
    
    try {
      db.prepare(`
        INSERT INTO loans (id, memberId, memberName, amount, purpose, status, requestDate, interestRate, dueDate, repaidAmount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(id, memberId, memberName, amount, purpose, status, requestDate, interestRate, computedDueDate);

      logAudit({ req, action: "loan.requested", entityType: "loan", entityId: id, details: { memberId, amount, interestRate } });
      
      res.json({ id, memberId, memberName, amount, purpose, status, requestDate, interestRate, dueDate: computedDueDate, repaidAmount: 0 });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch("/api/loans/:id", requireOfficial, (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    
    try {
      const loan: any = db.prepare("SELECT * FROM loans WHERE id = ?").get(id);
      if (!loan) return res.status(404).json({ error: "Loan not found" });

      const updatedAt = nowIso();
      if (status === "Approved") {
        db.prepare(`
          UPDATE loans
          SET status = ?, approvedBy = ?, approvedAt = ?, rejectedBy = NULL, rejectedAt = NULL, updatedAt = ?
          WHERE id = ?
        `).run(status, req.session.user.id, updatedAt, updatedAt, id);

        // When approved, record a disbursement transaction (money out)
        recordTransaction({
          memberId: loan.memberId,
          type: "loan_disbursement",
          amount: Number(loan.amount),
          date: updatedAt.split("T")[0],
          referenceType: "loan",
          referenceId: id,
          notes: "Loan approved and disbursed",
          createdBy: req.session.user.id,
        });
        logAudit({ req, action: "loan.approved", entityType: "loan", entityId: id, details: { memberId: loan.memberId, amount: loan.amount } });
      } else if (status === "Rejected") {
        db.prepare(`
          UPDATE loans
          SET status = ?, rejectedBy = ?, rejectedAt = ?, approvedBy = NULL, approvedAt = NULL, updatedAt = ?
          WHERE id = ?
        `).run(status, req.session.user.id, updatedAt, updatedAt, id);
        logAudit({ req, action: "loan.rejected", entityType: "loan", entityId: id, details: { memberId: loan.memberId, amount: loan.amount } });
      } else {
        db.prepare(`UPDATE loans SET status = ?, updatedAt = ? WHERE id = ?`).run(status, updatedAt, id);
        logAudit({ req, action: "loan.status.updated", entityType: "loan", entityId: id, details: { status } });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Loan Repayment
  app.post("/api/loans/:id/repay", requireOfficial, (req, res) => {
    const { id } = req.params;
    const { amount, penalty } = req.body;

    try {
      const loan: any = db.prepare("SELECT * FROM loans WHERE id = ?").get(id);
      if (!loan) return res.status(404).json({ error: "Loan not found" });

      const newRepaid = (loan.repaidAmount || 0) + amount;
      const amountWithInterest = loan.amount + (loan.amount * (loan.interestRate / 100));
      const newStatus = newRepaid >= amountWithInterest ? 'Repaid' : loan.status;

      db.prepare(`UPDATE loans SET repaidAmount = ?, status = ?, updatedAt = ? WHERE id = ?`)
        .run(newRepaid, newStatus, nowIso(), id);

      // Record repayment transaction
      recordTransaction({
        memberId: loan.memberId,
        type: "loan_repayment",
        amount: Number(amount),
        date: new Date().toISOString().split("T")[0],
        referenceType: "loan",
        referenceId: id,
        notes: "Loan repayment recorded",
        createdBy: req.session.user.id,
      });

      if (penalty && Number(penalty) > 0) {
        recordTransaction({
          memberId: loan.memberId,
          type: "penalty",
          amount: Number(penalty),
          date: new Date().toISOString().split("T")[0],
          referenceType: "loan",
          referenceId: id,
          notes: "Late loan penalty",
          createdBy: req.session.user.id,
        });
      }

      logAudit({ req, action: "loan.repaid", entityType: "loan", entityId: id, details: { amount, newStatus } });
      
      res.json({ success: true, repaidAmount: newRepaid, status: newStatus });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Chart Data
  app.get("/api/reports/chart", requireAuth, (req, res) => {
    try {
      const result = db.prepare(`
        SELECT 
          substr(date, 1, 7) as month,
          SUM(CASE WHEN type = 'contribution' THEN amount ELSE 0 END) as contributions,
          SUM(CASE WHEN type = 'loan_disbursement' THEN amount ELSE 0 END) as loans
        FROM transactions
        WHERE type IN ('contribution', 'loan_disbursement')
        GROUP BY month
        ORDER BY month ASC
        LIMIT 12
      `).all();

      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Group Health Metrics (real computed stats)
  app.get("/api/reports/metrics", requireAuth, (req, res) => {
    try {
      const totalLoans = (db.prepare(`SELECT COUNT(*) as c FROM loans WHERE status IN ('Approved','Repaid')`).get() as any).c;
      const repaidLoans = (db.prepare(`SELECT COUNT(*) as c FROM loans WHERE status = 'Repaid'`).get() as any).c;
      const repaymentRate = totalLoans > 0 ? ((repaidLoans / totalLoans) * 100).toFixed(1) : '0.0';

      // Compliance: members who have contributed at least once this month
      const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const totalMembers = (db.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'Member'`).get() as any).c;
      const contributedThisMonth = (db.prepare(`
        SELECT COUNT(DISTINCT memberId) as c FROM contributions WHERE substr(date, 1, 7) = ?
      `).get(thisMonth) as any).c;
      const complianceRate = totalMembers > 0 ? ((contributedThisMonth / totalMembers) * 100).toFixed(1) : '0.0';

      const pendingLoans = (db.prepare(`SELECT COUNT(*) as c FROM loans WHERE status = 'Pending'`).get() as any).c;
      const totalContributions = (db.prepare(`SELECT COALESCE(SUM(amount), 0) as s FROM contributions`).get() as any).s;
      const totalDisbursed = (db.prepare(`SELECT COALESCE(SUM(amount), 0) as s FROM loans WHERE status IN ('Approved','Repaid')`).get() as any).s;
      const totalRepaid = (db.prepare(`SELECT COALESCE(SUM(repaidAmount), 0) as s FROM loans`).get() as any).s;
      const totalPenalties = (db.prepare(`SELECT COALESCE(SUM(penalty), 0) as s FROM contributions`).get() as any).s;

      res.json({
        repaymentRate: Number(repaymentRate),
        complianceRate: Number(complianceRate),
        pendingLoans,
        totalMembers,
        totalContributions,
        totalDisbursed,
        totalRepaid,
        totalPenalties,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Recent Activity Feed (for dashboard)
  app.get("/api/reports/activity", requireAuth, (req, res) => {
    try {
      const rows = db.prepare(`
        SELECT t.id, t.type, t.amount, t.date, t.notes, t.createdAt,
               u.name as memberName
        FROM transactions t
        LEFT JOIN users u ON u.id = t.memberId
        ORDER BY t.createdAt DESC
        LIMIT 10
      `).all();
      res.json(rows);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Audit Logs (Admin only)
  app.get("/api/audit-logs", requireAdmin, (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const offset = Number(req.query.offset) || 0;
      const rows = db.prepare(`
        SELECT id, actorId, actorEmail, action, entityType, entityId, detailsJson, createdAt
        FROM audit_logs
        ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset);
      const total = (db.prepare('SELECT COUNT(*) as c FROM audit_logs').get() as any).c;
      res.json({ logs: rows, total });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // System Settings (Admin only) - stored as key-value in a simple settings table
  app.get("/api/settings", requireAdmin, (req, res) => {
    try {
      const rows = db.prepare(`SELECT key, value FROM system_settings`).all() as Array<{ key: string; value: string }>;
      const settings: Record<string, boolean> = {};
      for (const row of rows) {
        settings[row.key] = row.value === '1';
      }
      res.json(settings);
    } catch (err: any) {
      // Table might not exist yet — return defaults
      res.json({
        automatedPenalties: true,
        allowLoanRequests: true,
        publicTransparency: true,
      });
    }
  });

  app.patch("/api/settings", requireAdmin, (req, res) => {
    try {
      const updates = req.body as Record<string, boolean>;
      for (const [key, value] of Object.entries(updates)) {
        db.prepare(`INSERT INTO system_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value`)
          .run(key, value ? '1' : '0');
      }
      logAudit({ req, action: "settings.updated", details: updates });
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // View Statement (Member use case)
  app.get("/api/statement", requireAuth, (req, res) => {
    const memberId = req.session.user.id;
    const rows = db.prepare(`
      SELECT id, memberId, type, amount, date, referenceType, referenceId, notes, createdBy, createdAt
      FROM transactions
      WHERE memberId = ?
      ORDER BY date DESC, createdAt DESC
    `).all(memberId);

    const totals = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'contribution' THEN amount ELSE 0 END), 0) AS totalContributions,
        COALESCE(SUM(CASE WHEN type = 'penalty' THEN amount ELSE 0 END), 0) AS totalPenalties,
        COALESCE(SUM(CASE WHEN type = 'loan_disbursement' THEN amount ELSE 0 END), 0) AS totalLoanDisbursed,
        COALESCE(SUM(CASE WHEN type = 'loan_repayment' THEN amount ELSE 0 END), 0) AS totalLoanRepaid
      FROM transactions
      WHERE memberId = ?
    `).get(memberId);

    res.json({ memberId, totals, transactions: rows });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      root: path.join(process.cwd(), "frontend"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "frontend", "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
