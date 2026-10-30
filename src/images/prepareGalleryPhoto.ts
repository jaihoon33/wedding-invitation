import { GALLERY_AVIF_IMAGES, GALLERY_IMAGES } from "."

/** 브라우저가 지원하는 형식 하나만 골라 다운로드하고 표시 전에 디코딩합니다. */
export const prepareGalleryPhoto = (
  index: number,
  priority: "high" | "low",
) => {
  let disposed = false
  const picture = document.createElement("picture")
  const source = document.createElement("source")
  source.type = "image/avif"
  source.srcset = GALLERY_AVIF_IMAGES[index]

  const image = new Image()
  image.decoding = "async"
  image.fetchPriority = priority
  picture.append(source, image)
  image.src = GALLERY_IMAGES[index]

  // picture의 형식 선택이 반영된 뒤 실제로 선택한 사진만 디코딩합니다.
  const ready = Promise.resolve()
    .then(() => image.decode())
    .catch((error: unknown) => {
      if (disposed || image.currentSrc === image.src) throw error
      // 형식 지원이 부분적이거나 AVIF 파일을 받지 못한 경우에도 WebP로 복구합니다.
      source.removeAttribute("srcset")
      return Promise.resolve().then(() => image.decode())
    })
  return {
    image,
    ready,
    dispose: () => {
      disposed = true
      image.removeAttribute("src")
      source.removeAttribute("srcset")
      picture.replaceChildren()
    },
  }
}
