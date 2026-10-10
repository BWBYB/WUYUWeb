import { useState, useEffect, useRef, useCallback } from 'react'
import './Player.css'

// Sample cassette data with audio frequencies for each track
const cassettes = [
  {
    id: 1,
    title: '深夜电台',
    artist: 'Lo-Fi Beats',
    side: 'A',
    color: '#e8d5b7',
    labelColor: '#f5e6d3',
    stickerColor: '#d4a574',
    year: '2024',
    tracks: [
      { name: '雨夜漫步', freq: 220, type: 'sine' },
      { name: '咖啡因', freq: 261, type: 'triangle' },
      { name: '凌晨三点', freq: 293, type: 'sine' },
      { name: '霓虹灯下', freq: 329, type: 'triangle' },
      { name: '归途', freq: 349, type: 'sine' }
    ],
    duration: '42:18'
  },
  {
    id: 2,
    title: '城市漫游',
    artist: 'Synthwave',
    side: 'A',
    color: '#2d2d3d',
    labelColor: '#1a1a2e',
    stickerColor: '#e94560',
    year: '2023',
    tracks: [
      { name: '午夜高速', freq: 392, type: 'sawtooth' },
      { name: '电子梦', freq: 440, type: 'square' },
      { name: '数字雨', freq: 493, type: 'sawtooth' },
      { name: '像素城市', freq: 523, type: 'square' },
      { name: '回不去', freq: 587, type: 'sawtooth' }
    ],
    duration: '38:45'
  },
  {
    id: 3,
    title: '夏日回忆',
    artist: 'Indie Pop',
    side: 'B',
    color: '#87ceeb',
    labelColor: '#b0e0e6',
    stickerColor: '#ff6b6b',
    year: '2024',
    tracks: [
      { name: '海浪', freq: 659, type: 'sine' },
      { name: '冰淇淋', freq: 698, type: 'triangle' },
      { name: '沙滩脚印', freq: 783, type: 'sine' },
      { name: '日落大道', freq: 880, type: 'triangle' },
      { name: '再见夏天', freq: 987, type: 'sine' }
    ],
    duration: '35:22'
  },
  {
    id: 4,
    title: '代码与诗',
    artist: 'Ambient',
    side: 'A',
    color: '#1a1a2e',
    labelColor: '#16213e',
    stickerColor: '#0f3460',
    year: '2024',
    tracks: [
      { name: 'Hello World', freq: 196, type: 'sine' },
      { name: '递归之梦', freq: 220, type: 'triangle' },
      { name: '栈溢出', freq: 246, type: 'sine' },
      { name: '编译通过', freq: 261, type: 'triangle' },
      { name: 'Git Commit', freq: 293, type: 'sine' }
    ],
    duration: '45:00'
  }
]

