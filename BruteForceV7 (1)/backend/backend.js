import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import Database from 'better-sqlite3';
import cors from 'cors';
import hcaptcha from 'hcaptcha';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import open from 'open';

// Resolve directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}


// Display a popup warning for admin users
function showAdminPopup(message) {
// Generate a distinctive console alert for the admin
    try {
// Format a visual console alert
        const alertMessage = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║                              SECURITY ALERT!                                 ║
║                                                                              ║
║  ${message} ║
║                                                                              ║
║  Multiple failed login attempts detected!                                    ║
║  Please check the security logs for more information.                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
        `;
        
// Output alert to console with warning level
console.warn('\x1b[31m%s\x1b[0m', alertMessage); // Display in red
console.warn('\x1b[31m%s\x1b[0m', '>>> SECURITY ALERT: ' + message);
        
// Record the alert in the security log
        logger.error({
            msg: "ADMIN CONSOLE ALERT: " + message,
            type: "console_alert",
            timestamp: new Date().toISOString()
        }, true);
        
// Launch HTML alert window
        const alertPath = path.join(__dirname, 'alert.html');
        const encodedMessage = encodeURIComponent(message);
        open(`${alertPath}?message=${encodedMessage}`, { wait: false });
    } catch (error) {
        logger.error("Error showing admin console alert", {
            error: error.message,
            stack: error.stack
        });
    }
}

// Initialize Pino logger with file output
const logger = pino({
    level: 'info',
    transport: {
        targets: [
            {
                target: 'pino/file',
                options: { 
                    destination: path.join(logsDir, 'app.log'),
                    mkdir: true,
                    append: true
                },
                level: 'info'
            },
            {
                target: 'pino/file',
                options: { 
                    destination: path.join(logsDir, 'security.log'),
                    mkdir: true,
                    append: true
                },
                level: 'warn'
            }
        ]
    }
}, pino.destination(1)); // Duplicate logs to standard output

export const hcaptcha_ES = "ES_6b66bd4a12b54ab78eaefe43f1aeb96d";
const SECRET = "supersecretkey"; // Use environment variables for production secrets

// --- Database Initialization ---
let db = new Database(":memory:");
db.exec(`
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        last_login INTEGER,
        timeout INTEGER
    );
`);

db.exec(`
    CREATE TABLE transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        u_from INTEGER,
        u_to INTEGER,
        amount INTEGER
    );
