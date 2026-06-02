// Theme mapping: dark -> light -> solar -> dark
const themeMap = {
  dark: "light",
  light: "solar",
  solar: "dark"
};

// Get stored theme or set default to dark
let initialTheme = localStorage.getItem('theme');
if (!initialTheme || !themeMap[initialTheme]) {
  initialTheme = 'light';
  localStorage.setItem('theme', initialTheme);
}

// Add the initial theme class to the body
document.body.classList.add(initialTheme);

// Function to update the theme icon on the button
function updateThemeIcon(currentTheme) {
  const icon = document.querySelector('#themeButton i');
  if (!icon) return;
  
  if (currentTheme === 'light') {
    icon.className = 'fa-solid fa-sun';
  } else if (currentTheme === 'dark') {
    icon.className = 'fa-solid fa-moon';
  } else if (currentTheme === 'solar') {
    icon.className = 'fa-solid fa-palette';
  }
}

// Function to toggle the theme
function toggleTheme() {
  const current = localStorage.getItem('theme') || 'light';
  const next = themeMap[current];

  document.body.classList.replace(current, next);
  localStorage.setItem('theme', next);
  updateThemeIcon(next);
}

// DOM Setup on load
document.addEventListener('DOMContentLoaded', () => {
  // 1. Theme Button Initialization
  const themeBtn = document.getElementById('themeButton');
  if (themeBtn) {
    themeBtn.onclick = toggleTheme;
    // Set initial icon matching the current theme
    const current = localStorage.getItem('theme') || 'light';
    updateThemeIcon(current);
  }
  
  // 2. Mobile Hero Scrolling Image (Reset & restart animation instantly on mobile)
  const imageContainer = document.querySelector('.image-container img');
  if (imageContainer) {
    imageContainer.style.animation = 'none'; // Reset animation
    void imageContainer.offsetWidth; // Trigger reflow
    imageContainer.style.animation = 'scrollImages 50s linear infinite'; // Restart animation
  }

  // 3. AOS (Animate On Scroll) Initialization
  if (typeof AOS !== 'undefined') {
    AOS.init({
      duration: 1000,
      easing: 'ease-out-cubic',
      once: true,
      offset: 100
    });
  } else {
    console.warn('AOS library not loaded yet.');
  }

  // 4. Back to Top Button Logic
  const backToTopBtn = document.getElementById('backToTop');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('show');
      } else {
        backToTopBtn.classList.remove('show');
      }
    });

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
});