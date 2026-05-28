export function getOAuthSandboxHTML({ callbackUrl }) {
  const brandColor = '#4285F4';
  const logoSvg = `<svg width="24" height="24" viewBox="0 0 24 24"><path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114A5.99 5.99 0 0 1 8 12.5a5.99 5.99 0 0 1 5.99-6.012c1.49 0 2.852.54 3.906 1.432l3.208-3.208C19.182 2.89 16.792 2 13.99 2 8.196 2 3.5 6.7 3.5 12.5S8.196 23 13.99 23c5.32 0 9.873-3.823 9.873-10.5 0-.71-.08-1.423-.223-2.215H12.24Z"/></svg>`;

  const mockUsers = [
    { name: 'Alex Rivera', email: 'alex.rivera@example.com', picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { name: 'Marcus Chen', email: 'marcus.chen@example.com', picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { name: 'Elena Rostova', email: 'elena.r@example.com', picture: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' }
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OAuth Sandbox — StreamVault</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0B0B0F;
      --card-bg: rgba(20, 20, 28, 0.6);
      --border: rgba(255, 255, 255, 0.08);
      --text: #F3F4F6;
      --text-muted: #9CA3AF;
      --brand: ${brandColor};
      --streamvault: #D4A017;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    
    body {
      background-color: var(--bg);
      color: var(--text);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      overflow: hidden;
      position: relative;
    }
    
    body::before {
      content: '';
      position: absolute;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(212, 160, 23, 0.15) 0%, transparent 70%);
      top: -100px;
      left: -100px;
      z-index: 0;
    }
    
    body::after {
      content: '';
      position: absolute;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%);
      bottom: -100px;
      right: -100px;
      z-index: 0;
    }
    
    .container {
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 460px;
      padding: 24px;
    }
    
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 32px;
      backdrop-filter: blur(20px);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      text-align: center;
    }
    
    .logo-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .logo-badge {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .connector-line {
      width: 32px;
      height: 2px;
      background: linear-gradient(90deg, var(--brand) 0%, var(--streamvault) 100%);
      border-radius: 1px;
    }
    
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    
    p.subtitle {
      font-size: 14px;
      color: var(--text-muted);
      margin-bottom: 28px;
      line-height: 1.5;
    }
    
    .permissions-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 16px;
      text-align: left;
      margin-bottom: 28px;
    }
    
    .permissions-box h3 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 12px;
    }
    
    .permission-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 13px;
      margin-bottom: 10px;
      color: var(--text);
    }
    
    .permission-item:last-child { margin-bottom: 0; }
    
    .permission-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--brand);
      margin-top: 6px;
      flex-shrink: 0;
    }
    
    .user-selectors {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }
    
    .user-option {
      display: flex;
      align-items: center;
      gap: 14px;
      background: rgba(255, 255, 255, 0.04);
      border: 1.5px solid var(--border);
      border-radius: 14px;
      padding: 12px 16px;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
    }
    
    .user-option:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: var(--brand);
      transform: translateY(-2px);
    }
    
    .user-option.selected {
      background: rgba(255, 255, 255, 0.08);
      border-color: var(--brand);
      box-shadow: 0 0 12px rgba(255, 255, 255, 0.05);
    }
    
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--border);
    }
    
    .user-info { flex: 1; }
    .user-name { font-size: 14px; font-weight: 600; }
    .user-email { font-size: 12px; color: var(--text-muted); }
    
    .btn-group { display: flex; gap: 12px; }
    
    .btn {
      flex: 1;
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }
    
    .btn-primary { background: var(--brand); color: white; }
    .btn-primary:hover { opacity: 0.9; transform: scale(1.02); }
    
    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-muted);
      border: 1px solid var(--border);
    }
    
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); color: white; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo-header">
        <div class="logo-badge" style="border-color: var(--brand)">
          ${logoSvg}
        </div>
        <div class="connector-line"></div>
        <div class="logo-badge" style="border-color: var(--streamvault)">
          <span style="font-weight: 800; color: var(--streamvault); font-size: 18px;">SV</span>
        </div>
      </div>
      
      <h1>Authorize StreamVault</h1>
      <p class="subtitle">StreamVault is requesting permission to access your public profile and email address using your Google Account.</p>
      
      <div class="permissions-box">
        <h3>Permissions Requested</h3>
        <div class="permission-item">
          <div class="permission-dot"></div>
          <div><strong>Personal Info:</strong> Access your name and profile avatar image</div>
        </div>
        <div class="permission-item">
          <div class="permission-dot"></div>
          <div><strong>Email Address:</strong> Access your verified primary email address</div>
        </div>
      </div>

      <div class="user-selectors">
        <h4 style="text-align: left; font-size: 12px; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">Select a Sandbox Identity</h4>
        ${mockUsers.map((u, i) => `
          <div class="user-option ${i === 0 ? 'selected' : ''}" onclick="selectUser(${i}, '${u.name}', '${u.email}', '${u.picture}')">
            <img class="avatar" src="${u.picture}" alt="${u.name}">
            <div class="user-info">
              <div class="user-name">${u.name}</div>
              <div class="user-email">${u.email}</div>
            </div>
          </div>
        `).join('')}
      </div>

      <form id="oauthForm" action="${callbackUrl}" method="GET">
        <input type="hidden" name="code" id="codeField" value="mock_auth_code">
        <input type="hidden" name="sandbox" value="true">
        <input type="hidden" name="name" id="nameField" value="${mockUsers[0].name}">
        <input type="hidden" name="email" id="emailField" value="${mockUsers[0].email}">
        <input type="hidden" name="picture" id="pictureField" value="${mockUsers[0].picture}">
        
        <div class="btn-group">
          <button type="button" class="btn btn-secondary" onclick="window.location.href='http://localhost:5173/login'">Cancel</button>
          <button type="submit" class="btn btn-primary">Authorize & Continue</button>
        </div>
      </form>
    </div>
  </div>

  <script>
    function selectUser(index, name, email, picture) {
      document.querySelectorAll('.user-option').forEach((opt, i) => {
        if (i === index) opt.classList.add('selected');
        else opt.classList.remove('selected');
      });
      document.getElementById('nameField').value = name;
      document.getElementById('emailField').value = email;
      document.getElementById('pictureField').value = picture;
      document.getElementById('codeField').value = 'mock_' + name.toLowerCase().replace(/\\s+/g, '_') + '_' + Date.now();
    }
  </script>
</body>
</html>`;
}