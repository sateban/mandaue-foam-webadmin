/* login.js */
window.Login = (() => {
  function mount(container) {
    container.innerHTML = `
      <div class="login-card">
        <div class="login-logo">
          <div class="login-logo-icon">
            <img src="assets/logo.png" alt="Mandaue Foam logo">
          </div>
          <div class="login-logo-text">
            <h2>AR Admin</h2>
            <span>Mandaue Foam</span>
          </div>
        </div>
        <h1>Welcome Back</h1>
        <p class="sub">Sign in to access the administrator panel.</p>
        
        <form id="login-form" class="login-form" onsubmit="event.preventDefault()">
          <div class="form-group">
            <label class="form-label">Email Address</label>
            <div class="input-group">
              <svg class="input-group-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <input type="email" id="login-email" class="input" placeholder="admin@mandaue.com" required />
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Password</label>
            <div class="input-group">
              <svg class="input-group-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <input type="password" id="login-pw" class="input" placeholder="••••••••" required />
            </div>
            <div class="login-forgot">Forgot password?</div>
          </div>
          
          <button type="submit" class="btn btn-primary" id="login-submit">
            <span>Sign In</span>
          </button>
        </form>
      </div>
    `;

    document.getElementById('login-form').addEventListener('submit', async (e) => {
      const email = document.getElementById('login-email').value.trim();
      const pass = document.getElementById('login-pw').value;
      const btn = document.getElementById('login-submit');

      btn.disabled = true;
      btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg> Signing in...`;

      try {
        await FirebaseService.signIn(email, pass);
        // App.js listener will auto-redirect on auth state change
      } catch (err) {
        Toast.error(err.message || 'Authentication failed');
        btn.disabled = false;
        btn.innerHTML = `<span>Sign In</span>`;
      }
    });
  }

  function unmount() {
    document.getElementById('login-view').innerHTML = '';
  }

  return { mount, unmount };
})();
