// EcoBud logo: a coin with a bud growing out of it ("bud" means bourgeon); colors come from the theme
export default function Logo({ size = 38 }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="40" r="19" fill="var(--logo-coin)" />
      <circle cx="32" cy="40" r="13" fill="none" stroke="var(--logo-ring)" strokeWidth="2.5" strokeOpacity="0.55" />
      <path d="M32 21V12" stroke="var(--logo-coin)" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M32 14C24 14 19 9 19 3C27 3 32 7 32 14Z" fill="var(--logo-coin)" />
      <path d="M32 12C38 12 44 8 45 2C38 2 32 5 32 12Z" fill="var(--logo-leaf)" />
    </svg>
  );
}
