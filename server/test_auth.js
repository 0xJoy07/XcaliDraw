const http = require('http');

async function test() {
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@test.com', password: 'password' })
  });
  
  const cookies = loginRes.headers.get('set-cookie');
  console.log('Login status:', loginRes.status);
  console.log('Set-Cookie:', cookies);

  const refreshRes = await fetch('http://localhost:5000/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Cookie': cookies
    }
  });

  const refreshJson = await refreshRes.json();
  console.log('Refresh status:', refreshRes.status);
  console.log('Refresh response:', refreshJson);
}

test();
