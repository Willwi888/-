import React, { useMemo, useRef, useEffect, useState } from 'react';
import { TimedLyric } from '../types';
import { ColorPalette } from '../styles/colors';

interface TurntableLyricsProps {
  timedLyrics: TimedLyric[];
  activeIndex: number;
  colorPalette: ColorPalette;
  isPlaying: boolean;
}

const TurntableLyrics: React.FC<TurntableLyricsProps> = ({ timedLyrics, activeIndex, colorPalette, isPlaying }) => {
  const lyricData = useMemo(() => {
    const fullText = timedLyrics.map(l => l.text).join('   ');
    const positions = timedLyrics.reduce((acc, lyric) => {
      const lastPos = acc.length > 0 ? acc[acc.length - 1].end : 0;
      const start = lastPos === 0 ? 0 : lastPos + 3; // +3 for spaces
      const end = start + lyric.text.length;
      acc.push({ start, end });
      return acc;
    }, [] as {start: number, end: number}[]);

    return { fullText, positions };
  }, [timedLyrics]);

  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (activeIndex !== -1 && lyricData.fullText.length > 0) {
      const activePos = lyricData.positions[activeIndex];
      const midCharIndex = activePos.start + (activePos.end - activePos.start) / 2;
      const angle = (midCharIndex / lyricData.fullText.length) * 360;
      // Target angle is -90 degrees (top of the circle)
      setRotation(-angle);
    }
  }, [activeIndex, lyricData]);


  const FONT_SIZE = 1.2;
  const RADIUS = 20; // in em
  const VIEWBOX_SIZE = RADIUS * 2.5;

  const { fullText, positions } = lyricData;
  const activePos = activeIndex !== -1 ? positions[activeIndex] : null;

  return (
    <div className="w-full h-full flex items-center justify-center">
        <svg viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`} className="w-full h-full max-w-[80vh] max-h-[80vh]" style={{ fontSize: `${FONT_SIZE}rem` }}>
        <defs>
          <path
            id="lyric-path"
            fill="none"
            d={`
              M ${VIEWBOX_SIZE / 2}, ${VIEWBOX_SIZE / 2 - RADIUS}
              a ${RADIUS},${RADIUS} 0 1,1 0,${RADIUS * 2}
              a ${RADIUS},${RADIUS} 0 1,1 0,-${RADIUS * 2}
            `}
          />
        </defs>
        
        {/* Disc background */}
        <g transform={`translate(${VIEWBOX_SIZE/2} ${VIEWBOX_SIZE/2})`} className={`${isPlaying ? 'animate-spin-slow' : ''}`}>
            <circle cx="0" cy="0" r={RADIUS * 0.9} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
             <circle cx="0" cy="0" r={RADIUS * 0.88} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
            <circle cx="0" cy="0" r={RADIUS * 0.4} fill="rgba(0,0,0,0.3)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.2" />
            <circle cx="0" cy="0" r={RADIUS * 0.38} fill="rgba(0,0,0,0.5)" />
        </g>

        {/* Text */}
        <g 
          transform={`rotate(${rotation} ${VIEWBOX_SIZE / 2} ${VIEWBOX_SIZE / 2})`}
          style={{ transformOrigin: 'center', transition: 'transform 0.8s cubic-bezier(0.65, 0, 0.35, 1)' }}
        >
          <text textAnchor="middle" style={{ fontSize: '1em', letterSpacing: '0.1em' }} fill={colorPalette.base}>
            <textPath href="#lyric-path" startOffset="50%">
              {activePos ? (
                <>
                  <tspan>{fullText.substring(0, activePos.start)}</tspan>
                  <tspan fill={colorPalette.highlight} fontWeight="bold">{fullText.substring(activePos.start, activePos.end)}</tspan>
                  <tspan>{fullText.substring(activePos.end)}</tspan>
                </>
              ) : (
                <tspan>{fullText}</tspan>
              )}
            </textPath>
          </text>
        </g>
         {/* Top indicator */}
        <path d={`M ${VIEWBOX_SIZE/2 - 1} ${VIEWBOX_SIZE/2 - RADIUS - 2} L ${VIEWBOX_SIZE/2} ${VIEWBOX_SIZE/2 - RADIUS} L ${VIEWBOX_SIZE/2 + 1} ${VIEWBOX_SIZE/2 - RADIUS - 2}`} fill={colorPalette.highlight} />

        <style>{`
          @keyframes spin-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
              animation: spin-slow 30s linear infinite;
          }
        `}</style>

      </svg>
    </div>
  );
};

export default TurntableLyrics;
