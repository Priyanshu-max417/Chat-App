// Lightweight inline icon set — no external icon library needed.
// Pure presentational components; no logic/behavior included.

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function IconPhone(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 4.5c0 8.284 6.716 15 15 15l2-3.2a1.6 1.6 0 0 0-.7-2.2l-3.6-1.7a1.6 1.6 0 0 0-1.85.4l-.95 1.15a11.2 11.2 0 0 1-4.9-4.9l1.15-.95a1.6 1.6 0 0 0 .4-1.85L9.4 3.2a1.6 1.6 0 0 0-2.2-.7L4.5 4.5Z" />
    </svg>
  );
}

export function IconVideo(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="6.5" width="12.5" height="11" rx="2.2" />
      <path d="M15.5 10.3 20.2 7.3a.9.9 0 0 1 1.3.8v7.8a.9.9 0 0 1-1.3.8l-4.7-3v-6.4Z" />
    </svg>
  );
}

export function IconSend(props) {
  return (
    <svg {...base} {...props}>
      <path d="M21 3 3 10.5l7 2.5m0 0 2.5 7L21 3M10 13l7-7" />
    </svg>
  );
}

export function IconAttach(props) {
  return (
    <svg {...base} {...props}>
      <path d="M17.5 8.5 9.9 16.1a3.2 3.2 0 0 1-4.5-4.5l8.4-8.4a2.4 2.4 0 0 1 3.4 3.4L9.2 14.6" />
    </svg>
  );
}

export function IconPlus(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconLogout(props) {
  return (
    <svg {...base} {...props}>
      <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M15 16l4-4-4-4M19 12H9" />
    </svg>
  );
}

export function IconSearch(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.8-4.8" />
    </svg>
  );
}

export function IconClose(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function IconChevronLeft(props) {
  return (
    <svg {...base} {...props}>
      <path d="M15 5 8 12l7 7" />
    </svg>
  );
}

export function IconCheck(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12.5 9.5 17 19 6.5" />
    </svg>
  );
}

export function IconCheckCheck(props) {
  return (
    <svg {...base} {...props}>
      <path d="M2.5 12.5 7 17 13 10" />
      <path d="M9.5 12.5 14 17 21.5 6.5" />
    </svg>
  );
}

export function IconFile(props) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3.5h7l3.5 3.5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" />
      <path d="M14 3.5V7a1 1 0 0 0 1 1h3.5" />
    </svg>
  );
}

export function IconUsers(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9.5" r="2.4" />
      <path d="M15.5 13.2a4.6 4.6 0 0 1 5 4.3" />
    </svg>
  );
}
