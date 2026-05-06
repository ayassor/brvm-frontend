import { useEffect, useRef, useState, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady?: () => void
    _ytApiCallbacks?: Array<() => void>
  }
}

interface CustomYTPlayerProps {
  videoId: string
  title?: string
}

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function CustomYTPlayer({ videoId, title }: CustomYTPlayerProps) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const playerRef     = useRef<any>(null)
  const intervalRef   = useRef<number>()
  const hideTimerRef  = useRef<number>()
  const playerDivId   = useRef(`cyt-${Math.random().toString(36).slice(2)}`)

  const [ready,        setReady]        = useState(false)
  const [isPlaying,    setIsPlaying]    = useState(false)
  const [isMuted,      setIsMuted]      = useState(false)
  const [volume,       setVolume]       = useState(80)
  const [progress,     setProgress]     = useState(0)
  const [currentTime,  setCurrentTime]  = useState(0)
  const [duration,     setDuration]     = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  /* ── Init player ─────────────────────────────────────────────────────── */
  const buildPlayer = useCallback(() => {
    if (!window.YT?.Player) return
    playerRef.current = new window.YT.Player(playerDivId.current, {
      videoId,
      playerVars: {
        controls:       0,
        modestbranding: 1,
        rel:            0,
        showinfo:       0,
        iv_load_policy: 3,
        disablekb:      1,
        fs:             0,
        playsinline:    1,
        origin:         window.location.origin,
      },
      events: {
        onReady(e: any) {
          setReady(true)
          setDuration(e.target.getDuration())
          e.target.setVolume(80)
        },
        onStateChange(e: any) {
          const playing = e.data === window.YT.PlayerState.PLAYING
          setIsPlaying(playing)
          if (playing) {
            intervalRef.current = window.setInterval(() => {
              const t = playerRef.current?.getCurrentTime?.() ?? 0
              const d = playerRef.current?.getDuration?.() ?? 1
              setCurrentTime(t)
              setProgress((t / d) * 100)
            }, 500)
          } else {
            clearInterval(intervalRef.current)
          }
        },
      },
    })
  }, [videoId])

  useEffect(() => {
    if (window.YT?.Player) {
      buildPlayer()
    } else {
      // Queue callback in case multiple players load simultaneously
      if (!window._ytApiCallbacks) window._ytApiCallbacks = []
      window._ytApiCallbacks.push(buildPlayer)

      if (!document.getElementById('yt-iframe-api')) {
        const script = document.createElement('script')
        script.id  = 'yt-iframe-api'
        script.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(script)
      }

      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev?.()
        window._ytApiCallbacks?.forEach((cb) => cb())
        window._ytApiCallbacks = []
      }
    }

    return () => {
      clearInterval(intervalRef.current)
      clearTimeout(hideTimerRef.current)
      playerRef.current?.destroy?.()
    }
  }, [buildPlayer])

  /* ── Fullscreen change ───────────────────────────────────────────────── */
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  /* ── Controls ────────────────────────────────────────────────────────── */
  const togglePlay = () => {
    if (!playerRef.current) return
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo()
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current) return
    const rect  = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const d     = playerRef.current.getDuration?.() ?? 0
    playerRef.current.seekTo(ratio * d, true)
    setProgress(ratio * 100)
  }

  const handleVolume = (v: number) => {
    setVolume(v)
    playerRef.current?.setVolume(v)
    if (v > 0 && isMuted) {
      playerRef.current?.unMute()
      setIsMuted(false)
    }
  }

  const toggleMute = () => {
    if (isMuted) {
      playerRef.current?.unMute()
      playerRef.current?.setVolume(volume)
    } else {
      playerRef.current?.mute()
    }
    setIsMuted(!isMuted)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  /* ── Auto-hide controls ──────────────────────────────────────────────── */
  const resetHide = () => {
    setShowControls(true)
    clearTimeout(hideTimerRef.current)
    hideTimerRef.current = window.setTimeout(() => {
      if (playerRef.current &&
          playerRef.current.getPlayerState?.() === window.YT?.PlayerState?.PLAYING) {
        setShowControls(false)
      }
    }, 3000)
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div
      ref={containerRef}
      className="relative bg-black w-full aspect-video overflow-hidden select-none"
      onMouseMove={resetHide}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      {/* YouTube iframe target — controls hidden */}
      <div id={playerDivId.current} className="w-full h-full" />

      {/* Transparent overlay — captures clicks for play/pause, blocks YT logo */}
      <div
        className="absolute inset-0"
        onClick={togglePlay}
        style={{ cursor: 'pointer' }}
      />

      {/* Loading spinner */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-none">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* Big play icon flash */}
      {ready && !isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          onClick={togglePlay}
          style={{ pointerEvents: 'none' }}
        >
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
            <Play size={30} className="text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {/* ── Controls bar ───────────────────────────────────────────────── */}
      <div
        className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
          padding: '40px 14px 10px',
          pointerEvents: showControls ? 'auto' : 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div
          className="relative h-1 bg-white/25 rounded-full cursor-pointer mb-3 group/prog"
          onClick={handleSeek}
          style={{ height: '4px' }}
        >
          {/* Buffered (fake visual) */}
          <div className="absolute inset-0 rounded-full bg-white/15" />
          {/* Played */}
          <div
            className="absolute top-0 left-0 h-full bg-brvm-green rounded-full transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/prog:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className="text-white hover:text-brvm-green transition-colors flex-shrink-0"
            title={isPlaying ? 'Pause' : 'Lire'}
          >
            {isPlaying
              ? <Pause size={20} fill="currentColor" />
              : <Play size={20} fill="currentColor" className="ml-0.5" />}
          </button>

          {/* Volume */}
          <div className="flex items-center gap-2 group/vol">
            <button
              onClick={toggleMute}
              className="text-white hover:text-brvm-green transition-colors flex-shrink-0"
              title={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted || volume === 0
                ? <VolumeX size={18} />
                : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolume(Number(e.target.value))}
              className="w-20 accent-brvm-green cursor-pointer h-1"
              style={{ accentColor: '#16a34a' }}
              title={`Volume : ${isMuted ? 0 : volume}%`}
            />
          </div>

          {/* Time */}
          <span className="text-white/70 text-xs font-mono ml-1 flex-shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Title */}
          {title && (
            <span className="text-white/60 text-xs truncate max-w-[200px] hidden sm:block">
              {title}
            </span>
          )}

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="text-white hover:text-brvm-green transition-colors flex-shrink-0"
            title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </button>
        </div>
      </div>
    </div>
  )
}
