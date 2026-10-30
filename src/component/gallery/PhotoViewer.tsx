import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react"
import ArrowLeft from "../../icons/angle-left-sm.svg?react"
import {
  GALLERY_IMAGES,
  GALLERY_IMAGE_SIZES,
  GALLERY_THUMBNAILS,
} from "../../images"

type Direction = -1 | 0 | 1
type PhotoFrame = {
  index: number
  previous: number | null
  direction: Direction
  offset: number
  revision: number
  entering: boolean
}
type SwipeStart = {
  x: number
  y: number
  id: number
  time: number
  horizontal: boolean
}

const PHOTO_TRANSITION_MS = 280
const SWIPE_DISTANCE = 40

/** 고화질 사진이 준비된 다음 교체해 로딩 중에도 현재 사진을 유지합니다. */
export const PhotoViewer = ({
  initialPhoto,
  onClose,
}: {
  initialPhoto: number
  onClose: () => void
}) => {
  const [request, setRequest] = useState({
    index: initialPhoto,
    direction: 0 as Direction,
    revision: 0,
  })
  const [frame, setFrame] = useState<PhotoFrame | null>(null)
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    "loading",
  )
  const [showLoader, setShowLoader] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const pointerStart = useRef<SwipeStart | null>(null)
  const dragOffsetRef = useRef(0)
  const displayedIndex = frame?.index
  const frameRevision = frame?.revision

  const changePhoto = useCallback((direction: -1 | 1) => {
    setRequest((current) => ({
      index:
        (current.index + direction + GALLERY_IMAGES.length) %
        GALLERY_IMAGES.length,
      direction,
      revision: current.revision + 1,
    }))
  }, [])

  useEffect(() => {
    closeButtonRef.current?.focus({ preventScroll: true })
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
      } else if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault()
        changePhoto(event.key === "ArrowLeft" ? -1 : 1)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [changePhoto, onClose])

  useEffect(() => {
    let cancelled = false
    const image = new Image()
    setLoadState("loading")
    setShowLoader(false)
    // 캐시된 사진에서는 로딩 표시를 생략하고, 느린 연결에서는 원래 사진을 유지합니다.
    const loadingTimer = window.setTimeout(() => {
      setShowLoader(true)
      dragOffsetRef.current = 0
      setDragOffset(0)
    }, 180)
    image.decoding = "async"
    image.fetchPriority = "high"
    image.src = GALLERY_IMAGES[request.index]
    void image.decode().then(
      () => {
        if (cancelled) return
        window.clearTimeout(loadingTimer)
        const offset = dragOffsetRef.current
        setFrame((current) => ({
          index: request.index,
          previous:
            current && current.index !== request.index ? current.index : null,
          direction: request.direction,
          offset,
          revision: request.revision,
          entering: true,
        }))
        pointerStart.current = null
        dragOffsetRef.current = 0
        setDragOffset(0)
        setDragging(false)
        setLoadState("ready")
        setShowLoader(false)
      },
      () => {
        if (cancelled) return
        window.clearTimeout(loadingTimer)
        setLoadState("error")
        setShowLoader(false)
        dragOffsetRef.current = 0
        setDragOffset(0)
      },
    )
    return () => {
      cancelled = true
      window.clearTimeout(loadingTimer)
      image.removeAttribute("src")
    }
  }, [request])

  useEffect(() => {
    if (displayedIndex === undefined) return
    // 전체 사진을 선다운로드하지 않고 현재 사진의 양옆 두 장만 준비합니다.
    const neighbors = [-1, 1].map((offset) => {
      const image = new Image()
      image.decoding = "async"
      image.fetchPriority = "low"
      image.src =
        GALLERY_IMAGES[
          (displayedIndex + offset + GALLERY_IMAGES.length) %
            GALLERY_IMAGES.length
        ]
      void image.decode().catch(() => undefined)
      return image
    })
    return () => neighbors.forEach((image) => image.removeAttribute("src"))
  }, [displayedIndex])

  useEffect(() => {
    if (frameRevision === undefined) return
    const timer = window.setTimeout(() => {
      setFrame((current) =>
        current?.revision === frameRevision
          ? { ...current, previous: null, entering: false }
          : current,
      )
    }, PHOTO_TRANSITION_MS)
    return () => window.clearTimeout(timer)
  }, [frameRevision])

  const resetDrag = () => {
    pointerStart.current = null
    dragOffsetRef.current = 0
    setDragOffset(0)
    setDragging(false)
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary) {
      resetDrag()
      return
    }
    if (
      !frame ||
      frame.entering ||
      loadState !== "ready" ||
      (event.pointerType === "mouse" && event.button !== 0)
    )
      return
    pointerStart.current = {
      x: event.clientX,
      y: event.clientY,
      id: event.pointerId,
      time: event.timeStamp,
      horizontal: false,
    }
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current
    if (!start || start.id !== event.pointerId) return
    const x = event.clientX - start.x
    const y = event.clientY - start.y
    if (!start.horizontal) {
      if (Math.max(Math.abs(x), Math.abs(y)) < 8) return
      if (Math.abs(y) >= Math.abs(x)) {
        resetDrag()
        return
      }
      start.horizontal = true
      event.currentTarget.setPointerCapture(event.pointerId)
      setDragging(true)
    }
    event.preventDefault()
    const limit = event.currentTarget.clientWidth * 0.85
    const offset = Math.max(-limit, Math.min(limit, x))
    dragOffsetRef.current = offset
    setDragOffset(offset)
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current
    pointerStart.current = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (!start || start.id !== event.pointerId) return
    const x = event.clientX - start.x
    const y = event.clientY - start.y
    const speed = Math.abs(x) / Math.max(1, event.timeStamp - start.time)
    // 짧은 탭과 세로 스크롤은 제외하고, 가볍고 빠른 가로 스와이프도 인식합니다.
    if (
      start.horizontal &&
      Math.abs(x) > Math.abs(y) * 1.25 &&
      (Math.abs(x) >= SWIPE_DISTANCE || (Math.abs(x) >= 18 && speed > 0.35))
    ) {
      changePhoto(x < 0 ? 1 : -1)
    } else {
      resetDrag()
    }
  }

  const visibleIndex = frame?.index ?? request.index
  const layers = frame
    ? [frame.previous, frame.index].filter((index) => index !== null)
    : []
  const transitionStyle = {
    "--photo-direction": frame?.direction ?? 0,
    "--photo-exit-start": `${frame?.offset ?? 0}px`,
    "--photo-drag": `${dragOffset}px`,
    "--photo-transition": `${PHOTO_TRANSITION_MS}ms`,
  } as CSSProperties

  return (
    <section
      className="gallery-lightbox__dialog"
      role="dialog"
      aria-modal="true"
      aria-label="웨딩 사진 크게 보기"
    >
      <div
        className="gallery-lightbox__backdrop"
        style={{ backgroundImage: `url(${GALLERY_THUMBNAILS[visibleIndex]})` }}
        aria-hidden="true"
      />
      <div className="gallery-lightbox__header">
        <button
          ref={closeButtonRef}
          type="button"
          className="gallery-lightbox__control gallery-lightbox__close"
          aria-label="사진 닫기"
          onClick={onClose}
        >
          <span className="gallery-lightbox__close-icon" aria-hidden="true" />
        </button>
      </div>
      <div
        className={`gallery-lightbox__stage${dragging ? " gallery-lightbox__stage--dragging" : ""}`}
        style={transitionStyle}
        aria-busy={loadState === "loading"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={resetDrag}
        onLostPointerCapture={() => {
          if (pointerStart.current) resetDrag()
        }}
      >
        {(!frame || (frame.direction === 0 && frame.entering)) && (
          <img
            className="gallery-lightbox__preview"
            src={GALLERY_THUMBNAILS[visibleIndex]}
            alt=""
            aria-hidden="true"
            draggable={false}
          />
        )}
        {layers.map((index) => {
          const outgoing = index === frame?.previous
          return (
            <img
              key={index}
              className={`gallery-lightbox__image${outgoing ? " gallery-lightbox__image--outgoing" : frame?.entering ? " gallery-lightbox__image--incoming" : ""}`}
              src={GALLERY_IMAGES[index]}
              width={GALLERY_IMAGE_SIZES[index].width}
              height={GALLERY_IMAGE_SIZES[index].height}
              alt={outgoing ? "" : `웨딩 사진 ${index + 1}`}
              aria-hidden={outgoing || undefined}
              decoding="async"
              draggable={false}
            />
          )
        })}
        {showLoader && loadState === "loading" && (
          <span className="gallery-lightbox__loading" role="status">
            사진 불러오는 중
          </span>
        )}
        {loadState === "error" && (
          <div className="gallery-lightbox__error" role="status">
            <p>사진을 불러오지 못했어요.</p>
            <button
              type="button"
              onClick={() =>
                setRequest((current) => ({
                  ...current,
                  revision: current.revision + 1,
                }))
              }
            >
              다시 불러오기
            </button>
          </div>
        )}
      </div>
      <div className="gallery-lightbox__footer">
        <button
          type="button"
          className="gallery-lightbox__control"
          aria-label="이전 사진"
          onClick={() => changePhoto(-1)}
        >
          <ArrowLeft aria-hidden="true" />
        </button>
        <span
          className="gallery-lightbox__counter"
          aria-live="polite"
          aria-atomic="true"
        >
          {visibleIndex + 1} / {GALLERY_IMAGES.length}
        </span>
        <button
          type="button"
          className="gallery-lightbox__control gallery-lightbox__next"
          aria-label="다음 사진"
          onClick={() => changePhoto(1)}
        >
          <ArrowLeft aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}
