import {
  BRIDE_FULLNAME,
  GROOM_FULLNAME,
  LOCATION,
  INVITATION_URL,
  WEDDING_DATE,
  WEDDING_DATE_FORMAT,
} from "../../const"
import ktalkIcon from "../../icons/ktalk-icon.png"
import { LazyDiv } from "../lazyDiv"
import { useKakao } from "../store"

const invitationUrl = INVITATION_URL
const previewImageUrl = new URL("preview_image.png", invitationUrl).toString()

/**
 * 카카오톡으로 초대장을 공유할 수 있는 버튼 컴포넌트입니다.
 *
 * @returns {JSX.Element} 공유 버튼 섹션
 */
export const ShareButton = () => {
  const kakao = useKakao()
  return (
    <LazyDiv className="footer share-button">
      <button
        className="ktalk-share"
        onClick={() => {
          // 카카오 SDK 로드 전이면 무시
          if (!kakao) {
            return
          }

          // 이미지·제목·버튼 모두 동일한 공식 청첩장으로 연결합니다.
          kakao.Share.sendDefault({
            objectType: "feed",
            content: {
              title: `${GROOM_FULLNAME} ❤️ ${BRIDE_FULLNAME}의 결혼식에 초대합니다.`,
              description:
                WEDDING_DATE.format(WEDDING_DATE_FORMAT) + "\n" + LOCATION,
              imageUrl: previewImageUrl,
              link: {
                mobileWebUrl: invitationUrl,
                webUrl: invitationUrl,
              },
            },
            buttons: [
              {
                title: "청첩장 보기",
                link: {
                  mobileWebUrl: invitationUrl,
                  webUrl: invitationUrl,
                },
              },
            ],
          })
        }}
      >
        <img src={ktalkIcon} alt="ktalk-icon" /> 카카오톡으로 공유하기
      </button>
    </LazyDiv>
  )
}
