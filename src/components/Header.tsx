'use client';

interface Props {
  totalRoles: number;
  isRunningDigest: boolean;
  onRunDigest: () => void;
  lastRunAt: string | null;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function RadarLogo() {
  return (
    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/50">
      <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none">
        <circle cx="12" cy="12" r="3"  stroke="currentColor" strokeOpacity="0.3"  strokeWidth="0.75" />
        <circle cx="12" cy="12" r="6"  stroke="currentColor" strokeOpacity="0.4"  strokeWidth="0.75" />
        <circle cx="12" cy="12" r="9"  stroke="currentColor" strokeOpacity="0.6"  strokeWidth="0.75" />

        <circle cx="15.5" cy="7" r="1.2" fill="currentColor" opacity="0">
          <animate attributeName="opacity" values="0;1;0.6;0.2;0;0" keyTimes="0;0.05;0.15;0.35;0.65;1" dur="5s" repeatCount="1" begin="0.4s" />
        </circle>
        <circle cx="17" cy="11" r="1" fill="currentColor" opacity="0">
          <animate attributeName="opacity" values="0;1;0.6;0.2;0;0" keyTimes="0;0.05;0.15;0.35;0.65;1" dur="5s" repeatCount="1" begin="0.9s" />
        </circle>
        <circle cx="9.5" cy="5.5" r="0.9" fill="currentColor" opacity="0">
          <animate attributeName="opacity" values="0;1;0.6;0.2;0;0" keyTimes="0;0.05;0.15;0.35;0.65;1" dur="5s" repeatCount="1" begin="4.6s" />
        </circle>

        <g>
          <path d="M 12 12 L 12 3 A 9 9 0 0 0 4.21 7.5 Z" fill="currentColor" fillOpacity="0.12" />
          <line x1="12" y1="12" x2="12" y2="3.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="5s" repeatCount="1" fill="freeze" />
        </g>

        <circle cx="12" cy="12" r="1.25" fill="currentColor" />
      </svg>
    </div>
  );
}

export default function Header({ totalRoles, isRunningDigest, onRunDigest, lastRunAt }: Props) {
  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <RadarLogo />
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-white text-xl tracking-tight">Scout</span>
              <span className="text-[11px] text-gray-500 font-medium tracking-wide uppercase">Powered by Claude</span>
            </div>
            <div className="flex items-center gap-3 ml-3 pl-3 border-l border-gray-800">
              <span className="text-xs text-gray-500">{totalRoles} role{totalRoles !== 1 ? 's' : ''}</span>
              {lastRunAt && (
                <span className="text-xs text-gray-500">Last run {formatRelative(lastRunAt)}</span>
              )}
            </div>
          </div>

          <button
            onClick={onRunDigest}
            disabled={isRunningDigest}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {isRunningDigest ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Searching…
              </>
            ) : (
              <>
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="7" cy="7" r="4.5" />
                  <line x1="10.5" y1="10.5" x2="14" y2="14" />
                </svg>
                Run Now
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
