import React, { useState, useRef, useEffect, useMemo } from 'react';
import { TimedLyric } from '../types';
import KaraokeLyric from './KaraokeLyric';
import TurntableLyrics from './TurntableLyrics';
import PerspectiveLyrics from './PerspectiveLyrics';
import { ColorPalette, lyricColorPalettes } from '../styles/colors';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import PrevIcon from './icons/PrevIcon';
import AlignLeftIcon from './icons/AlignLeftIcon';
import AlignRightIcon from './icons/AlignRightIcon';
import PanIcon from './icons/PanIcon';
import VerticalLinesIcon from './icons/VerticalLinesIcon';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';
import ExportIcon from './icons/ExportIcon';
import VerticalLayoutIcon from './icons/VerticalLayoutIcon';
import DiscIcon from './icons/DiscIcon';
import BlurIcon from './icons/BlurIcon';
import GrainIcon from './icons/GrainIcon';
import PerspectiveIcon from './icons/PerspectiveIcon';
import Loader from './Loader';
import ExportSettingsModal, { ExportConfig } from './ExportSettingsModal';

declare const FFmpeg: any;

interface VideoPlayerProps {
  timedLyrics: TimedLyric[];
  audioUrl: string;
  audioFile: File | null;
  imageUrls: string[];
  videoUrl: string | null;
  onBack: () => void;
  songTitle: string;
  artistName: string;
}

