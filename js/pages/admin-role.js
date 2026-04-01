/* admin-role.js */
window.AdminRole = (() => {
  function mount(container) {
    const user = window.FirebaseService?.currentUser();
    const email = user ? user.email : 'admin@mandaue.com';
    const name = user ? (user.displayName || 'Admin') : 'System Admin';

    container.innerHTML = `
      <div class="page-header">
        <h1>Admin Role</h1>
      </div>

      <div class="admin-layout">
        <!-- Left: Profile Summary & Actions -->
        <div class="flex-col gap-4">
          <div class="card profile-card-center">
            <div class="profile-card-avatar" id="ar-avatar">
              ${name.charAt(0).toUpperCase()}
            </div>
            <h3 class="fw-700" style="font-size:16px">${name}</h3>
            <p class="text-xs text-muted mt-1">${email}</p>
            <div class="badge badge-primary mt-3">Super Administrator</div>
            
            <div class="profile-social">
              <div class="social-icon" style="background:var(--bg)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg></div>
              <div class="social-icon" style="background:var(--bg)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg></div>
              <div class="social-icon" style="background:var(--bg)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg></div>
            </div>
          </div>

          <div class="card">
            <div class="card-header"><h3>Change Password</h3></div>
            <div class="card-body form-group gap-4">
              <div>
                <label class="form-label">Current Password</label>
                <input type="password" class="input mt-1" />
              </div>
              <div>
                <label class="form-label">New Password</label>
                <input type="password" class="input mt-1" />
              </div>
              <div>
                <label class="form-label">Re-enter New Password</label>
                <input type="password" class="input mt-1" />
              </div>
              <button class="btn btn-outline w-full" style="justify-content:center" onclick="Toast.info('Password update requires re-authentication. Setup your Firebase Admin SDK to enable this.')">Update Password</button>
            </div>
          </div>
        </div>

        <!-- Right: Profile Settings -->
        <div class="card">
          <div class="card-header"><h3>Profile Update</h3></div>
          <div class="card-body">
            <div class="grid-2 mb-4">
              <div class="form-group">
                <label class="form-label">Name</label>
                <input type="text" class="input" value="${name}" />
              </div>
              <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" class="input" value="${email}" readonly style="background:var(--bg)" />
              </div>
            </div>
            
            <div class="grid-2 mb-4">
              <div class="form-group">
                <label class="form-label">Phone No.</label>
                <input type="text" class="input" placeholder="+63 917 123 4567" />
              </div>
              <div class="form-group">
                <label class="form-label">Date of Birth</label>
                <input type="date" class="input" />
              </div>
            </div>

            <div class="form-group mb-4">
              <label class="form-label">Location</label>
              <input type="text" class="input" value="Mandaue City, Cebu, Philippines" />
            </div>

            <div class="form-group mb-6">
              <label class="form-label">Biography</label>
              <textarea class="textarea" style="min-height:120px" placeholder="Write something about yourself..."></textarea>
            </div>

            <div class="flex items-center justify-end gap-2">
              <button class="btn btn-outline" onclick="window.location.hash='#/dashboard'">Cancel</button>
              <button class="btn btn-primary" onclick="Toast.success('Profile preferences saved locally.')">Save Changes</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return { mount, unmount: () => {} };
})();
