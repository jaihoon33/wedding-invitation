import {
  BRIDE_FULLNAME,
  GROOM_FULLNAME,
  LOCATION,
  INVITATION_URL,
  KAKAO_SHARE_TEMPLATE_ID,
  SHARE_IMAGE_FILE,
  WEDDING_DATE,
  WEDDING_DATE_FORMAT,
} from "../../const"
import ktalkIcon from "../../icons/ktalk-icon.png"
import { LazyDiv } from "../lazyDiv"
import { useKakao } from "../store"

const invitationUrl = INVITATION_URL
const previewImageUrl = new URL(SHARE_IMAGE_FILE, invitationUrl).toString()

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

          // 하단 앱 이름의 출처 링크도 포함해 모든 링크를 지정한 템플릿입니다.
          kakao.Share.sendCustom({
            templateId: KAKAO_SHARE_TEMPLATE_ID,
            templateArgs: {
              TITLE: `${GROOM_FULLNAME} ❤️ ${BRIDE_FULLNAME}의 결혼식에 초대합니다.`,
              DESCRIPTION:
                WEDDING_DATE.format(WEDDING_DATE_FORMAT) + "\n" + LOCATION,
              IMAGE: previewImageUrl,
            },
          })
        }}
      >
        <img src={ktalkIcon} alt="ktalk-icon" /> 카카오톡으로 공유하기
      </button>
    </LazyDiv>
  )
}