export default function Player() {
  const [currentCassette, setCurrentCassette] = useState(0)
  const [isInserted, setIsInserted] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [showLibrary, setShowLibrary] = useState(false)
  const [isEjecting, setIsEjecting] = useState(false)
  const [isInserting, setIsInserting] = useState(false)
  const [showCassette, setShowCassette] = useState(false)
  const [reelRotation, setReelRotation] = useState(0)
  const [vuLevel, setVuLevel] = useState(0)
  const [draggedCassette, setDraggedCassette] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [volume, setVolume] = useState(0.3)
  const [cassetteData, setCassetteData] = useState(cassettes)
  const [customTracks, setCustomTracks] = useState({}) // { cassetteId: [{name, url, file}] }
  const [isEditing, setIsEditing] = useState(false)
  const [editColors, setEditColors] = useState({ color: '', labelColor: '', stickerColor: '' })
  const audioElementRef = useRef(null)
  const vuAnimRef = useRef(null)
  const reelAnimRef = useRef(null)
  const fileInputRef = useRef(null)
  const walkmanRef = useRef(null)
  const libraryRef = useRef(null)
  const carouselRef = useRef(null)
  const audioContextRef = useRef(null)
  const oscillatorRef = useRef(null)
  const gainNodeRef = useRef(null)
  const analyserRef = useRef(null)
  const dragStartRef = useRef({ x: 0, time: 0 })
  const dragVelocityRef = useRef(0)
  const lastDragXRef = useRef(0)
  const lastDragTimeRef = useRef(0)
  const totalDragDistRef = useRef(0)

  const cassette = cassetteData[currentCassette]
  // Custom tracks override default oscillator tracks
  const cassetteCustom = customTracks[cassette.id] || []
  const allTracks = cassetteCustom.length > 0
    ? cassetteCustom.map((ct, i) => ({ ...ct, isCustom: true }))
    : cassette.tracks
  const track = allTracks[currentTrack] || allTracks[0]

  // Initialize audio context
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
      gainNodeRef.current = audioContextRef.current.createGain()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      gainNodeRef.current.connect(analyserRef.current)
      analyserRef.current.connect(audioContextRef.current.destination)
      gainNodeRef.current.gain.value = volume
    }
  }, [volume])

  // Start playing current track
  const startAudio = useCallback(() => {
    initAudio()
    
    const ctx = audioContextRef.current
    if (ctx.state === 'suspended') {
      ctx.resume()
    }
    
    // Stop previous audio source
    if (oscillatorRef.current) {
      oscillatorRef.current.stop()
      oscillatorRef.current = null
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current = null
    }
    
    const gain = gainNodeRef.current
    
    if (track.isCustom && track.url) {
      // Play real audio file
      const audio = new Audio(track.url)
      audio.crossOrigin = 'anonymous'
      const source = ctx.createMediaElementSource(audio)
      source.connect(gain)
      audio.play().catch(() => {})
      audioElementRef.current = audio
      oscillatorRef.current = null
    } else {
      // Fallback: oscillator-based tone
      const osc = ctx.createOscillator()
      osc.type = track.type || 'sine'
      osc.frequency.value = track.freq || 440
      
      // Add some vibrato for interest
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.frequency.value = 5
      lfoGain.gain.value = 2
      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)
      lfo.start()
      
      osc.connect(gain)
      osc.start()
      oscillatorRef.current = osc
    }
  }, [track, initAudio])

  // Stop audio
  const stopAudio = useCallback(() => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop()
      oscillatorRef.current = null
    }
    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current.currentTime = 0
      audioElementRef.current = null
    }
  }, [])

  // Update VU meter based on audio analysis
  useEffect(() => {
    if (!isPlaying || !analyserRef.current) {
      setVuLevel(0)
      return
    }
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    
    const updateVU = () => {
      if (!analyserRef.current) return
      analyserRef.current.getByteFrequencyData(dataArray)
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      const level = average / 255
      setVuLevel(level * 0.8 + Math.random() * 0.2)
      vuAnimRef.current = requestAnimationFrame(updateVU)
    }
    
    updateVU()
    
    return () => {
      if (vuAnimRef.current) {
        cancelAnimationFrame(vuAnimRef.current)
        vuAnimRef.current = null
      }
    }
  }, [isPlaying])

  // Handle play state changes
  useEffect(() => {
    if (isPlaying && isInserted) {
      startAudio()
    } else {
      stopAudio()
      if (!isPlaying) setVuLevel(0)
    }
    return () => {
      stopAudio()
    }
  }, [isPlaying, isInserted, startAudio, stopAudio])

  // Update volume
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume
    }
  }, [volume])

  // Animate reels when playing
  useEffect(() => {
    if (isPlaying && isInserted) {
      const animate = () => {
        setReelRotation(prev => (prev + 2) % 360)
        reelAnimRef.current = requestAnimationFrame(animate)
      }
      reelAnimRef.current = requestAnimationFrame(animate)
    } else {
      if (reelAnimRef.current) cancelAnimationFrame(reelAnimRef.current)
    }
    return () => {
      if (reelAnimRef.current) cancelAnimationFrame(reelAnimRef.current)
    }
  }, [isPlaying, isInserted])

  // Eject cassette - Walkman slides down and fades
  const handleEject = useCallback(() => {
    if (isEjecting || isInserting) return
    setIsPlaying(false)
    setIsEjecting(true)
    setTimeout(() => {
      setIsInserted(false)
      setIsEjecting(false)
      setShowLibrary(true)
    }, 800)
  }, [isEjecting, isInserting])

  // Insert cassette from drag
  const handleInsert = useCallback((index) => {
    if (isEjecting || isInserting) return
    setShowLibrary(false)
    setIsInserting(true)
    setCurrentCassette(index)
    setCurrentTrack(0)
    setActiveIndex(index)
    // Walkman slides up (0.8s), then cassette slides in (0.8s)
    setTimeout(() => {
      setShowCassette(true)
      setIsInserted(true)
    }, 800)
    setTimeout(() => {
      setIsInserting(false)
      setShowCassette(false)
    }, 1700)
  }, [isEjecting, isInserting])

  // Play/Pause
  const handlePlayPause = () => {
    if (!isInserted) return
    setIsPlaying(!isPlaying)
  }

  // Skip track
  const handleNextTrack = () => {
    if (!isInserted) return
    setCurrentTrack((prev) => (prev + 1) % allTracks.length)
  }

  const handlePrevTrack = () => {
    if (!isInserted) return
    setCurrentTrack((prev) => (prev - 1 + allTracks.length) % allTracks.length)
  }

  // Stop
  const handleStop = () => {
    setIsPlaying(false)
    setCurrentTrack(0)
  }

  // Import audio files
  const handleImportFiles = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    
    // Use the cassette being edited, or the currently selected one
    const targetCassette = isEditing ? cassetteData[activeIndex] : cassette
    
    const newTracks = files.map(file => ({
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      url: URL.createObjectURL(file),
      file: file
    }))
    
    setCustomTracks(prev => ({
      ...prev,
      [targetCassette.id]: newTracks
    }))
    
    // Reset to first track if importing for current cassette
    if (!isEditing) {
      setCurrentTrack(0)
    }
    // Reset file input
    e.target.value = ''
  }

  // Drag handlers for Walkman drop zone
  const handleDragStart = (index) => {
    setDraggedCassette(index)
  }

  const handleDragEnd = () => {
    setDraggedCassette(null)
    setIsDragOver(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    if (draggedCassette !== null) {
      handleInsert(draggedCassette)
    }
  }

  // Carousel mouse drag handlers
  const handleCarouselMouseDown = (e) => {
    if (!carouselRef.current) return
    e.preventDefault()
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, time: Date.now() }
    lastDragXRef.current = e.clientX
    lastDragTimeRef.current = Date.now()
    dragVelocityRef.current = 0
    totalDragDistRef.current = 0
    setDragOffset(0)
  }

  const handleCarouselMouseMove = (e) => {
    if (!isDragging || !carouselRef.current) return
    const deltaX = e.clientX - dragStartRef.current.x
    const now = Date.now()
    const dt = now - lastDragTimeRef.current
    
    if (dt > 0) {
      dragVelocityRef.current = (e.clientX - lastDragXRef.current) / dt
    }
    
    lastDragXRef.current = e.clientX
    lastDragTimeRef.current = now
    totalDragDistRef.current = Math.abs(deltaX)
    
    // Convert pixel delta to index fraction (150px per item)
    setDragOffset(deltaX / 150)
  }

  const handleCarouselMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    
    // Calculate final position with momentum
    const velocity = dragVelocityRef.current
    const momentum = velocity * 150 // Project momentum distance
    const totalOffset = dragOffset + momentum / 150
    
    // Snap to nearest index
    const newIndex = Math.round(activeIndex - totalOffset)
    const clampedIndex = Math.max(0, Math.min(cassetteData.length - 1, newIndex))
    
    setActiveIndex(clampedIndex)
    setDragOffset(0)
  }

  const handleCarouselMouseLeave = () => {
    if (isDragging) {
      handleCarouselMouseUp()
    }
  }

  // Touch support
  const handleCarouselTouchStart = (e) => {
    if (!carouselRef.current) return
    setIsDragging(true)
    dragStartRef.current = { x: e.touches[0].clientX, time: Date.now() }
    lastDragXRef.current = e.touches[0].clientX
    lastDragTimeRef.current = Date.now()
    dragVelocityRef.current = 0
    totalDragDistRef.current = 0
    setDragOffset(0)
  }

  const handleCarouselTouchMove = (e) => {
    if (!isDragging || !carouselRef.current) return
    const deltaX = e.touches[0].clientX - dragStartRef.current.x
    const now = Date.now()
    const dt = now - lastDragTimeRef.current
    
    if (dt > 0) {
      dragVelocityRef.current = (e.touches[0].clientX - lastDragXRef.current) / dt
    }
    
    lastDragXRef.current = e.touches[0].clientX
    lastDragTimeRef.current = now
    totalDragDistRef.current = Math.abs(deltaX)
    
    setDragOffset(deltaX / 150)
  }

  const handleCarouselTouchEnd = () => {
    handleCarouselMouseUp()
  }

  // Button navigation
  const handleCarouselPrev = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1)
    }
  }

  const handleCarouselNext = () => {
    if (activeIndex < cassetteData.length - 1) {
      setActiveIndex(activeIndex + 1)
    }
  }

  // Add new cassette
  const handleAddCassette = () => {
    const newId = Math.max(...cassetteData.map(c => c.id)) + 1
    const newCassette = {
      id: newId,
      title: '新磁带',
      artist: '未知艺术家',
      side: 'A',
      color: '#e8d5b7',
      labelColor: '#f5e6d3',
      stickerColor: '#d4a574',
      year: '2024',
      tracks: [
        { name: '未命名曲目', freq: 440, type: 'sine' }
      ],
      duration: '00:00'
    }
    setCassetteData(prev => [...prev, newCassette])
    setActiveIndex(cassetteData.length)
  }

  // Calculate item position
  const getItemStyle = (index) => {
    const offset = index - activeIndex + dragOffset
    const absOffset = Math.abs(offset)
    const isActive = Math.abs(offset) < 0.1
    
    const translateX = offset * 200
    const rotateY = offset * -35
    const scale = Math.max(0.6, 1 - absOffset * 0.15)
    const opacity = Math.max(0.3, 1 - absOffset * 0.3)
    const zIndex = Math.round(10 - absOffset * 2)
    
    return {
      transform: `translateX(${translateX}px) rotateY(${rotateY}deg) scale(${scale})`,
      opacity,
      zIndex,
      transition: isDragging ? 'none' : 'all 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)'
    }
  }

  return (
    <div className="player-page">
      {/* Walkman - only show when not in library view */}
      {(!showLibrary || isEjecting || isInserting) && (
        <div
          className={`walkman ${isEjecting ? 'walkman-ejecting' : ''} ${isInserting ? 'walkman-inserting' : ''}`}
          ref={walkmanRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
        <div className="walkman-body">
          {/* Top Brand Area */}
          <div className="walkman-brand">
            <span className="brand-name">WALKMAN</span>
            <span className="brand-model">WM-2024</span>
          </div>

          {/* Cassette Window */}
          <div className="cassette-slot">
            <div className={`cassette ${isInserted ? 'inserted' : 'ejected'} ${isEjecting ? 'ejecting' : ''} ${showCassette ? 'inserting' : ''}`}>
              {(isInserted || showCassette) && (
                <div className="cassette-tape" style={{ '--cassette-color': cassette.color, '--label-color': cassette.labelColor, '--sticker-color': cassette.stickerColor }}>
                  <div className="cassette-shell">
                    <div className="cassette-label">
                      <div className="label-sticker" style={{ background: cassette.stickerColor }}>
                        <span className="label-side">Side {cassette.side}</span>
                      </div>
                      <h3 className="label-title">{cassette.title}</h3>
                      <p className="label-artist">{cassette.artist}</p>
                    </div>

                    <div className="tape-window">
                      <div className="tape-reel left-reel" style={{ transform: `rotate(${reelRotation}deg)` }}>
                        <div className="reel-hub">
                          <div className="reel-spoke"></div>
                          <div className="reel-spoke"></div>
                          <div className="reel-spoke"></div>
                        </div>
                      </div>
                      <div className="tape-path">
                        <div className="tape-line"></div>
                      </div>
                      <div className="tape-reel right-reel" style={{ transform: `rotate(${-reelRotation}deg)` }}>
                        <div className="reel-hub">
                          <div className="reel-spoke"></div>
                          <div className="reel-spoke"></div>
                          <div className="reel-spoke"></div>
                        </div>
                      </div>
                    </div>

                    <div className="cassette-screws">
                      <div className="screw"></div>
                      <div className="screw"></div>
                      <div className="screw"></div>
                      <div className="screw"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* VU Meter */}
          <div className="vu-meter">
            <div className="vu-label">LEVEL</div>
            <div className="vu-bars">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className={`vu-bar ${i < vuLevel * 12 ? 'active' : ''} ${i >= 9 ? 'hot' : ''}`}
                />
              ))}
            </div>
          </div>

          {/* Track Display */}
          <div className="track-display">
            <div className="display-screen">
              <div className="display-track">
                {isInserted ? `${String(currentTrack + 1).padStart(2, '0')} ${track.name}` : '--- NO TAPE ---'}
              </div>
              <div className="display-info">
                {isInserted ? `TRACK ${currentTrack + 1}/${allTracks.length} · ${cassette.duration}` : 'INSERT CASSETTE'}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="walkman-controls">
            <button className="control-btn rewind" onClick={handlePrevTrack} title="上一首">
              <span className="control-icon">⏮</span>
            </button>
            <button className={`control-btn play ${isPlaying ? 'active' : ''}`} onClick={handlePlayPause} title={isPlaying ? '暂停' : '播放'}>
              <span className="control-icon">{isPlaying ? '⏸' : '▶'}</span>
            </button>
            <button className="control-btn stop" onClick={handleStop} title="停止">
              <span className="control-icon"></span>
            </button>
            <button className="control-btn forward" onClick={handleNextTrack} title="下一首">
              <span className="control-icon">⏭</span>
            </button>
            <button className="control-btn eject" onClick={handleEject} title="弹出磁带">
              <span className="control-icon">⏏</span>
            </button>
          </div>

          {/* Volume Wheel */}
          <div className="volume-section">
            <span className="volume-label">VOL</span>
            <div className="volume-wheel">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="volume-slider"
                title={`音量: ${Math.round(volume * 100)}%`}
              />
              <div className="volume-indicator" style={{ width: `${volume * 100}%` }}></div>
              <div className="wheel-grip"></div>
              <div className="wheel-grip"></div>
              <div className="wheel-grip"></div>
              <div className="wheel-grip"></div>
              <div className="wheel-grip"></div>
            </div>
            <span className="volume-value">{Math.round(volume * 100)}</span>
          </div>

          {/* Headphone Jack */}
          <div className="headphone-jack">
            <div className="jack-hole"></div>
            <span className="jack-label">PHONES</span>
          </div>

          {/* Drag indicator */}
          {isDragOver && (
            <div className="drag-indicator">
              <span>松开插入磁带</span>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Cassette Library - Cover Flow Style */}
      {showLibrary && (
        <div className={`cassette-library ${isInserting ? 'library-hiding' : ''}`} ref={libraryRef}>
          {/* Navigation Bar */}
          <div className="library-nav">
            <button
              className="nav-icon-btn"
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false)
                } else {
                  setShowLibrary(false)
                  setIsInserted(true)
                }
              }}
              title={isEditing ? '取消编辑' : '返回播放'}
            >
              {isEditing ? '✕' : '←'}
            </button>
            <span className="nav-title">{isEditing ? '编辑磁带' : '选择磁带'}</span>
            <button
              className="nav-icon-btn"
              onClick={() => {
                if (isEditing) {
                  // Confirm edits
                  setIsEditing(false)
                } else {
                  const c = cassetteData[activeIndex]
                  setEditColors({ color: c.color, labelColor: c.labelColor, stickerColor: c.stickerColor })
                  setIsEditing(true)
                }
              }}
              title={isEditing ? '确认' : '编辑磁带'}
            >
              {isEditing ? '✓' : '✎'}
            </button>
          </div>

          {/* Edit Panel Content */}
          {isEditing && (
            <div className="edit-panel">
              <div className="edit-content">
                {/* Cassette Style */}
                <div className="edit-section">
                  <label className="edit-label">磁带风格</label>
                  <div className="edit-colors">
                    <div className="color-picker-group">
                      <span>外壳</span>
                      <input
                        type="color"
                        value={editColors.color}
                        onChange={(e) => setEditColors(prev => ({ ...prev, color: e.target.value }))}
                      />
                    </div>
                    <div className="color-picker-group">
                      <span>标签</span>
                      <input
                        type="color"
                        value={editColors.labelColor}
                        onChange={(e) => setEditColors(prev => ({ ...prev, labelColor: e.target.value }))}
                      />
                    </div>
                    <div className="color-picker-group">
                      <span>贴纸</span>
                      <input
                        type="color"
                        value={editColors.stickerColor}
                        onChange={(e) => setEditColors(prev => ({ ...prev, stickerColor: e.target.value }))}
                      />
                    </div>
                  </div>
                  <button
                    className="edit-apply-color"
                    onClick={() => {
                      setCassetteData(prev => prev.map((c, i) =>
                        i === activeIndex ? { ...c, ...editColors } : c
                      ))
                    }}
                  >
                    应用颜色
                  </button>
                </div>

                {/* Audio Import */}
                <div className="edit-section">
                  <label className="edit-label">音源文件</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="audio/*"
                    multiple
                    onChange={handleImportFiles}
                    style={{ display: 'none' }}
                  />
                  <button
                    className="edit-import-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    选择音频文件
                  </button>
                  {cassetteCustom[cassetteData[activeIndex]?.id]?.length > 0 && (
                    <div className="edit-track-list">
                      {customTracks[cassetteData[activeIndex].id].map((t, i) => (
                        <div key={i} className="edit-track-item">
                          <span className="edit-track-num">{String(i + 1).padStart(2, '0')}</span>
                          <span className="edit-track-name">{t.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cassette Info */}
                <div className="edit-section">
                  <label className="edit-label">磁带信息</label>
                  <input
                    type="text"
                    className="edit-input"
                    value={cassetteData[activeIndex]?.title || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      setCassetteData(prev => prev.map((c, i) =>
                        i === activeIndex ? { ...c, title: val } : c
                      ))
                    }}
                    placeholder="磁带名称"
                  />
                  <input
                    type="text"
                    className="edit-input"
                    value={cassetteData[activeIndex]?.artist || ''}
                    onChange={(e) => {
                      const val = e.target.value
                      setCassetteData(prev => prev.map((c, i) =>
                        i === activeIndex ? { ...c, artist: val } : c
                      ))
                    }}
                    placeholder="艺术家"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Cover Flow Carousel with Drag */}
          <div
            className={`cover-flow ${isDragging ? 'dragging' : ''}`}
            ref={carouselRef}
            onMouseDown={handleCarouselMouseDown}
            onMouseMove={handleCarouselMouseMove}
            onMouseUp={handleCarouselMouseUp}
            onMouseLeave={handleCarouselMouseLeave}
            onTouchStart={handleCarouselTouchStart}
            onTouchMove={handleCarouselTouchMove}
            onTouchEnd={handleCarouselTouchEnd}
          >
            {/* Center indicator */}
            <div className="cover-flow-center">
              <div className="center-line"></div>
            </div>

            {cassetteData.map((c, i) => {
              const isActive = i === activeIndex && Math.abs(dragOffset) < 0.1
              const custom = customTracks[c.id] || []

              return (
                <div
                  key={c.id}
                  className={`cover-flow-item ${isActive ? 'active' : ''}`}
                  style={getItemStyle(i)}
                  draggable={false}
                  onClick={() => {
                    if (totalDragDistRef.current < 5) {
                      handleInsert(i)
                    }
                  }}
                >
                  <div className="cover-cassette" style={{ '--c-color': c.color, '--c-sticker': c.stickerColor }}>
                    <div className="cover-cassette-body">
                      <div className="cover-label" style={{ background: c.stickerColor }}>
                        <span className="cover-label-title">{c.title}</span>
                        <span className="cover-label-side">Side {c.side}</span>
                      </div>
                      <div className="cover-window">
                        <div className="cover-reel"></div>
                        <div className="cover-reel"></div>
                      </div>
                      <div className="cover-screws">
                        <div className="cover-screw"></div>
                        <div className="cover-screw"></div>
                        <div className="cover-screw"></div>
                        <div className="cover-screw"></div>
                      </div>
                    </div>
                    <div className="cover-info">
                      <span className="cover-artist">{c.artist}</span>
                      <span className="cover-year">{c.year}</span>
                      {custom.length > 0 && <span className="cover-custom-badge">{custom.length} 首</span>}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Add cassette card - visible when at the rightmost position */}
            <div
              className={`cover-flow-add ${activeIndex === cassetteData.length - 1 ? 'visible' : ''}`}
              onClick={handleAddCassette}
            >
              <span className="add-icon">+</span>
              <span className="add-text">添加磁带</span>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="carousel-nav">
            <button
              className="carousel-btn prev"
              onClick={handleCarouselPrev}
              disabled={activeIndex === 0}
            >
              ‹
            </button>
            <div className="carousel-dots">
              {cassetteData.map((_, i) => (
                <div
                  key={i}
                  className={`carousel-dot ${i === activeIndex ? 'active' : ''}`}
                  onClick={() => setActiveIndex(i)}
                />
              ))}
            </div>
            <button
              className="carousel-btn next"
              onClick={handleCarouselNext}
              disabled={activeIndex === cassetteData.length - 1}
            >
              ›
            </button>
          </div>

          {/* Drag hint */}
          <div className="drag-hint">
            <span>← 拖动切换磁带 →</span>
          </div>
        </div>
      )}
    </div>
  )
}
