// app/dashboard/page.js
"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Hämta saldo när sidan laddas
  useEffect(() => {
    const fetchBalance = async () => {
      const otp = sessionStorage.getItem('otp'); // Hämta OTP från sessionStorage

      try {
        // Skicka POST-förfrågan till backend för att hämta användarens saldo
        const response = await axios.post('http://localhost:3001/me/accounts', { otp });
        setBalance(response.data.balance);
      } catch (error) {
        setMessage('Kunde inte hämta saldo. Logga in igen.');
        setTimeout(() => router.push('/login'), 2000); // Navigera till inloggning efter timeout
      }
    };

    fetchBalance();
  }, [router]);

  // Hantera insättning av pengar
  const handleTransaction = async (e) => {
    e.preventDefault();
    const otp = sessionStorage.getItem('otp');

    try {
      // Skicka POST-förfrågan till backend för att göra en insättning
      const response = await axios.post('http://localhost:3001/me/accounts/transactions', { otp, amount: parseFloat(amount) });
      setBalance(response.data.newBalance);
      setMessage('Insättning lyckades!');
      setAmount(''); // Nollställ fältet
    } catch (error) {
      setMessage('Transaktionen misslyckades.');
    }
  };

  return (
    <div>
      <h1>Välkommen till din Dashboard</h1>
      <h2>Ditt saldo: {balance} kr</h2>
      <form onSubmit={handleTransaction}>
        <label>Belopp</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <button type="submit">Sätt in pengar</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}
