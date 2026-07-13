const entries = ({ reason, confidence = "high", words }) =>
  words
    .trim()
    .split(/\s+/)
    .map((word) => ({ word, reason, confidence }));

export const koreanPolicyFindingsPart1 = [
  ...entries({
    reason: "brand-or-platform",
    words: "엘지 구글 롯데 틱톡 네이버 유튜브",
  }),
  ...entries({
    confidence: "medium",
    reason: "brand-common-word-collision",
    words: "애플 신세계",
  }),
  ...entries({
    reason: "place-landmark-or-dynasty",
    words:
      "백두 경복궁 창덕궁 덕수궁 고구려 남대문 영산강 섬진강 대동강 임진강 소양강",
  }),
  ...entries({
    reason: "personal-or-proper-name",
    words: "바흐 멘델 하이든 베르디 푸치니 차이코 파가니 바르톡 모차르트",
  }),
  ...entries({
    reason: "alcohol",
    words:
      "와인 맥주 소주 맛술 술병 술잔 술통 막걸리 와인병 와인잔 와인통 위스키 소주잔 맥주잔",
  }),
  ...entries({
    reason: "medical-or-clinical",
    words: `
        의사 약국 재활 한의 치과 증상 의학 약사 혈압 혈액 백신 염증 통원
        입원 세균 혈관 항체 구급차 간호사 호르몬 염색체
      `,
  }),
  ...entries({
    reason: "legal-political-or-military",
    words:
      "법률 군사 규제 법원 법규 법정 법령 법조 법학 법무 인권 민주 주권 변호사",
  }),
  ...entries({
    reason: "religious-ritual-or-occult",
    words:
      "마법 성당 제단 제물 사제 신령 신주 신전 신사 신탁 신성 신당 영가 사신 마법사",
  }),
  ...entries({
    reason: "violent-disaster-weapon-or-military",
    words: "사격 기폭 탱크 방폭 지진 화재 절단 화살 적군 장군",
  }),
  ...entries({
    reason: "dating-body-or-underwear-adjacent",
    words: "연인 입술 내의 수영복 로맨스 데이트 신혼여행",
  }),
  ...entries({
    confidence: "medium-high",
    reason: "game-gambling-adjacent-or-foreign-fragment",
    words: "룰 윷 게임기",
  }),
  ...entries({
    reason: "clipped-loanword-or-game-product-jargon",
    words: "오렌 아몬 바닐 라즈 크랜 리보 아이템 세이브 퀘스트 스타트 레전드",
  }),
  ...entries({
    confidence: "medium",
    reason: "generated-looking-compound",
    words:
      "푸른새봄 은빛달빛 은빛물빛 차분한일감 새벽일감 밝은누룽지 고요한누룽지",
  }),
  ...entries({
    reason: "second-pass-fragment-brand-or-platform-collision",
    words: "빙 뷰 톡 줌 텐 티쏘 다이소",
  }),
  ...entries({
    reason: "second-pass-proper-name-or-place-fragment",
    words: "베토 주안 가거",
  }),
  ...entries({
    reason: "second-pass-religious-myth-or-occult",
    words: "신화 주술 영혼 마술 여신",
  }),
  ...entries({
    reason: "second-pass-medical-or-clinical",
    words: "간호 진료 증세 예후 약통 치주 부기 경련",
  }),
  ...entries({
    reason: "second-pass-legal-political-or-civic",
    words: "특허 상표 판사 고소 고발 의회",
  }),
  ...entries({
    reason: "second-pass-gambling-game-or-chance",
    words: "블랙잭 주사위 고도리 백개먼",
  }),
  ...entries({
    reason: "second-pass-disaster-violence-or-hunting",
    words: "해일 태풍 사냥꾼",
  }),
  ...entries({
    reason: "second-pass-alcohol",
    words: "브루어리",
  }),
  ...entries({
    reason: "second-pass-dating-or-relationship",
    words: "약혼",
  }),
  ...entries({
    reason: "second-pass-clipped-or-malformed-loanword",
    words: "악세 부끄",
  }),
  ...entries({
    reason: "third-pass-medical-body-anatomy-or-herb",
    words: `
        손 입 귀 발 뼈 턱 허리 머리 눈썹 손톱 얼굴 신체 발톱 근육 수염
        잇몸 구강 복부 척추 관절 소변 대변 종양 단백 간염 폐렴 비만
        신장 비장 대장 소장 식도 인후 심실 심방 맥박 체액 청각 후각
        안과 소아 내과 외과 응급 처방 소독 예방 체온 소화 면역 심장
        호흡 신경 접종 붕대 소생 마취 수액 퇴원 이비인후과 알레르기
        유전자 단백질 리보솜 세포질 백출 황기 지황 천마 갈근 복령
        황정 단삼 황백 백지
      `,
  }),
  ...entries({
    reason: "third-pass-proper-place-event-or-planet",
    words: `
        가야 종묘 진해 서귀 마라도 가거도 설악 금강 동강 남강 북강
        오대 소백 덕유 변산 무등 팔공 치악 북악 수락 대둔 월악 주왕
        구룡 운악 천관 용문 화악 설봉 금오 주봉 신불 대청 용화 운봉
        북해 영산 서초 청원 지구 목성 금성 토성 천왕 해왕 명왕 올림픽
        삼일절
      `,
  }),
  ...entries({
    reason: "third-pass-brand-platform-software-or-account-jargon",
    words: `
        슬랙 레딧 옥션 한화 넥슨 모나미 아모레 오메가 오레오 다이제
        파네라이 에러 배포 유저 댓글 이모 하트 노드 채널 계정 로그인
        아이디 관리자 게스트 이메일 와이파이 이모티콘 사용자 메시지
        수신함 발신함 변수 함수 리턴 객체 쿼리
      `,
  }),
  ...entries({
    reason: "third-pass-religion-ritual-or-occult",
    words: `
        기도 예배 성경 경전 성지 천국 구원 천사 성자 성녀 요정 명복
        신녀 신명 부적 사주 명당 연등 요술 성전 제의 백중 신자 성소 유두
      `,
  }),
  ...entries({
    reason: "third-pass-alcohol",
    words: `
        주점 주류 사케 비어 양조 주조 시음 포도주 바텐더 소믈리에
        테이스팅 비노
      `,
  }),
  ...entries({
    reason: "third-pass-violence-disaster-gambling-or-threat",
    words: `
        해적 복싱 펜싱 무술 타격 전술 폭풍 가뭄 홍수 한파 폭염 홀덤
        빙고 사냥 괴물 악당 도적 방어구 배틀 복수 추격 위협 발사 화염
        충돌 분쟁 대결 적대 무에타이 킥복싱 스파링
      `,
  }),
  ...entries({
    reason: "third-pass-legal-civic-finance-or-identity",
    words: `
        경찰 행정 세무 계약 정책 보험 상해 보상 증서 담보 위임 대출
        조항 의무 권리 소송 중재 면허 허가 신분 요건 조례 규정 국가
        시민 자치 선출 법인 여권 수사 증거 신고 증인 의결 약관 권한
        주식 투자 채권 수표 환율 이자 배당 펀드 증권 주가 금리 환전 재무
      `,
  }),
  ...entries({
    reason: "third-pass-dating-or-relationship",
    words: "결혼 신혼 신랑 혼례 이성 교제 사귐",
  }),
  ...entries({
    reason: "third-pass-clipped-malformed-or-generated-looking",
    words: `
        캐릭 그라픽 랩퍼 후라이 씨리얼 헤이즐 피스타 브륄레 악세사리
        악세서리 스트라빈 양배 파슬 셀러 바나 소고 닭고 양고 해산
        오징 모짜 마요 밀가 선글 나락단 콩단 팥단 깨단 마늘단
        푸른누룽지 소담한누룽지 새벽누룽지 따스한누룽지 너른누룽지
        너른일감 소담한일감 따스한일감 맑은라온 푸른라온
      `,
  }),
  ...entries({
    reason: "fourth-pass-clipped-loanword-or-fragment",
    words:
      "밴 휠 뱅 롤 젤 롱 숏 맵 힙 팩 레 윙 딜 메 슈 번 링 림 릴 맥 니 빔 홈",
  }),
  ...entries({
    reason: "fourth-pass-software-hardware-account-or-media-jargon",
    words: `
        블로그 회원 인증 폴더 모니터 키보드 마우스 스위치 케이블 배터리
        충전기 디지털 비디오 오디오 스크린 화면
      `,
  }),
  ...entries({
    reason: "fourth-pass-finance-civic-or-commerce",
    words: `
        돈 현금 화폐 지폐 금융 경제 세금 임금 예금 결제 금액 대금 송금
        상환 환불 모금 기금 금고 보증 요금 수입 손실 이익 상금 후보
        증명 영수증
      `,
  }),
  ...entries({
    reason: "fourth-pass-medical-body-health-or-disaster",
    words: `
        숨 혈 눈물 한숨 복근 소아과 체온계 소독제 기저귀 미세먼지 소방
        소방관 소방서 소방차 소방복 소방대 소방장 소방사 소방센터
        소방대장 소화기 소화전 구명환
      `,
  }),
  ...entries({
    reason: "fourth-pass-herb-drug-or-malformed-loanword",
    words: `
        양귀비 천궁 바질 로즈마리 오레가노 파슬리 민트 커민 세이지
        페퍼민트 카다멈 카르다몸 라벤더 향신료
      `,
  }),
  ...entries({
    reason: "fourth-pass-religion-ritual-holiday-or-violence",
    words: "절 축복 신도 크리스마스 태권도 합기도 군 딜러",
  }),
  ...entries({
    reason: "fourth-pass-adult-or-relationship",
    words: "결혼식 피로연 혼수",
  }),
  ...entries({
    reason: "fifth-pass-medical-health-body-or-biomedical",
    words: `
        치유 건강 완화 회복 힐링 보건 수의 심리 침술 체중 바디 마사지 문신
        핵산 미생물 영양소 영양분 식습관 돌연변이 라돈
      `,
  }),
  ...entries({
    reason: "fifth-pass-finance-legal-civic-or-commerce",
    words: "후원 기부 회계 자산 협약 서약 신용 재산 부동산 이용료 수수료",
  }),
  ...entries({
    reason: "fifth-pass-adult-relationship-negative-alcohol-or-hazard",
    words: "사랑 로맨틱 겁 슬픔 망신 불신 안주 전사 면도날 원자력",
  }),
  ...entries({
    reason: "fifth-pass-brand-game-product-jargon-or-malformed",
    words: "에이스 모노폴리 조이스틱 샌드박스 몬테레이 빛나 차분 따뜻 큰 긴 볶",
  }),
  ...entries({
    reason: "sixth-pass-brand-product-or-identity-title",
    words: `
        다음 올레 토니 바비 왕자 여왕 여성 남성 여자 남자 위원 회장 서기
        사장 대표 북촌 서해 남양 남포 서경
      `,
  }),
  ...entries({
    reason: "sixth-pass-religion-occult-medical-or-biomedical",
    words: `
        요가 명상 사리 유령 마녀 구급 기침 증후 심박 식이 배양 효소 세포
        어깨 상체 하체 체형 노화 분유 수유
      `,
  }),
  ...entries({
    reason: "sixth-pass-finance-legal-commerce-or-account",
    words: `
        자본 소득 무역 수출 노동 재정 거래 독점 계좌 수익 분배 재원 잔고
        이체 통장 코인 경매 입찰 청구 납부 고지 지급 등록 할인 가격 구매
        주문 배달 세일 쿠폰 배송 재고 발행 거래처 추첨
      `,
  }),
  ...entries({
    reason: "sixth-pass-software-hardware-account-or-media",
    words: `
        보안 소셜 탐지 계층 대역 연산 제어 전송 암호 응답 설정 구독 알림
        수신 그룹 답장 첨부 발신 보관 삭제 목록 저장 편집 분류 화질 방송
        통신 패널 명령 접속 터치 녹화 볼륨 복사 레이저 그래픽 디스크
        플러그 이어폰 휴대폰 헤드폰 노트북 리모컨 콘센트 솔루션 플래시
        메모리 라이브 게이트 업그레이드
      `,
  }),
  ...entries({
    reason: "sixth-pass-negative-risk-violence-distress-or-malformed",
    words: `
        비극 호러 놀람 걱정 생존 경고 순찰 경비 비상 경보 충격 방어 방패
        투구 사슬 가드 파단 갈등 대립 논쟁 반목 마찰 이별 압박 긴장 굴욕
        치욕 수모 불만 반감 거부 비난 경멸 모욕 냉소 불쾌 불평 불안 고독
        비애 어둠 불화 비명 미디 플릭 비메 하모 멜로 샌드 디핑 핸드 플랫
        점핑 신디 비주 듀오 시크 컨셉 미도 캐시 푸쉬 코다 모듬 드로우
        파이브 나인 세븐 식스 쓰리 하이 로우
      `,
  }),
  ...entries({
    reason: "seventh-pass-finance-legal-or-commerce",
    words: "동전 연봉 결재 비용 고용 승인 보너스",
  }),
  ...entries({
    reason: "seventh-pass-software-media-product-or-technical-jargon",
    words: `
        주소록 도움말 매뉴얼 라인업 에디션 커뮤니티 이미지 비주얼 엠블럼
        일러스트 브로셔 플로우 화학 실험 전자 전기 용접 토목 항공 변압기
        주파수 그리드 태양광 바이오 축전기 저항기 수처리 냉난방 아르곤
        크립톤 도형학 기하학 생태학 유기체
      `,
  }),
  ...entries({
    reason: "seventh-pass-medical-health-herb-religion-or-hazard",
    words: `
        유산소 운동량 체력 지구력 유연성 화장실 백수오 구기자 차가버섯
        에키네시아 대보름 한가위 의식 신념 정신 비상식량 방충제 라이터 탐정
      `,
  }),
  ...entries({
    reason: "seventh-pass-malformed-fragment",
    words: "의 나 하 다 얌 짱 짤 쿵 쌤 락 존 사이키 크로노 일렉트로 스테인",
  }),
  ...entries({
    reason: "eighth-pass-medical-body-or-dental",
    words: "치아 이빨 치약 치실 양치",
  }),
  ...entries({
    reason: "eighth-pass-legal-finance-civic-or-corporate",
    words: `
        권 증 합의 협의 결의 자격 은행 상장 기업 회사 기관 협회 연합 직원
        출판사
      `,
  }),
  ...entries({
    reason: "eighth-pass-software-media-or-technical-hardware",
    words: `
        전화 영상 라디오 아날로그 엔진 다이얼 타이머 전기장판 전기장치
        전기기구 전기제품 전기기기 전기용품 전기기계 전기장비
      `,
  }),
  ...entries({
    reason: "eighth-pass-game-sports-or-product-jargon",
    words: `
        퀴즈 도미노 당구 볼링 스페어 셔틀콕 스매시 스코어 바스켓 리바운드
        나일론 폴리에스터 스웨이드 트리밍 핸드메이드 그라데이션 아방가르드
      `,
  }),
  ...entries({
    reason: "eighth-pass-adjective-fragment-brand-or-proper-collision",
    words: `
        두꺼운 가벼운 무거운 단단한 유연한 견고한 섬세한 화려한 단순한
        우아한 세련된 부드러운 접이 현대 소나타
      `,
  }),
  ...entries({
    reason: "ninth-pass-place-venue-institution",
    words: `
        도시 광장 공원 극장 학교 학원 대학 학회 센터 공장 공항 호텔 카페
        식당 여관 회관 서원 서관 화랑 주택 단지 동네 시내 구역 지역 박물관
        도서관 지하철 궁전
      `,
  }),
  ...entries({
    reason: "ninth-pass-place-like-island-region-or-dynasty",
    words: `
        무의 서도 동도 남도 북도 여도 모도 중도 금도 은도 초도 화도 비도
        흑도 소도 대도 상도 하도 연도 사도 장도 구도 가도 마도 북산 북문
        북항 북제 남촌 남천 서대 삼국 서부 남부
      `,
  }),
  ...entries({
    reason: "ninth-pass-title-role-family-or-identity",
    words: `
        교수 학생 강사 교사 선생 학장 교장 사서 저자 기자 감독 선수 작가
        배우 고객 승객 여객 손님 상인 사육사 여행자 조종사 할머니 할아버지
        누나 동생 친척 형제 자매 사촌 조카 삼촌 형님 언니 조부 조모 누님
        오빠 유아 소녀 소년 부모 엄마 아빠
      `,
  }),
  ...entries({
    reason: "ninth-pass-finance-commerce-corporate",
    words: `
        시장 상점 가게 상품 판매 매장 장터 광고 홍보 예약 접수 회의 업무
        상사 출근 퇴근 기한 서류 직무 직책 업종 업계 실적 물류 유통 경영
        사무 비서 사업 소비 생산 수요 불황 호황 위기 협상 통계 지표 견적
        혜택 적립 사은 제공 부서 업체
      `,
  }),
  ...entries({
    reason: "ninth-pass-legal-civic-policy",
    words:
      "규칙 절차 수칙 방침 책임 공정 이행 변경 사안 공지 문의 자문 심사 안건 의제 규범 행위 기표 서명",
  }),
  ...entries({
    reason: "ninth-pass-software-hardware-or-technical",
    words: `
        장치 장비 기계 설비 성능 기술 기능 신호 전파 음향 인쇄 정비 전력
        난방 냉방 전선 공급 유지 계산 교체 터빈 배관 수압 전압 전류 수질
        충전 풍력 수력 지열 연료 석유 부품 내장 외장 연비 가속 제동 핸들
        공조 센서 알람 기체 이륙 착륙 조종 탑재 무선 압력 노즐 머신 추출
        분쇄 제조 싱크 방수 방오 방진 방충 방음 방열 방전 방화 방사 합성
        경량 확장 보강 부착 배선 수온 어종 퓨즈 기판 밸브 소켓 입력 출력
        구현 추적 화소 녹음 이송 배출 압축 분사 공업 건설 하수 폐수 급수
        배수 정제
      `,
  }),
  ...entries({
    reason: "ninth-pass-science-math-specialist",
    words: `
        물질 표본 측정 표준 조건 생물 과학 수학 진화 생태 생명 암석 유황
        광물 화산 고도 용암 분화 운석 혜성 위성 행성 항성 천체 석영 운모
        규산 석회 석고 사암 규암 암반 지각 광맥 지형 지질 퇴적 촉매 원료
        액체 고체 분말 입자 조성 농도 유체 전이 계면 열전 응용 법칙 원리
        저항 확률 분포 추정 가설 평균 편차 회귀 미분 적분 극한 계수 원자
        원소 헬륨 수소 질소 네온 제논 분자 탄화 산화 유전
      `,
  }),
  ...entries({
    reason: "ninth-pass-religion-ritual-holiday-or-adult-relationship",
    words:
      "설날 추석 단오 명절 신년 차례 주일 동지 예물 축가 하객 예식 부케 주례 고백 친밀 애정 포옹 연가",
  }),
  ...entries({
    reason: "ninth-pass-medical-body-health-hygiene",
    words: `
        욕실 욕조 목욕 세면 변기 샤워 칫솔 린스 토너 앰플 타투 케어 틴트
        립스틱 블러셔 클렌저 리무버 에센스 마스카라 아이섀도 메이크업
        면도폼 세면도구
      `,
  }),
  ...entries({
    reason: "ninth-pass-negative-user-hostile-or-malformed",
    words:
      "문제 냄새 실패 불황 위기 편견 반발 고함 먼지 곰팡이 가리 사파 에메 토파 읽기 보내기",
  }),
];
