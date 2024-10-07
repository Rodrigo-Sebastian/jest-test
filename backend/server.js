/*
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Arrayer för att lagra användare, konton och sessioner
const users = [];
const accounts = [];
const sessions = [];

// Endpoint: Skapa användare
app.post('/users', (req, res) => {
  const { username, password } = req.body;
  
  // Kontrollera om användaren redan finns
  if (users.some(user => user.username === username)) {
    return res.status(400).json({ message: 'Användarnamnet är redan upptaget' });
  }
  
  // Skapa ny användare
  const newUser = { id: users.length + 1, username, password };
  users.push(newUser);
  
  // Skapa ett konto för den nya användaren
  const newAccount = { userId: newUser.id, balance: 0 };
  accounts.push(newAccount);
  
  res.status(201).json({ message: 'Användare skapad', user: newUser });
});

// Endpoint: Logga in (skapa session)
app.post('/sessions', (req, res) => {
  const { username, password } = req.body;
  
  // Hitta användaren
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Felaktiga inloggningsuppgifter' });
  }
  
  // Skapa ett engångslösenord (OTP)
  const otp = Math.random().toString(36).substring(2, 10);
  
  // Spara sessionen
  const newSession = { userId: user.id, otp };
  sessions.push(newSession);
  
  res.json({ message: 'Inloggning lyckades', otp });
});

// Endpoint: Visa saldo
app.post('/me/accounts', (req, res) => {
  const { otp } = req.body;
  
  // Kontrollera sessionen
  const session = sessions.find(s => s.otp === otp);
  if (!session) {
    return res.status(403).json({ message: 'Ogiltig session' });
  }
  
  // Hitta användarens konto
  const userAccount = accounts.find(acc => acc.userId === session.userId);
  if (!userAccount) {
    return res.status(404).json({ message: 'Konto hittades inte' });
  }
  
  res.json({ balance: userAccount.balance });
});

// Endpoint: Sätt in pengar
app.post('/me/accounts/transactions', (req, res) => {
  const { otp, amount } = req.body;
  
  // Kontrollera sessionen
  const session = sessions.find(s => s.otp === otp);
  if (!session) {
    return res.status(403).json({ message: 'Ogiltig session' });
  }
  
  // Hitta användarens konto
  const userAccount = accounts.find(acc => acc.userId === session.userId);
  if (!userAccount) {
    return res.status(404).json({ message: 'Konto hittades inte' });
  }
  
  // Sätt in pengarna
  userAccount.balance += amount;
  
  res.json({ message: 'Transaktion lyckades', newBalance: userAccount.balance });
});

// Starta servern
app.listen(PORT, () => {
  console.log(`Backend-servern körs på http://localhost:${PORT}`);
});
*/

//backend MYSQL
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Konfigurera miljövariabler
dotenv.config();

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Skapa en anslutning till databasen
let connection;
async function initializeDatabaseConnection() {
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });
    console.log('Ansluten till MySQL-databasen');
  } catch (error) {
    console.error('Kunde inte ansluta till databasen:', error);
  }
}
initializeDatabaseConnection();

// Endpoint: Skapa användare
app.post('/users', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Kontrollera om användaren redan finns i databasen
    const [existingUser] = await connection.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Användarnamnet är redan upptaget' });
    }

    // Lägg till den nya användaren i databasen
    const [result] = await connection.execute(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, password]
    );

    // Hämta det nyss skapade användar-ID:t
    const newUserId = result.insertId;

    // Skapa ett konto för den nya användaren
    await connection.execute(
      'INSERT INTO accounts (userId, balance) VALUES (?, 0)',
      [newUserId]
    );

    res.status(201).json({ message: 'Användare skapad', userId: newUserId });
  } catch (error) {
    console.error('Fel vid skapande av användare:', error);
    res.status(500).json({ message: 'Serverfel' });
  }
});

// Endpoint: Logga in (skapa session)
app.post('/sessions', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Kontrollera användaren i databasen
    const [user] = await connection.execute(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );

    if (user.length === 0) {
      return res.status(401).json({ message: 'Felaktiga inloggningsuppgifter' });
    }

    const userId = user[0].id;

    // Skapa ett engångslösenord (OTP)
    const otp = Math.random().toString(36).substring(2, 10);

    // Lägg till sessionen i databasen
    await connection.execute(
      'INSERT INTO sessions (userId, otp) VALUES (?, ?)',
      [userId, otp]
    );

    res.json({ message: 'Inloggning lyckades', otp });
  } catch (error) {
    console.error('Fel vid inloggning:', error);
    res.status(500).json({ message: 'Serverfel' });
  }
});

