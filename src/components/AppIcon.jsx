const paths = {
  home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13v-9.5"/><path d="M9.5 20v-6h5v6"/></>,
  plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></>,
  chart: <><path d="M4 19V9"/><path d="M10 19V5"/><path d="M16 19v-7"/><path d="M22 19H2"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  water: <path d="M12 3s6 6.3 6 11a6 6 0 1 1-12 0c0-4.7 6-11 6-11Z"/>,
  flame: <path d="M13.5 3.2c.6 3.8-2.8 4.8-2.8 8.1 0 1.4.9 2.5 2.2 2.5 2.1 0 3.2-2.3 2.6-4.4 2.4 1.8 3.8 4.2 3.4 6.7-.5 3.1-3.2 5.4-6.6 5.4-4 0-7.1-2.9-7.1-6.8 0-4.7 4.1-7.4 8.3-11.5Z"/>,
  target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="m15 9 5-5"/></>,
  edit: <><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/><path d="m14.5 7 3 3"/></>,
  copy: <><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
  trash: <><path d="M4 7h16"/><path d="m9 7 .5-3h5l.5 3"/><path d="m6.5 7 1 14h9l1-14"/></>,
  chevron: <path d="m8 10 4 4 4-4"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  spark: <><path d="m12 2 1.4 4.6L18 8l-4.6 1.4L12 14l-1.4-4.6L6 8l4.6-1.4L12 2Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z"/></>,
  scale: <><path d="M5 5h14l2 16H3L5 5Z"/><circle cx="12" cy="10" r="3"/><path d="m12 10 2-1"/></>,
  download: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 21h16"/></>,
  upload: <><path d="M12 17V5"/><path d="m7 10 5-5 5 5"/><path d="M4 21h16"/></>,
  moon: <path d="M20 15.5A8 8 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>,
  logout: <><path d="M10 5H5v14h5"/><path d="M14 8l4 4-4 4"/><path d="M8 12h10"/></>,
};

export default function AppIcon({ name, size = 20, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.spark}
    </svg>
  );
}
