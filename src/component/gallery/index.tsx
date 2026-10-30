import { useCallback, useEffect, useRef, useState } from "react"
import ArrowLeft from "../../icons/angle-left-sm.svg?react"
import { LazyDiv } from "../lazyDiv"
import { Button } from "../button"
import { Modal } from "../modal"
import { GALLERY_IMAGE_SIZES, GALLERY_THUMBNAILS } from "../../images"
import { useNearViewport } from "../../hooks/useNearViewport"
import { PhotoViewer } from "./PhotoViewer"

const PREVIEW_PHOTO_COUNT = 12

/** 작은 사진을 3열로 모아 보여주고 선택한 사진을 전체 화면으로 확대합니다. */
export const Gallery = () => {
  const [expanded, setExpanded] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null)
  const [gridRef, isNearViewport] = useNearViewport<HTMLDivElement>()
  const openerRef = useRef<HTMLButtonElement>(null)
  const firstExtraPhotoRef = useRef<HTMLButtonElement>(null)
  const isOpen = selectedPhoto !== null

  const closePhoto = useCallback(() => setSelectedPhoto(null), [])
  useEffect(() => {
    if (!isOpen) return
    return () => openerRef.current?.focus({ preventScroll: true })
  }, [isOpen])

  useEffect(() => {
    if (expanded) firstExtraPhotoRef.current?.focus({ preventScroll: true })
  }, [expanded])

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
                  className="gallery__thumbnail-image"
                  src={image}
                  width={GALLERY_IMAGE_SIZES[index].width}
                  height={GALLERY_IMAGE_SIZES[index].height}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  onLoad={(event) =>
                    event.currentTarget.classList.add(
                      "gallery__thumbnail-image--loaded",
                    )
                  }
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
          <PhotoViewer initialPhoto={selectedPhoto} onClose={closePhoto} />
        )}
      </Modal>
    </>
  )
}
