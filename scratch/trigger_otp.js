async function trigger() {
  try {
    const res = await fetch('http://localhost:4001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'luis.gongarza@gmail.com' })
    });
    const data = await res.json();
    console.log('OTP Trigger Response:', data);
  } catch (err) {
    console.error('Failed to trigger OTP:', err);
  }
}
trigger();
