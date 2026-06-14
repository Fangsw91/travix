// Create Admin User via Console
// Open browser console and run this:

fetch('http://localhost:8000/api/auth/register', {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
    body: JSON.stringify({
        name: 'Admin User',
        email: 'admin@travix.com',
        password: 'admin123',
        password_confirmation: 'admin123',
        role: 'admin',  // This creates an admin user
        phone: '+962777000000'
    })
})
.then(r => r.json())
.then(d => {
    console.log('✅ Admin user created!');
    console.log('📧 Email: admin@travix.com');
    console.log('🔑 Password: admin123');
    console.log('Response:', d);
})
.catch(e => console.error('Error:', e));
