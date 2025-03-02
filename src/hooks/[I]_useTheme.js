import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [season, setSeason] = useState('winter');

  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', season);

    if (season !== 'dark') {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `${process.env.PUBLIC_URL}/styles/${season}.css`;

      const oldLink = document.querySelector('link[href*="/styles/"][href$=".css"]');
      if (oldLink) {
        oldLink.remove();
      }

      document.head.appendChild(link);
    }
  }, [season]);

  const handleThemeChange = (newSeason) => {
    const themeRibbon = document.querySelector('.theme-ribbon');
    const currentLogo = document.querySelector('.logo-container img.active');
    const newLogo = document.querySelector(
      `.logo-container img[alt="${newSeason === 'winter' ? 'MU Logo' : newSeason === 'fall' ? 'US Biomass Logo' : 'Blue Parrot Logo'}"]`
    );
    const buttons = document.querySelectorAll('.theme-button');
    const targetButton =
      newSeason === 'dark' ? buttons[2] : newSeason === 'fall' ? buttons[0] : buttons[1];

    if (themeRibbon && themeRibbon.classList.contains('theme-transition')) {
      return;
    }

    if (themeRibbon) {
      const targetButtonRect = targetButton?.getBoundingClientRect();
      const ribbonRect = themeRibbon.getBoundingClientRect();
      const creativeButton = buttons[0]?.getBoundingClientRect();

      if (targetButtonRect && ribbonRect && creativeButton) {
        const startX = ribbonRect.right - targetButtonRect.right + 35;
        const startY = ribbonRect.bottom - targetButtonRect.bottom;
        const endX = ribbonRect.right - creativeButton.right + 35;
        const endY = ribbonRect.bottom - creativeButton.bottom;

        themeRibbon.style.setProperty('--glow-start-x', `${startX}px`);
        themeRibbon.style.setProperty('--glow-start-y', `${startY}px`);
        themeRibbon.style.setProperty('--glow-end-x', `${endX}px`);
        themeRibbon.style.setProperty('--glow-end-y', `${endY}px`);
        themeRibbon.style.setProperty('--transition-duration', '1.2s');
      }

      requestAnimationFrame(() => {
        themeRibbon.classList.add(newSeason === 'dark' ? 'to-dark' : 'to-light');
        themeRibbon.classList.add('theme-transition');

        if (currentLogo) {
          currentLogo.classList.add('fade-out');
          currentLogo.classList.remove('active');
        }

        if (newLogo) {
          setTimeout(() => {
            newLogo.classList.add('active');
          }, 300);
        }

        setTimeout(() => {
          themeRibbon.classList.remove('theme-transition', 'to-dark', 'to-light');
          if (currentLogo) {
            currentLogo.classList.remove('fade-out');
          }
        }, 1200);
      });
    }

    setSeason(newSeason);
    document.body.className = newSeason;

    if (newSeason === 'dark') {
      document.documentElement.style.setProperty('--primary-color', '#2196F3');
    } else if (newSeason === 'fall') {
      document.documentElement.style.setProperty('--primary-color', '#FF9800');
    } else {
      document.documentElement.style.setProperty('--primary-color', '#4CAF50');
    }
  };

  return { season, handleThemeChange };
};

export default useTheme;
