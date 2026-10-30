import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react"
import ArrowLeft from "../../icons/angle-left-sm.svg?react"
import { LazyDiv } from "../lazyDiv"
import { Button } from "../button"
import { Modal } from "../modal"
import {
  GALLERY_IMAGES,
  GALLERY_IMAGE_SIZES,
  GALLERY_THUMBNAILS,
} from "../../images"
import { useNearViewport } from "../../hooks/useNearViewport"

const PREVIEW_PHOTO_COUNT = 12
const SWIPE_DISTANCE = 40

/** 작은 사진을 3열로 모아 보여주고 선택한 사진을 전체 화면으로 확대합니다. */
export const Gallery = () => {
  const [expanded, setExpanded] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null)
  const [gridRef, isNearViewport] = useNearViewport<HTMLDivElement>()
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const openerRef = useRef<HTMLButtonElement>(null)
  const firstExtraPhotoRef = useRef<HTMLButtonElement>(null)
  const pointerStart = useRef<{ x: number; y: number; id: number } | null>(null)
  const isOpen = selectedPhoto !== null

  const closePhoto = useCallback(() => setSelectedPhoto(null), [])
  const changePhoto = useCallback((direction: number) => {
    setSelectedPhoto((index) =>
      index === null
        ? null
        : (index + direction + GALLERY_IMAGES.length) % GALLERY_IMAGES.length,
    )
  }, [])

  useEffect(() => {
    if (!isOpen) return
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return
      if (event.key === "Escape") {
        event.preventDefault()
        closePhoto()
      } else if (event.key === "ArrowLeft") {
        event.preventDefault()
        changePhoto(-1)
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        changePhoto(1)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      pointerStart.current = null
      openerRef.current?.focus({ preventScroll: true })
    }
  }, [isOpen, closePhoto, changePhoto])

  useEffect(() => {
    if (expanded) firstExtraPhotoRef.current?.focus({ preventScroll: true })
  }, [expanded])

  useEffect(() => {
    if (selectedPhoto === null) return
    // 확대하지 않은 사진은 작은 썸네일만 사용하고, 확대 중에는 양옆 사진만 준비합니다.
    for (const offset of [-1, 1]) {
      const image = new Image()
      image.src =
        GALLERY_IMAGES[
          (selectedPhoto + offset + GALLERY_IMAGES.length) %
            GALLERY_IMAGES.length
        ]
    }
  }, [selectedPhoto])

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      !event.isPrimary ||
      (event.pointerType === "mouse" && event.button !== 0)
    )
      return
    pointerStart.current = {
      x: event.clientX,
      y: event.clientY,
      id: event.pointerId,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current
    pointerStart.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    if (!start || start.id !== event.pointerId) return

    const xDistance = event.clientX - start.x
    const yDistance = event.clientY - start.y
    // 세로 움직임과 짧은 터치를 구분해 사진이 의도치 않게 넘어가지 않도록 합니다.
    if (
      Math.abs(xDistance) >= SWIPE_DISTANCE &&
      Math.abs(xDistance) > Math.abs(yDistance) * 1.25
    ) {
      changePhoto(xDistance < 0 ? 1 : -1)
    }
  }

  const visiblePhotos = GALLERY_THUMBNAILS.slice(
    0,
    expanded ? GALLERY_THUMBNAILS.length : PREVIEW_PHOTO_COUNT,
  )

  return (
    <>
      <LazyDiv className="card gallery">
        <h2 className="english">Gallery</h2>
        <p className="gallery__subtitle">갤러리</p>
        <div className="gallery__grid" id="wedding-gallery-grid" ref={gridRef}>
          {visiblePhotos.map((image, index) => (
            <button
              key={image}
              ref={
                index === PREVIEW_PHOTO_COUNT ? firstExtraPhotoRef : undefined
              }
              type="button"
              className="gallery__thumbnail"
              aria-label={`사진 ${index + 1} 크게 보기`}
              aria-haspopup="dialog"
              onClick={(event) => {
                openerRef.current = event.currentTarget
                setSelectedPhoto(index)
              }}
            >
              {isNearViewport && (
                <img
                  src={image}
                  width={GALLERY_IMAGE_SIZES[index].width}
                  height={GALLERY_IMAGE_SIZES[index].height}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  alt={`웨딩 사진 ${index + 1}`}
                />
              )}
            </button>
          ))}
        </div>
        {!expanded && GALLERY_THUMBNAILS.length > PREVIEW_PHOTO_COUNT && (
          <Button
            type="button"
            className="gallery__more"
            aria-expanded={expanded}
            aria-controls="wedding-gallery-grid"
            onClick={() => setExpanded(true)}
          >
            사진 더 보기 <ArrowLeft aria-hidden="true" />
          </Button>
        )}
      </LazyDiv>

      <Modal
        className="gallery-lightbox"
        modalState={[
          isOpen,
          (open) => {
            if (!open) closePhoto()
          },
        ]}
        showCloseButton={false}
        closeOnClickBackground={false}
      >
        {selectedPhoto !== null && (
          <section
            className="gallery-lightbox__dialog"
            role="dialog"
            aria-modal="true"
            aria-label="웨딩 사진 크게 보기"
          >
            <div
              className="gallery-lightbox__backdrop"
              style={{
                backgroundImage: `url(${GALLERY_THUMBNAILS[selectedPhoto]})`,
              }}
              aria-hidden="true"
            />
            <div className="gallery-lightbox__header">
              <button
                ref={closeButtonRef}
                type="button"
                className="gallery-lightbox__control gallery-lightbox__close"
                aria-label="사진 닫기"
                onClick={closePhoto}
              >
                <span
                  className="gallery-lightbox__close-icon"
                  aria-hidden="true"
                />
              </button>
            </div>
            <div
              className="gallery-lightbox__stage"
              onPointerDown={onPointerDown}
              onPointerUp={onPointerUp}
              onPointerCancel={() => {
                pointerStart.current = null
              }}
            >
              <img
                key={selectedPhoto}
                className="gallery-lightbox__image"
                src={GALLERY_IMAGES[selectedPhoto]}
                width={GALLERY_IMAGE_SIZES[selectedPhoto].width}
                height={GALLERY_IMAGE_SIZES[selectedPhoto].height}
                alt={`웨딩 사진 ${selectedPhoto + 1}`}
                decoding="async"
                draggable={false}
              />
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
                {selectedPhoto + 1} / {GALLERY_IMAGES.length}
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
        )}
      </Modal>
    </>
  )
}
