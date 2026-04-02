@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,700;12..96,800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');

:root {
  --font-bricolage: 'Bricolage Grotesque', sans-serif;
  --font-dm-sans: 'DM Sans', sans-serif;
}

* { box-sizing: border-box; }

body {
  font-family: var(--font-dm-sans);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

/* ── Scroll reveal ── */
.reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.55s ease, transform 0.55s ease;
}
.reveal.visible {
  opacity: 1;
  transform: translateY(0);
}

/* ── Hero bar animation ── */
.bar-animated {
  animation: barGrow 1.4s cubic-bezier(0.4, 0, 0.2, 1) both;
}
@keyframes barGrow {
  from { width: 0 !important; }
}

/* ── AI message streaming cursor ── */
.streaming-cursor::after {
  content: '▋';
  animation: blink 1s infinite;
  margin-left: 2px;
  font-size: 0.85em;
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
