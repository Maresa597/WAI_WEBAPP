const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return setMessage('loginMessage', data.message || 'Login failed.', 'error');
      }

      localStorage.setItem('waiUser', JSON.stringify(data));

      if (data.role === 'admin') {
        window.location.href = '/admin/dashboard.html';
      } else {
        window.location.href = '/user/dashboard.html';
      }
    } catch (error) {
      setMessage('loginMessage', 'Cannot connect to the server.', 'error');
    }
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const fullName = document.getElementById('full_name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return setMessage('registerMessage', data.message || 'Registration failed.', 'error');
      }

      setMessage('registerMessage', 'Registration successful. You can now log in.', 'ok');
    } catch (error) {
      setMessage('registerMessage', 'Cannot connect to the server.', 'error');
    }
  });
}
