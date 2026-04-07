// Main application entry - glues everything together
document.addEventListener('DOMContentLoaded', () => {
  // Add extra glitch effects
  const style = document.createElement('style');
  style.textContent = `
    .glitch-wrapper:hover .glitch {
      animation: glitch 200ms infinite;
    }
    .terminal-input:focus {
      caret-color: #0f0;
    }
    #message-input::placeholder {
      color: #0a0;
      opacity: 0.5;
    }
    .loading {
      padding: 1rem;
      text-align: center;
      animation: blink 1s infinite;
    }
  `;
  document.head.appendChild(style);

  // Auto-focus on input when chat screen shown
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mut) => {
      if (mut.target.id === 'chat-screen' && mut.target.classList.contains('active')) {
        document.getElementById('message-input')?.focus();
      }
    });
  });
  observer.observe(document.getElementById('chat-screen'), { attributes: true });

  // Prevent accidental form submissions
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && input.type !== 'textarea') {
        e.preventDefault();
        if (input.closest('#auth-screen')) {
          document.getElementById('login-btn')?.click();
        }
      }
    });
  });

  // Click outside modal to close
  document.getElementById('profile-modal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('profile-modal')) {
      document.getElementById('profile-modal').classList.add('hidden');
    }
  });
});

// Global error handler
window.addEventListener('error', (e) => {
  console.error('TERMINAL ERROR:', e.error);
});