`);

// --- Express App Configuration ---
const app = express();
app.use(express.json());
app.use(cors());

app.get("/user_aliases", (req, res) => {
    const users = db.prepare("SELECT id, username FROM users").all();
    res.status(200).json(users);
});

app.post("/send_money", (req, res) => {
    try{
        const jwt_c = jwt.verify(req.headers["x-token"], SECRET);
        const user = jwt_c.id;
        const stmt = db.prepare(
            "INSERT INTO transactions (u_from, u_to, amount) VALUES (?, ?, ?)"
        );
        stmt.run(user, req.body.to, req.body.amount);
        return res.status(200).send("OK");
    }catch{
        return res.status(500).send({error: "Erro"});
    }
});

app.get("/transactions", (req, res) => {
    try{
        const jwt_c = jwt.verify(req.headers["x-token"], SECRET);
        const user = jwt_c.id;
        const transactions = db.prepare("SELECT * FROM transactions WHERE u_to = ? OR u_from = ?").all(user,user);
        if(!transactions)
        {
            return res.status(404).send({error: "No transactions"});
        }
        return res.status(200).send(JSON.stringify(transactions));
    }catch(e){
        return res.status(500).send({error: "Erro"});
    }
    
});

// --- User Registration Endpoint ---
app.post("/register", async (req, res) => {
// Capture client IP for logging
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
// Log each user registration attempt
    logger.info({
        msg: "Registration attempt",
        email: req.body.email,
        username: req.body.username,
        ip: clientIP,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
    });
    
    try {
        const { username, email, password } = req.body;
        
// Ensure all required fields are present
        if (!username || !email || !password) {
            logger.warn({
                msg: "Registration attempt with missing fields",
                ip: clientIP,
                userAgent: req.headers['user-agent']
            });
            return res.status(400).send({ error: "Username, email, and password are required" });
        }
        
// Check email format validity
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            logger.warn({
                msg: "Registration attempt with invalid email format",
                email: email,
                ip: clientIP,
                userAgent: req.headers['user-agent']
            });
            return res.status(400).send({ error: "Invalid email format" });
        }
        
// Enforce password strength criteria
        if (password.length < 6) {
            logger.warn({
                msg: "Registration attempt with weak password",
                email: email,
                ip: clientIP,
                userAgent: req.headers['user-agent']
            });
            return res.status(400).send({ error: "Password must be at least 6 characters long" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);

        const stmt = db.prepare(
            "INSERT INTO users (username, email, password, last_login, timeout) VALUES (?, ?, ?, ?, ?)"
        );
        stmt.run(username, email, hashedPassword, 0, 1000);
        
// Record successful user registration
        logger.info({
            msg: "User registered successfully",
            email: email,
            username: username,
            ip: clientIP,
            userAgent: req.headers['user-agent']
        });

        res.status(201).send({ message: "User created successfully" });
    } catch (err) {
        if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
            logger.warn({
                msg: "Registration attempt for existing user",
                email: req.body.email,
                username: req.body.username,
                ip: clientIP,
                userAgent: req.headers['user-agent']
            });
            res.status(409).send({ error: "User already exists" });
        } else {
            logger.error({
                msg: "Database error during registration",
                error: err.message,
                stack: err.stack,
                email: req.body.email,
                ip: clientIP
            });
            res.status(500).send({ error: "Database error", details: err.message });
        }
    }
});

// Monitor failed login attempts for security alerts
const failedLoginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const FAILED_ATTEMPT_WINDOW = 300000; // 5-minute window for tracking failed attempts

app.post("/login", async (req, res) => {
// Obtain client IP for logging and security monitoring
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
// Record detailed login attempt information
    logger.info({
        msg: "Login attempt",
        email: req.body.email,
        ip: clientIP,
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString()
    });

    const { email, password, captcha } = req.body;
    
// Verify presence of all required request fields
    if (!email || !password) {
        logger.warn({
            msg: "Login attempt with missing credentials",
            ip: clientIP,
            userAgent: req.headers['user-agent']
        });
        return res.status(400).send({ error: "Email and password are required" });
    }
    
// Confirm captcha response is provided
    if (!captcha) {
        logger.warn({
            msg: "Login attempt without captcha",
            email: email,
            ip: clientIP,
            userAgent: req.headers['user-agent']
        });
        
// Also write to security log
        logger.warn({
            msg: "SECURITY ALERT: Login without captcha",
            email: email,
            ip: clientIP,
            userAgent: req.headers['user-agent']
}, true); // Mark as a security log entry
        
        return res.status(400).send({ error: "Captcha is required" });
    }
    
// Validate hCaptcha response
    const caprep = await hcaptcha.verify(hcaptcha_ES, captcha);
    if(!caprep.success) {
        logger.warn({
            msg: "Login attempt with invalid captcha",
            email: email,
            ip: clientIP,
            userAgent: req.headers['user-agent']
        });
        
// Record in security log
        logger.warn({
            msg: "SECURITY ALERT: Invalid captcha",
            email: email,
            ip: clientIP,
            userAgent: req.headers['user-agent']
        }, true);
        
        return res.status(400).send({ error: "Invalid captcha" });
    }
    
    try {
        const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
        if (!user) {
            logger.warn({
                msg: "Login attempt for non-existent user",
                email: email,
                ip: clientIP,
                userAgent: req.headers['user-agent']
            });
            
// Record in security log
            logger.warn({
                msg: "SECURITY ALERT: Login for non-existent user",
                email: email,
                ip: clientIP,
                userAgent: req.headers['user-agent']
            }, true);
            
// Update failed attempt count for alarm system
            trackFailedAttempt(email, clientIP);
            
            return res.status(401).send({ error: "Invalid email or password" });
        }

        // Check for timeout
        if ((Date.now() - user.last_login) < user.timeout) {
            const remaining = user.timeout - (Date.now() - user.last_login);
            logger.warn({
                msg: "Login attempt during timeout period",
                email: email,
                ip: clientIP,
                remainingTime: remaining / 1000
            });
            return res.status(420).send({ error: "Too many failed attempts. Please wait before trying again.", time: remaining / 1000, until: user.last_login + user.timeout});
        }

        const match = await bcrypt.compare(password, user.password);

        const updateStmt = db.prepare(
            "UPDATE users SET last_login = ?, timeout = ? WHERE id = ?"
        );

        if (!match) {
// Incorrect password; escalate timeout
            updateStmt.run(Date.now(), user.timeout * 2, user.id);
            
            logger.warn({
                msg: "Login attempt with invalid password",
                email: email,
                ip: clientIP,
                userAgent: req.headers['user-agent']
            });
            
// Record in security log
            logger.warn({
                msg: "SECURITY ALERT: Invalid password attempt",
                email: email,
                ip: clientIP,
                userAgent: req.headers['user-agent']
            }, true);
            
// Update failed attempt count for alarm system
            trackFailedAttempt(email, clientIP);
            
            return res.status(401).send({ error: "Invalid email or password" });
        }

// Successful login; reset timeout
        updateStmt.run(Date.now(), 1000, user.id);
        
// Clear failed attempts for this user/IP
        resetFailedAttempts(email, clientIP);
        
// Record successful user login
        logger.info({
            msg: "Successful login",
            email: email,
            userId: user.id,
            ip: clientIP,
            userAgent: req.headers['user-agent']
        });

// --- Generate JSON Web Token ---
        const token = jwt.sign(
            { id: user.id, email: user.email, username: user.username },
            SECRET,
{ expiresIn: "1h" } // Token expires after 1 hour
        );

        res.send({ message: "Login successful", token });
    } catch (err) {
        logger.error({
            msg: "Database error during login",
            error: err.message,
            stack: err.stack,
            email: email,
            ip: clientIP
        });
        res.status(500).send({ error: "Internal server error", details: err.message });
    }
});

// Tracks consecutive failed login attempts to trigger alarms
function trackFailedAttempt(email, ip) {
    const key = `${email}-${ip}`;
    const now = Date.now();
    
    if (!failedLoginAttempts.has(key)) {
        failedLoginAttempts.set(key, []);
    }
    
    const attempts = failedLoginAttempts.get(key);
    
// Append current attempt timestamp
    attempts.push(now);
    
// Filter out attempts beyond the tracking window
    const windowStart = now - FAILED_ATTEMPT_WINDOW;
    const recentAttempts = attempts.filter(attempt => attempt > windowStart);
    failedLoginAttempts.set(key, recentAttempts);
    
// Determine if failed attempt threshold is met
    if (recentAttempts.length >= MAX_FAILED_ATTEMPTS) {
        const timeWindowSeconds = FAILED_ATTEMPT_WINDOW / 1000;
        
// Record security alert
        logger.error({
            msg: "SECURITY ALERT: Multiple failed login attempts detected",
            email: email,
            ip: ip,
            attempts: recentAttempts.length,
            timeWindow: timeWindowSeconds + " seconds"
        }, true);
        
// Trigger admin popup notification
        showAdminPopup(`Multiple failed login attempts detected for ${email} from IP ${ip}`);
    }
}

// Resets failed login attempt counter upon success
function resetFailedAttempts(email, ip) {
    const key = `${email}-${ip}`;
    failedLoginAttempts.delete(key);
}


// --- Server Startup ---
app.listen(42069, () => {
console.log("Server is active at http://localhost:42069");
});
