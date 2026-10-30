import { useEffect, useRef, useState } from "react"

/** 화면에 가까워진 콘텐츠만 한 번 준비해 사진 전송량과 지도 호출을 줄입니다. */
export const useNearViewport = <T extends HTMLElement>(
  rootMargin = "300px",
) => {
  const ref = useRef<T>(null)
  const [isNearViewport, setIsNearViewport] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (!("IntersectionObserver" in window)) {
      setIsNearViewport(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsNearViewport(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [rootMargin])

  return [ref, isNearViewport] as const
}
