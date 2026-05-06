# 에이전트 개발 규칙

이 문서는 AI 에이전트가 `ground.codes` 모노레포에서 코드를 작성하고 기여할 때 따라야 하는 규칙과 가이드라인을 정의합니다.

## 목차

- [프로젝트 개요](#프로젝트-개요)
- [코드 작성 규칙](#코드-작성-규칙)
- [커밋 규칙](#커밋-규칙)
- [보안 및 개인정보](#보안-및-개인정보)
- [파일 구조](#파일-구조)
- [코드 스타일](#코드-스타일)
- [문서화](#문서화)
- [테스트](#테스트)
- [도메인 특이사항](#도메인-특이사항)

---

## 프로젝트 개요

`ground.codes` 는 좌표 기반 주소 시스템입니다. 위경도 좌표를 사람이 기억하기 쉬운 두 단어 + 지역명 형식(예: `Yongsan-Happiness-Smile`) 으로 인코딩·디코딩하며, 지구뿐 아니라 화성·달까지 확장을 목표로 하는 다행성 주소 프레임워크입니다. ★5, public.

### 앱

- `apps/web` — Google Maps 기반 메인 웹 (POI 상세, grid, 다국어)
- `apps/grok-spiral` — Grok Spiral 좌표 인덱싱 시각화 데모
- `apps/api-ground-codes` — encoding/decoding REST API + OpenAPI/Swagger

### 패키지

- `packages/ground-codes` — 핵심 인코딩·디코딩 구현
- `packages/geoint` — 인구 500명 이상 지역의 큐레이션 지리 데이터
- `packages/codebook` — 좌표 인코딩에 쓰이는 단어 codebook
- `packages/ui` — 공통 UI 컴포넌트
- `packages/eslint-config`, `packages/typescript-config` — 공통 도구 설정

기술 스택: TypeScript / pnpm + Turborepo / Next.js (web) / 자체 API 서버.

---

## 코드 작성 규칙

### 파일 크기 제한

**모든 코드 파일은 450줄 이하로 작성되어야 합니다.**

- **최대 줄 수**: 450줄
- **권장 줄 수**: 300-400줄
- **초과 시 조치**: 파일이 450줄을 초과하면 기능별로 분리하여 모듈화
- **예외**: 자동 생성 파일(예: 빌드 산출물, OpenAPI 산출물) 은 예외로 둘 수 있음

### 코드 품질

- **명확성**: 코드는 명확하고 이해하기 쉽게 작성
- **재사용성**: 공통 로직은 `packages/ui` / `packages/ground-codes` / `packages/geoint` 로 분리
- **타입 안정성**: TypeScript strict 모드 유지
- **에러 핸들링**: 모든 비동기 작업·외부 API 호출(Google Maps, 좌표 변환) 에 적절한 에러 처리 구현

---

## 커밋 규칙

### 커밋 빈도

- 논리적 작업 단위마다 커밋, 한 번에 하나의 기능·수정사항만, 빌드 통과 상태에서만.

### 커밋 메시지 형식 (Conventional Commits)

```
<type>: <설명>
```

- `feat` — 신규 기능 / `fix` — 버그 수정 / `docs` — 문서 / `chore` — 빌드·의존성 / `refactor` — 구조 개선 / `style` — 스타일 / `test` — 테스트

#### 예시

```
feat(geoint): add Mars 1km resolution dataset
fix(web): correct compass needle rotation on Safari
chore: bump turbo to 2.x
```

---

## 보안 및 개인정보

- 비밀키·토큰·자격증명을 코드·테스트·문서에 포함하지 않습니다.
- Google Maps API 키는 `.env` 로만 관리하고, 클라이언트 노출 키는 도메인 제한을 걸어둡니다.
- 사용자 위치 데이터는 서버에 저장하지 않습니다.

---

## 파일 구조

```
ground.codes/
├── apps/
│   ├── web/                 (Next.js)
│   ├── grok-spiral/         (시각화)
│   └── api-ground-codes/    (API 서버)
├── packages/
│   ├── ground-codes/        (코어 인코딩)
│   ├── geoint/              (지리 데이터)
│   ├── codebook/            (단어 codebook)
│   ├── ui/                  (공통 컴포넌트)
│   ├── eslint-config/
│   └── typescript-config/
├── package.json             (root, workspaces)
├── pnpm-workspace.yaml
├── turbo.json
└── AGENTS.md / CLAUDE.md
```

---

## 코드 스타일

- **포매터**: prettier (`pnpm format`)
- **린터**: turbo 위임 (`pnpm lint`) + husky pre-commit + lint-staged
- **타입 체크**: `pnpm check-types`
- **빌드**: `pnpm build`

PR 제출 전 위 4개를 모두 통과시킵니다.

---

## 문서화

- 영어 README 를 우선 유지합니다.
- 각 패키지·앱은 자체 README 를 가지며, root README 의 패키지 목록과 동기화합니다.
- 좌표 시스템·인코딩 규칙 변경은 `packages/ground-codes/README.md` 에 spec 변경 이력으로 남깁니다.

---

## 테스트

- `packages/ground-codes` 의 인코딩·디코딩 함수는 known-pair 테이블 기반 단위 테스트 필수.
- `packages/geoint` 데이터 갱신 시 sample 검증.
- Web 앱의 시각 회귀는 수동을 우선합니다.

---

## 도메인 특이사항

- **다행성 주소**: 지구 외 행성(화성·달) 지원이 도입되면 `packages/ground-codes` 의 인코딩이 행성 식별자를 받도록 시그니처가 확장됩니다. breaking change 면 major.
- **좌표 정확도**: GCS(Geographic Coordinate System) 기반이므로 부동소수 정밀도 손실에 주의 — high-zoom 영역의 인코딩은 fixed-point 또는 BigInt 처리.
- **외부 의존**: Google Maps SDK 변경에 추적이 필요합니다 (Maps Platform 의 deprecation 알림 모니터링).
