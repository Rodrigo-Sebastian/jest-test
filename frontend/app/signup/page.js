// app/signup/page.js
"use client";

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      // Skicka en POST-förfrågan till backend för att skapa användaren
      await axios.post('http://localhost:3001/users', { username, password });
      setMessage('Användare skapad. Du kan nu logga in.');

      // Navigera till inloggningssidan efter en kort paus
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      setMessage('Användarnamnet är redan upptaget. Försök med ett annat.');
    }
  };

  return (
    <div>
      <h1>Registrera dig</h1>
      <form onSubmit={handleSignup}>
        <div>
          <label>Användarnamn</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Lösenord</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Skapa användare</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