type LyricAlignment = 'items-start text-left' | 'items-center text-center' | 'items-end text-right';
type VisualEffect = 'none' | 'subtle-pan' | 'rain' | 'blur' | 'grain';
type LyricStyle = 'karaoke' | 'vertical' | 'turntable' | 'perspective';
type ExportStatus = 'idle' | 'loading_ffmpeg' | 'preparing' | 'recording' | 'encoding' | 'done' | 'error';

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  timedLyrics,
  audioUrl,
  audioFile,
  imageUrls,
  videoUrl,
  onBack,
  songTitle,
  artistName,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const [colorPalette, setColorPalette] = useState<ColorPalette>(lyricColorPalettes[0]);
  const [fontSize, setFontSize] = useState(3.5); // Using rem units
  const [alignment, setAlignment] = useState<LyricAlignment>('items-center text-center');
  const [effect, setEffect] = useState<VisualEffect>('subtle-pan');
  const [showControls, setShowControls] = useState(true);
  const [lyricStyle, setLyricStyle] = useState<LyricStyle>('karaoke');

  const [exportStatus, setExportStatus] = useState<ExportStatus>('idle');
  const [exportMessage, setExportMessage] = useState('');
  const [showExportSettings, setShowExportSettings] = useState(false);
  const [ffmpegProgress, setFfmpegProgress] = useState(0);
  
  const ffmpegRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const activeLyricIndex = timedLyrics.findIndex(
    lyric => currentTime >= lyric.startTime && currentTime < lyric.endTime
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);
  
  // Load FFMPEG
  useEffect(() => {
    const loadFFmpeg = async () => {
        const { createFFmpeg } = FFmpeg;
        const ffmpegInstance = createFFmpeg({
            log: true,
            corePath: new URL('/@ffmpeg/core', window.location.origin).href,
        });
        ffmpegInstance.setProgress(({ ratio }: { ratio: number }) => {
            setFfmpegProgress(Math.round(ratio * 100));
        });
        await ffmpegInstance.load();
        ffmpegRef.current = ffmpegInstance;
    };
    loadFFmpeg();
  }, []);


  useEffect(() => {
    // Sync video playback with audio
    const video = videoRef.current;
    if (!video || !audioRef.current) return;
    if (isPlaying && video.paused) {
      video.play().catch(console.error);
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
    // Sync time
    if (Math.abs(video.currentTime - audioRef.current.currentTime) > 0.5) {
      video.currentTime = audioRef.current.currentTime;
    }
  }, [isPlaying, currentTime]);

  useEffect(() => {
    if (imageUrls.length <= 1 || !isPlaying) return;
    const imageChangeInterval = 10000; // Change image every 10 seconds
    const intervalId = setInterval(() => {
      setCurrentImageIndex(prevIndex => (prevIndex + 1) % imageUrls.length);
    }, imageChangeInterval);
    return () => clearInterval(intervalId);
  }, [isPlaying, imageUrls.length]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };
  
  const openExportModal = () => {
      if (!audioFile) {
          alert('音訊檔案遺失，無法匯出。');
          return;
      }
      setShowExportSettings(true);
  };

  const startExport = async (config: ExportConfig) => {
    setShowExportSettings(false);

    if (!ffmpegRef.current || !ffmpegRef.current.isLoaded()) {
        setExportStatus('loading_ffmpeg');
        setExportMessage('正在準備轉檔工具...');
        // Wait for it to load
        let checks = 0;
        while ((!ffmpegRef.current || !ffmpegRef.current.isLoaded()) && checks < 20) {
            await new Promise(res => setTimeout(res, 500));
            checks++;
        }
        if (!ffmpegRef.current.isLoaded()) {
            alert('無法載入轉檔工具，請稍後再試。');
            setExportStatus('idle');
            return;
        }
    }

    setExportStatus('preparing');
    setExportMessage('請授權錄製此分頁畫面...');

    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { 
                mediaSource: "browser",
                // Try to request high quality, though browser might ignore
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 }
            } as any, 
            audio: false // We use the original high-quality audio file
        });
        
        // Stop recording if the user clicks the browser's "Stop sharing" button
        stream.getVideoTracks()[0].onended = () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };

        if (playerContainerRef.current) {
             await playerContainerRef.current.requestFullscreen();
        }
        
        setShowControls(false);
        if (audioRef.current) audioRef.current.currentTime = 0;
        await new Promise(res => setTimeout(res, 500)); // wait for fullscreen and seek
        
        setIsPlaying(true);
        audioRef.current?.play();

        recordedChunksRef.current = [];
        // Use higher bitrate for the recording phase to minimize quality loss before FFmpeg processing
        const options = { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 8000000 };
        const mediaRecorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : { mimeType: 'video/webm' });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunksRef.current.push(event.data);
            }
        };
        
        audioRef.current!.onended = () => {
            if (mediaRecorder.state === 'recording') {
                mediaRecorder.stop();
            }
        };

        mediaRecorder.onstop = async () => {
             // Clean up
            stream.getTracks().forEach(track => track.stop());
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
            setIsPlaying(false);
            if (audioRef.current) audioRef.current.currentTime = 0;
            setShowControls(true);
            
            setExportStatus('encoding');
            setFfmpegProgress(0);
            
            const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            
            const { fetchFile } = FFmpeg;
            const ffmpeg = ffmpegRef.current;
            
            setExportMessage('寫入暫存檔...');
            ffmpeg.FS('writeFile', 'video.webm', await fetchFile(videoBlob));
            ffmpeg.FS('writeFile', 'audio_input', await fetchFile(audioFile));
            
            setExportMessage('正在轉檔與合成...');
            
            const args = ['-i', 'video.webm', '-i', 'audio_input'];
            
            // Video encoding settings
            if (config.resolution === 'original') {
                 // Fast copy if original resolution is preferred
                 args.push('-c:v', 'copy');
            } else {
                // Re-encode for specific resolution
                args.push('-c:v', 'libx264', '-preset', 'ultrafast'); // ultrafast is crucial for WASM performance
                if (config.resolution === '1080p') {
                    args.push('-vf', 'scale=-2:1080');
                } else if (config.resolution === '720p') {
                    args.push('-vf', 'scale=-2:720');
                }
            }

            // Audio encoding settings
            args.push('-c:a', 'aac', '-b:a', config.audioBitrate);
            
            // Shortest ensures video ends when audio ends (or vice versa)
            args.push('-shortest', 'output.mp4');

            await ffmpeg.run(...args);
            
            setExportMessage('正在建立下載連結...');
            const data = ffmpeg.FS('readFile', 'output.mp4');

            const outputBlob = new Blob([data.buffer], { type: 'video/mp4' });
            const url = URL.createObjectURL(outputBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${songTitle} - ${artistName} (${config.resolution === 'original' ? 'Original' : config.resolution}).mp4`;
            a.click();
            
            // Cleanup memory
            ffmpeg.FS('unlink', 'video.webm');
            ffmpeg.FS('unlink', 'audio_input');
            ffmpeg.FS('unlink', 'output.mp4');
            URL.revokeObjectURL(url);
            
            setExportStatus('done');
            setExportMessage('匯出成功！');
            setTimeout(() => setExportStatus('idle'), 3000);
        };
        
        mediaRecorder.start();
        setExportStatus('recording');
        setExportMessage('錄製中... 請讓歌曲完整播放一次');

    } catch (err) {
        console.error("Export failed:", err);
        setExportStatus('error');
        setExportMessage(`匯出失敗：${(err as Error).message}`);
        setShowControls(true);
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        setTimeout(() => setExportStatus('idle'), 5000);
    }
  };


  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return isNaN(minutes) || isNaN(secs) ? '0:00' : `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const renderLyrics = () => {
    if (activeLyricIndex === -1 && !['turntable', 'perspective'].includes(lyricStyle)) return null;

    switch (lyricStyle) {
        case 'turntable':
            return <TurntableLyrics timedLyrics={timedLyrics} activeIndex={activeLyricIndex} colorPalette={colorPalette} isPlaying={isPlaying} />;

        case 'perspective':
             return <PerspectiveLyrics timedLyrics={timedLyrics} activeIndex={activeLyricIndex} colorPalette={colorPalette} fontSize={fontSize} alignment={alignment} />;

        case 'vertical': {
            const line_height_rem = fontSize * 1.2; 
            const transformY = -(activeLyricIndex * line_height_rem);
            
            return (
                <div className="h-[60vh] w-full max-w-4xl flex flex-col justify-center overflow-hidden">
                    <div className="transition-transform duration-500 ease-out" style={{ transform: `translateY(${transformY}rem)` }}>
                        {timedLyrics.map((lyric, index) => {
                             const isActive = index === activeLyricIndex;
                             const textStyle: React.CSSProperties = {
                                color: isActive ? colorPalette.highlight : colorPalette.base,
                                transition: 'all 0.5s ease',
                                fontWeight: isActive ? 'bold' : 'normal',
                                opacity: isActive ? 1 : 0.5,
                                fontSize: `${fontSize * (isActive ? 1 : 0.9)}rem`,
                                lineHeight: `${line_height_rem}rem`,
                             };
                             return <p key={index} style={textStyle}>{lyric.text}</p>
                        })}
                    </div>
                </div>
            )
        }

        case 'karaoke':
        default: {
            const lyricWindow = 2; // Show 2 lines of context before and after
            const start = Math.max(0, activeLyricIndex - lyricWindow);
            const end = Math.min(timedLyrics.length, activeLyricIndex + lyricWindow + 1);

            return timedLyrics.slice(start, end).map((lyric, index) => {
            const globalIndex = start + index;
            const isActive = globalIndex === activeLyricIndex;
            const isPast = globalIndex < activeLyricIndex;

            let opacity = 0.3;
            if (isActive) opacity = 1;
            
            const textStyle: React.CSSProperties = {
                opacity: opacity,
                color: isPast ? colorPalette.highlight : colorPalette.base,
                transition: 'opacity 0.3s ease, color 0.3s ease, font-size 0.3s ease, font-weight 0.3s ease',
                fontWeight: isActive ? 'bold' : 'normal',
                fontSize: `${fontSize * (isActive ? 1 : 0.8)}rem`,
                lineHeight: 1.2,
            };

            if (isActive) {
                return (
                <KaraokeLyric
                    key={`${lyric.startTime}-${lyric.text}`}
                    text={lyric.text}
                    startTime={lyric.startTime}
                    endTime={lyric.endTime}
                    currentTime={currentTime}
                    isPlaying={isPlaying}
                    colorPalette={colorPalette}
                    style={{...textStyle, fontSize: `${fontSize}rem`}}
                />
                );
            } else {
                return <p key={`${lyric.startTime}-${lyric.text}`} style={textStyle}>{lyric.text}</p>;
            }
            });
        }
    }
  };

  const backgroundImageUrl = imageUrls[currentImageIndex] || '';

  return (
    <div ref={playerContainerRef} className="w-screen h-screen bg-black flex flex-col items-center justify-center overflow-hidden relative font-sans">
      {exportStatus !== 'idle' && <Loader message={exportMessage} progress={exportStatus === 'encoding' ? ffmpegProgress : undefined} />}
      {showExportSettings && <ExportSettingsModal onConfirm={startExport} onCancel={() => setShowExportSettings(false)} />}
      
      {/* Background */}
      <div className="absolute inset-0 w-full h-full">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            muted
            loop
            playsInline
            className={`w-full h-full object-cover transition-all duration-1000 ${effect === 'blur' ? 'blur-md scale-105' : ''}`}
          />
        ) : (
          <div
            className={`w-full h-full bg-cover bg-center transition-all duration-1000 ${effect === 'subtle-pan' ? 'animate-subtle-pan' : ''} ${effect === 'blur' ? 'blur-md scale-105' : ''}`}
            style={{ backgroundImage: `url(${backgroundImageUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        {effect === 'rain' && <div className="absolute inset-0 bg-rain-effect opacity-30"></div>}
        {effect === 'grain' && <div className="absolute inset-0 grain-effect opacity-10 pointer-events-none"></div>}
      </div>
      
      {/* Overlay Content */}
      <div className={`relative z-10 w-full h-full flex flex-col p-4 sm:p-8 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 hover:opacity-100 focus-within:opacity-100'}`}>
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between w-full">
          <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-black/30 hover:bg-black/50 border border-white/20 rounded-lg transition-colors">
            <PrevIcon className="w-5 h-5" />
            返回
          </button>
          <div className="flex items-center gap-4">
            <button onClick={openExportModal} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-500/30 hover:bg-blue-500/50 border border-blue-400/30 rounded-lg transition-colors">
                <ExportIcon className="w-5 h-5" />
                匯出 MV
            </button>
            <div className="text-right">
                <h1 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg">{songTitle}</h1>
                <p className="text-sm sm:text-md text-gray-300 drop-shadow-md">{artistName}</p>
            </div>
          </div>
        </header>
        
        {/* Lyrics Container */}
        <div className="flex-grow flex items-center justify-center overflow-hidden">
            <div className={`w-full max-w-4xl p-4 flex flex-col gap-4 ${alignment} ${lyricStyle === 'vertical' || lyricStyle === 'perspective' ? 'h-full justify-center' : ''}`}>
                {renderLyrics()}
            </div>
        </div>

        {/* Controls */}
        <footer className="flex-shrink-0 space-y-4">
            {/* Timeline */}
            <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300 font-mono w-12 text-center">{formatTime(currentTime)}</span>
                <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step="0.01"
                    value={currentTime}
                    onChange={handleTimelineChange}
                    className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
                />
                <span className="text-sm text-gray-300 font-mono w-12 text-center">{formatTime(duration)}</span>
            </div>

            {/* Buttons & Settings */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Left Settings */}
                <div className="flex items-center gap-2 p-1.5 bg-black/30 rounded-full border border-white/10">
                    <button onClick={() => setLyricStyle('karaoke')} title="逐字" className={`p-2 rounded-full transition-colors ${lyricStyle === 'karaoke' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`}> <AlignLeftIcon className="w-5 h-5" /></button>
                    <button onClick={() => setLyricStyle('vertical')} title="滾動" className={`p-2 rounded-full transition-colors ${lyricStyle === 'vertical' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`}> <VerticalLayoutIcon className="w-5 h-5" /></button>
                    <button onClick={() => setLyricStyle('turntable')} title="圓盤" className={`p-2 rounded-full transition-colors ${lyricStyle === 'turntable' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`}> <DiscIcon className="w-5 h-5" /></button>
                    <button onClick={() => setLyricStyle('perspective')} title="3D" className={`p-2 rounded-full transition-colors ${lyricStyle === 'perspective' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`}> <PerspectiveIcon className="w-5 h-5" /></button>
                    <div className="w-px h-6 bg-white/20 mx-1"></div>
                    <span className="text-gray-300 pl-1 text-sm hidden sm:inline">顏色:</span>
                    {lyricColorPalettes.map(p => (
                        <button key={p.name} title={p.name} onClick={() => setColorPalette(p)} className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${colorPalette.name === p.name ? 'ring-2 ring-white ring-offset-2 ring-offset-black/50' : ''}`} style={{background: p.bg}} />
                    ))}
                    <div className="w-px h-6 bg-white/20 mx-1"></div>
                    <span className="text-gray-300 pl-1 text-sm hidden sm:inline">字級</span>
                    <button onClick={() => setFontSize(s => Math.max(1.5, s - 0.25))} title="縮小字體" className="p-2 rounded-full transition-colors text-gray-300 hover:bg-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button onClick={() => setFontSize(s => Math.min(8, s + 0.25))} title="放大字體" className="p-2 rounded-full transition-colors text-gray-300 hover:bg-white/10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Play Button */}
                <button onClick={handlePlayPause} className="bg-white text-black rounded-full p-4 transform hover:scale-110 transition-transform shadow-lg">
                    {isPlaying ? <PauseIcon className="w-7 h-7" /> : <PlayIcon className="w-7 h-7" />}
                </button>

                {/* Right Settings */}
                <div className="flex items-center justify-end gap-2 p-1.5 bg-black/30 rounded-full border border-white/10">
                    <button onClick={() => setAlignment('items-start text-left')} title="靠左" className={`p-2 rounded-full transition-colors ${alignment.includes('left') ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`}> <AlignLeftIcon className="w-5 h-5" /></button>
                    <button onClick={() => setAlignment('items-end text-right')} title="靠右" className={`p-2 rounded-full transition-colors ${alignment.includes('right') ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`}> <AlignRightIcon className="w-5 h-5" /></button>
                    <div className="w-px h-6 bg-white/20 mx-1"></div>
                    <button onClick={() => setEffect(e => e === 'subtle-pan' ? 'none' : 'subtle-pan')} title="背景動畫" className={`p-2 rounded-full transition-colors ${effect === 'subtle-pan' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`}> <PanIcon className="w-5 h-5" /></button>
                    <button onClick={() => setEffect(e => e === 'rain' ? 'none' : 'rain')} title="下雨特效" className={`p-2 rounded-full transition-colors ${effect === 'rain' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`}> <VerticalLinesIcon className="w-5 h-5" /></button>
                    <button onClick={() => setEffect(e => e === 'blur' ? 'none' : 'blur')} title="模糊" className={`p-2 rounded-full transition-colors ${effect === 'blur' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`}> <BlurIcon className="w-5 h-5" /></button>
                    <button onClick={() => setEffect(e => e === 'grain' ? 'none' : 'grain')} title="雜訊" className={`p-2 rounded-full transition-colors ${effect === 'grain' ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10'}`}> <GrainIcon className="w-5 h-5" /></button>
                    <div className="w-px h-6 bg-white/20 mx-1"></div>
                    <button onClick={() => setShowControls(s => !s)} title="顯示/隱藏控制項" className="p-2 text-gray-300 hover:bg-white/10 rounded-full transition-colors">{showControls ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}</button>
                </div>
            </div>
        </footer>
      </div>

      <audio ref={audioRef} src={audioUrl} playsInline />

      <style>{`
        @keyframes subtle-pan {
          0% { background-position: 45% 50%; transform: scale(1); }
          50% { background-position: 55% 50%; transform: scale(1.05); }
          100% { background-position: 45% 50%; transform: scale(1); }
        }
        .animate-subtle-pan {
          animation: subtle-pan 20s ease-in-out infinite;
        }
        .accent-white::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #ffffff;
            cursor: pointer;
        }
        .accent-white::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #ffffff;
            cursor: pointer;
            border: none;
        }
        @keyframes rain-fall {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
        }
        .bg-rain-effect {
            background-image: linear-gradient(transparent, transparent), linear-gradient(180deg, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.2) 1px, transparent 1px);
            background-size: 100% 100%, 2px 20px, 4px 30px;
            background-repeat: repeat;
            animation: rain-fall 0.5s linear infinite;
        }
        .grain-effect {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 500 500' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;