const themeMap = {
    dark: "light",
    light: "solar",
    solar: "dark"
  };
  
  const theme = localStorage.getItem('theme')
    || (tmp = Object.keys(themeMap)[0],
        localStorage.setItem('theme', tmp),
        tmp);
  const bodyClass = document.body.classList;
  bodyClass.add(theme);
  
  function toggleTheme() {
    const current = localStorage.getItem('theme');
    const next = themeMap[current];
  
    bodyClass.replace(current, next);
    localStorage.setItem('theme', next);
  }
  
  document.getElementById('themeButton').onclick = toggleTheme;

  document.addEventListener('DOMContentLoaded', () => {
    const imageContainer = document.querySelector('.image-container img');
  
    // Reset and restart animation instantly
    imageContainer.style.animation = 'none'; // Reset animation
    void imageContainer.offsetWidth; // Trigger reflow
    imageContainer.style.animation = 'scrollImages 20s linear infinite'; // Restart animation
  });
  