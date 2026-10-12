// 인증 화면 왼쪽 소개 문구 (AuthLayout). 화면마다 다를 때만 페이지에서 넘긴다.
export interface Intro {
  title: [string, string]
  body: [string, string]
}

export const LOGIN_INTRO: Intro = {
  title: ['경험으로 찾는,', '나만의 가능성.'],
  body: ['오늘의 작은 경험이 내일의 나를 만듭니다.', '로그인하고 나만의 직무 여정을 이어가세요.'],
}
