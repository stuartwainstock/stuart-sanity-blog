'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {PALETTE_OPTIONS, type PaletteId} from '@/lib/pixelArt/palettes'
import {drawPixelArt, loadImageIntoCanvas} from '@/lib/pixelArt/render'
import type {UnsplashPhoto} from '@/lib/unsplash/types'
import Button from '@/components/atoms/Button'
import {UnsplashPicker} from './UnsplashPicker'
import styles from './PixelArtStudio.module.css'

type Attribution = {
  photographerName: string | null
  photographerPageUrl: string | null
  photoPageUrl: string | null
}

const DEFAULT_PIXEL_SIZE = 10
const DEFAULT_COLOR_LEVELS = 4

export function PixelArtStudio() {
  const [workingCanvas, setWorkingCanvas] = useState<HTMLCanvasElement | null>(null)
  const [attribution, setAttribution] = useState<Attribution | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const [pixelSize, setPixelSize] = useState(DEFAULT_PIXEL_SIZE)
  const [paletteId, setPaletteId] = useState<PaletteId>('original')
  const [colorLevels, setColorLevels] = useState(DEFAULT_COLOR_LEVELS)
  const [showGrid, setShowGrid] = useState(false)

  const outputCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const activePalette = PALETTE_OPTIONS.find((p) => p.id === paletteId) ?? PALETTE_OPTIONS[0]!

  const loadFromObjectUrl = useCallback(async (url: string, revokeAfter: boolean) => {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const canvas = await loadImageIntoCanvas(url)
      setWorkingCanvas(canvas)
      setAttribution(null)
      setStatus('idle')
    } catch {
      setStatus('error')
      setErrorMessage("Couldn't load that image. Try a different file.")
    } finally {
      if (revokeAfter) URL.revokeObjectURL(url)
    }
  }, [])

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (!file) return
      if (!file.type.startsWith('image/')) {
        setStatus('error')
        setErrorMessage('That file is not an image — try a JPG, PNG, or WebP.')
        return
      }
      const url = URL.createObjectURL(file)
      void loadFromObjectUrl(url, true)
    },
    [loadFromObjectUrl],
  )

  const handleUnsplashPick = useCallback(async (result: UnsplashPhoto) => {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const canvas = await loadImageIntoCanvas(result.regularUrl, {crossOrigin: 'anonymous'})
      setWorkingCanvas(canvas)
      setAttribution({
        photographerName: result.photographerName,
        photographerPageUrl: result.photographerPageUrl,
        photoPageUrl: result.photoPageUrl,
      })
      setStatus('idle')

      // Best-effort, required-by-guidelines ping — never blocks the UI.
      if (result.downloadLocation) {
        fetch('/api/pixel-art/unsplash-download', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({downloadLocation: result.downloadLocation}),
        }).catch(() => {})
      }
    } catch {
      setStatus('error')
      setErrorMessage("Couldn't load that photo — try another one, or upload your own image instead.")
    }
  }, [])

  useEffect(() => {
    if (!workingCanvas || !outputCanvasRef.current) return
    try {
      drawPixelArt(workingCanvas, outputCanvasRef.current, {
        pixelSize,
        paletteId,
        colorLevels,
        showGrid,
      })
    } catch {
      // Defer: this is an error-recovery path (tainted canvas), not a value the effect
      // is synchronizing — setState belongs in a callback, not the effect body itself.
      queueMicrotask(() => {
        setStatus('error')
        setErrorMessage(
          "This image can't be processed here due to browser security restrictions — try uploading it as a file instead.",
        )
      })
    }
  }, [workingCanvas, pixelSize, paletteId, colorLevels, showGrid])

  function handleDownload() {
    const canvas = outputCanvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) {
        setStatus('error')
        setErrorMessage("Couldn't export that image. Try a different photo.")
        return
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'pixel-art.png'
      link.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  function handleReset() {
    setWorkingCanvas(null)
    setAttribution(null)
    setStatus('idle')
    setErrorMessage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className={styles.studio}>
      <div className={styles.canvasColumn}>
        <div
          className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ''} ${
            workingCanvas ? styles.dropZoneHasImage : ''
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOver(true)
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragOver(false)
            handleFiles(e.dataTransfer.files)
          }}
        >
          {workingCanvas ? (
            <canvas ref={outputCanvasRef} className={styles.outputCanvas} />
          ) : (
            <div className={styles.dropZoneEmpty}>
              <p>Drag an image here, upload a file, or search Unsplash to get started.</p>
            </div>
          )}
          {status === 'loading' ? <div className={styles.loadingOverlay}>Loading…</div> : null}
        </div>

        {errorMessage ? (
          <p className={styles.errorMessage} role="alert">
            {errorMessage}
          </p>
        ) : null}

        {attribution?.photographerName ? (
          <p className={styles.attribution}>
            Photo by{' '}
            {attribution.photographerPageUrl ? (
              <a href={attribution.photographerPageUrl} target="_blank" rel="noopener noreferrer">
                {attribution.photographerName}
              </a>
            ) : (
              attribution.photographerName
            )}{' '}
            on{' '}
            <a
              href={attribution.photoPageUrl || 'https://unsplash.com/?utm_source=stuartwainstock&utm_medium=referral'}
              target="_blank"
              rel="noopener noreferrer"
            >
              Unsplash
            </a>
          </p>
        ) : null}

        <div className={styles.actionRow}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.hiddenFileInput}
            onChange={(e) => handleFiles(e.target.files)}
            aria-label="Upload an image"
          />
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            Upload image
          </Button>
          <Button variant="primary" tone="brand" onClick={handleDownload} disabled={!workingCanvas}>
            Download PNG
          </Button>
          {workingCanvas ? (
            <Button variant="ghost" onClick={handleReset}>
              Start over
            </Button>
          ) : null}
        </div>
      </div>

      <div className={styles.controlsColumn}>
        <UnsplashPicker onPick={handleUnsplashPick} disabled={status === 'loading'} />

        <fieldset className={styles.controlsFieldset} disabled={!workingCanvas}>
          <legend className={styles.controlsLegend}>Pixel controls</legend>

          <div className={styles.controlGroup}>
            <label htmlFor="pixel-size" className={styles.controlLabel}>
              Pixel size: {pixelSize}px blocks
            </label>
            <input
              id="pixel-size"
              type="range"
              min={3}
              max={48}
              step={1}
              value={pixelSize}
              onChange={(e) => setPixelSize(Number(e.target.value))}
              className={styles.rangeInput}
            />
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Style</span>
            <div className={styles.paletteRow} role="group" aria-label="Palette style">
              {PALETTE_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  variant={option.id === paletteId ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setPaletteId(option.id)}
                  aria-pressed={option.id === paletteId}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {activePalette.usesColorLevels ? (
            <div className={styles.controlGroup}>
              <label htmlFor="color-levels" className={styles.controlLabel}>
                Color depth: {colorLevels} shades per channel
              </label>
              <input
                id="color-levels"
                type="range"
                min={2}
                max={8}
                step={1}
                value={colorLevels}
                onChange={(e) => setColorLevels(Number(e.target.value))}
                className={styles.rangeInput}
              />
            </div>
          ) : null}

          <div className={styles.controlGroup}>
            <label className={styles.checkboxLabel} htmlFor="show-grid">
              <input
                id="show-grid"
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
              />
              Show pixel grid
            </label>
          </div>
        </fieldset>
      </div>
    </div>
  )
}
