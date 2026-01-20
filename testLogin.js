import crypto from 'crypto';

// Hash password using SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function testLogin() {
  try {
    const email = 'pranavsaikumar777@gmail.com';
    const password = 'okay bro';
    
    console.log('🔐 Testing login for:', email);
    console.log('🔑 Password:', password);
    console.log('🔒 Hashed password:', hashPassword(password));
    
    const response = await fetch('https://inter-backend-lpmb.onrender.com/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('User data:', data);
    } else {
      console.log('❌ Login failed:', response.status, data);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLogin();
