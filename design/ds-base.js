(() => {
  const base = '_ds/wawu';
  for (const p of ["tokens/fonts.css","tokens/colors.css","tokens/typography.css","tokens/spacing.css","tokens/radius.css","tokens/elevation.css","tokens/motion.css","tokens/base.css"]) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = base + '/' + p; document.head.appendChild(l);
  }
  
})();