// Endpoint: Visa saldo
app.post('/me/accounts', async (req, res) => {
  const { otp } = req.body;

  try {
    // Kontrollera sessionen i databasen
    const [session] = await connection.execute(
      'SELECT * FROM sessions WHERE otp = ?',
      [otp]
    );

    if (session.length === 0) {
      return res.status(403).json({ message: 'Ogiltig session' });
    }

    const userId = session[0].userId;

    // Hämta användarens saldo från kontotabellen
    const [account] = await connection.execute(
      'SELECT * FROM accounts WHERE userId = ?',
      [userId]
    );

    if (account.length === 0) {
      return res.status(404).json({ message: 'Konto hittades inte' });
    }

    res.json({ balance: account[0].balance });
  } catch (error) {
    console.error('Fel vid hämtning av saldo:', error);
    res.status(500).json({ message: 'Serverfel' });
  }
});

// Endpoint: Sätt in pengar
app.post('/me/accounts/transactions', async (req, res) => {
  const { otp, amount } = req.body;

  try {
    // Kontrollera sessionen i databasen
    const [session] = await connection.execute(
      'SELECT * FROM sessions WHERE otp = ?',
      [otp]
    );

    if (session.length === 0) {
      return res.status(403).json({ message: 'Ogiltig session' });
    }

    const userId = session[0].userId;

    // Hämta användarens konto
    const [account] = await connection.execute(
      'SELECT * FROM accounts WHERE userId = ?',
      [userId]
    );

    if (account.length === 0) {
      return res.status(404).json({ message: 'Konto hittades inte' });
    }

    const newBalance = account[0].balance + amount;

    // Uppdatera användarens saldo i databasen
    await connection.execute(
      'UPDATE accounts SET balance = ? WHERE userId = ?',
      [newBalance, userId]
    );

    res.json({ message: 'Transaktion lyckades', newBalance });
  } catch (error) {
    console.error('Fel vid insättning av pengar:', error);
    res.status(500).json({ message: 'Serverfel' });
  }
});

// Starta servern
app.listen(PORT, () => {
  console.log(`Backend-servern körs på http://localhost:${PORT}`);
});



//BACKEND C2
/*
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid'; // För att generera unika sessionstoken

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://ec2-13-60-45-252.eu-north-1.compute.amazonaws.com:3000'],
  credentials: true,
}));
app.use(express.json()); // Använder inbyggd json-parser

// Arrayer för att lagra användare, konton och sessioner
const users = [];
const accounts = [];
const sessions = [];

// Endpoint: Skapa användare
app.post('/users', async (req, res) => {
  const { username, password } = req.body;

  // Kontrollera om användaren redan finns
  if (users.some(user => user.username === username)) {
    return res.status(400).json({ message: 'Användarnamnet är redan upptaget' });
  }

  // Hasha lösenordet
  const hashedPassword = await bcrypt.hash(password, 10);

  // Skapa ny användare
  const newUser = { id: users.length + 1, username, password: hashedPassword };
  users.push(newUser);

  // Skapa ett konto för den nya användaren
  const newAccount = { userId: newUser.id, balance: 0 };
  accounts.push(newAccount);

  res.status(201).json({ message: 'Användare skapad', user: { id: newUser.id, username: newUser.username } });
});

// Endpoint: Logga in (skapa session)
app.post('/sessions', async (req, res) => {
  const { username, password } = req.body;

  // Hitta användaren
  const user = users.find(u => u.username === username);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Felaktiga inloggningsuppgifter' });
  }

  // Skapa ett unikt sessionstoken
  const otp = uuidv4();

  // Spara sessionen
  const newSession = { userId: user.id, otp };
  sessions.push(newSession);

  res.json({ message: 'Inloggning lyckades', otp });
});

// Endpoint: Visa saldo
app.post('/me/accounts', (req, res) => {
  const { otp } = req.body;

  // Kontrollera sessionen
  const session = sessions.find(s => s.otp === otp);
  if (!session) {
    return res.status(403).json({ message: 'Ogiltig session' });
  }

  // Hitta användarens konto
  const userAccount = accounts.find(acc => acc.userId === session.userId);
  if (!userAccount) {
    return res.status(404).json({ message: 'Konto hittades inte' });
  }

  res.json({ balance: userAccount.balance });
});

// Endpoint: Sätt in pengar
app.post('/me/accounts/transactions', (req, res) => {
  const { otp, amount } = req.body;

  // Kontrollera sessionen
  const session = sessions.find(s => s.otp === otp);
  if (!session) {
    return res.status(403).json({ message: 'Ogiltig session' });
  }

  // Hitta användarens konto
  const userAccount = accounts.find(acc => acc.userId === session.userId);
  if (!userAccount) {
    return res.status(404).json({ message: 'Konto hittades inte' });
  }

  // Sätt in pengarna
  userAccount.balance += amount;

  res.json({ message: 'Transaktion lyckades', newBalance: userAccount.balance });
});

// Starta servern
app.listen(PORT, () => {
  console.log(`Backend-servern körs på http://localhost:${PORT}`);
});
*/