# Vanilla meet-up

## Introduction
구글 맵과 Meet-up API를 이용해 만든 지역 기반 Meetup List 웹 애플리케이션입니다.
<br>
![](vanilla-meetup.gif)

## Setup

Install dependencies

```sh
$ yarn install (or npm install)
```

## Development

```sh
$ yarn dev (or npm run dev)
# visit http://localhost:8080
```

## Features
지역 기반 Meetup 관리 웹 애플리케이션입니다. 주요 기능은 다음과 같습니다.

- 메인 화면에서 지도와 Meetup List를 볼 수 있습니다.
- 사용자는 지도에서 원하는 지역을 클릭하여 선택할 수 있습니다.
- 사용자가 선택한 지역의 Meetup List를 보여주어야 합니다. Meetup List는 [Meetup Upcoming Events API](https://www.meetup.com/meetup_api/docs/find/upcoming_events/)를 이용했습니다.
- Meetup List에서 아래와 같은 기본적인 이벤트의 정보들을 확인할 수 있습니다.
  - 이벤트 이름
  - Meetup Group 이름
  - 이벤트 날짜 및 시간
  - RSVP 인원
  - 이벤트 호스트의 이름과 사진
- Meetup List에는 즐겨찾기 기능이 있어야 합니다.
  - 사용자는 원하는 Meetup을 즐겨찾기에 추가할 수 있어야 합니다.
  - 사용자는 즐겨찾기에 추가한 Meetup을 다시 즐겨찾기에서 제거할 수 있어야 합니다.
  - [Local Storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)를 이용해 즐겨찾기 목록이 저장되도록 했습니다.

## Tech
- Javascript
- HTMl5
- CSS3
