import React from 'react';

interface MatchScoreBarProps {
  totalScore: number;
  semanticScore: number;
  keywordScore: number;
  compact?: boolean;
}

function scoreLabel(score: number): string {
  if (score >= 70) return 'Strong Match';
  if (score >= 45) return 'Moderate Match';
  return 'Weak Match';
}

function scoreColor(score: number): string {
  if (score >= 70) return '#34d399';
  if (score >= 45) return '#fbbf24';
  return '#f87171';
}

function scoreBg(score: number): string {
  if (score >= 70) return 'rgba(52, 211, 153, 0.14)';
  if (score >= 45) return 'rgba(251, 191, 36, 0.14)';
  return 'rgba(248, 113, 113, 0.12)';
}

const barTrack = 'rgba(148, 163, 184, 0.12)';

const MatchScoreBar: React.FC<MatchScoreBarProps> = ({
  totalScore,
  semanticScore,
  keywordScore,
  compact = false,
}) => {
  const color = scoreColor(totalScore);
  const bg = scoreBg(totalScore);
  const label = scoreLabel(totalScore);

  return (
    <div style={{ minWidth: compact ? 120 : 210 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: compact ? 0 : 10 }}>
        <div
          style={{
            flex: 1,
            height: 9,
            borderRadius: 9999,
            background: barTrack,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(totalScore, 100)}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${color} 0%, ${color}dd 100%)`,
              borderRadius: 9999,
              transition: 'width 0.4s ease',
            }}
          />
        </div>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color,
            minWidth: 42,
            textAlign: 'right',
          }}
        >
          {totalScore.toFixed(1)}%
        </span>
      </div>

      {!compact && (
        <span
          style={{
            display: 'inline-block',
            fontSize: 11,
            fontWeight: 700,
            color,
            background: bg,
            borderRadius: 9999,
            padding: '4px 10px',
            marginBottom: 10,
          }}
        >
          {label}
        </span>
      )}

      {!compact && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 120 }}>Similar Skills Set</span>
            <div
              style={{
                flex: 1,
                height: 6,
                borderRadius: 9999,
                background: barTrack,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(semanticScore * 100, 100)}%`,
                  height: '100%',
                  background: '#fbbf24',
                  borderRadius: 9999,
                }}
              />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 32, textAlign: 'right' }}>
              {(semanticScore * 100).toFixed(0)}%
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 120 }}>Job Match</span>
            <div
              style={{
                flex: 1,
                height: 6,
                borderRadius: 9999,
                background: barTrack,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(keywordScore * 100, 100)}%`,
                  height: '100%',
                  background: '#818cf8',
                  borderRadius: 9999,
                }}
              />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', minWidth: 32, textAlign: 'right' }}>
              {(keywordScore * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchScoreBar;
