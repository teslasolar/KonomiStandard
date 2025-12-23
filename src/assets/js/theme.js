// Theme persistence
// Dark mode is default, but we save user preference
document.addEventListener('alpine:init', () => {
  // Check if user has a saved preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme !== null) {
    Alpine.store('dark', savedTheme === 'dark');
  }
});

// Watch for theme changes and save to localStorage
document.addEventListener('alpine:initialized', () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      }
    });
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
});
