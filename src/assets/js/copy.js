// Copy to clipboard functionality
document.addEventListener('DOMContentLoaded', () => {
  // Attach listeners to all copy buttons
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.dataset.copy;

      navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.textContent;
        btn.textContent = '✓';

        setTimeout(() => {
          btn.textContent = originalText;
        }, 1500);
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
    });
  });
});
