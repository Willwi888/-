import React, { useMemo } from 'react';
import { TimedLyric } from '../types';
import { ColorPalette } from '../styles/colors';

type LyricAlignment = 'items-start text-left' | 'items-center text-center' | 'items-end text-right';

interface PerspectiveLyricsProps {
  timedLyrics: TimedLyric[];
  activeIndex: number;
  colorPalette: ColorPalette;
  fontSize: number;
  alignment: LyricAlignment;
}

const PerspectiveLyrics: React.FC<PerspectiveLyricsProps> = ({ timedLyrics, activeIndex, colorPalette, fontSize, alignment }) => {
  const line_height_rem = fontSize * 1.5;
  const yOffset = activeIndex !== -1 ? -activeIndex * line_height_rem : 0;

  const rotationStyle = useMemo(() => {
    if (alignment.includes('text-left')) return 'rotateX(15deg) rotateY(-20deg)';
    if (alignment.includes('text-right')) return 'rotateX(15deg) rotateY(20deg)';
    return 'rotateX(20deg)';
  }, [alignment]);
  
  const textAlign = useMemo(() => {
    if (alignment.includes('text-left')) return 'left';
    if (alignment.includes('text-right')) return 'right';
    return 'center';
  }, [alignment]);


  return (
    <div 
      className="h-[70vh] w-full flex flex-col justify-center overflow-hidden lyrics-container-perspective" 
      style={{ perspective: '800px' }}
    >
      <div 
        className="w-full transition-transform duration-500 ease-out" 
        style={{ 
          transform: `translateY(${yOffset}rem) ${rotationStyle}`,
          transformStyle: 'preserve-3d',
          textAlign: textAlign,
        }}
      >
        {timedLyrics.map((lyric, index) => {
          const isActive = index === activeIndex;
          const distance = Math.abs(index - activeIndex);

          const opacity = isActive ? 1 : Math.max(0, 0.7 - distance * 0.15);

          const textStyle: React.CSSProperties = {
            color: isActive ? colorPalette.highlight : colorPalette.base,
            transition: 'all 0.5s ease-out',
            fontWeight: isActive ? 'bold' : 'normal',
            opacity: opacity,
            fontSize: `${fontSize}rem`,
            lineHeight: `${line_height_rem}rem`,
            textShadow: isActive ? `0 0 15px ${colorPalette.highlight}` : 'none',
          };
          return <p key={index} style={textStyle}>{lyric.text}</p>
        })}
      </div>
       <style>{`
        .lyrics-container-perspective {
          mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            black 20%,
            black 80%,
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to bottom,
            transparent 0%,
            black 20%,
            black 80%,
            transparent 100%
          );
        }
      `}</style>
    </div>
  );
};

export default PerspectiveLyrics;
