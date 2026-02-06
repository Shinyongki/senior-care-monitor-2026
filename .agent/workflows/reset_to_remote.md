---
description: 로컬 저장소를 원격 저장소(GitHub) 상태로 강제 초기화하기
---

# 로컬 저장소 강제 초기화 (Git Reset Hard)

이 워크플로우는 로컬 컴퓨터의 모든 변경 사항을 삭제하고, 깃허브의 원격 저장소(`origin/main`) 상태와 완전히 동일하게 되돌릴 때 사용합니다.

> [!CAUTION]
> **데이터 손실 주의**: 이 작업을 수행하면 커밋하지 않은 파일이나 로컬에만 있는 작업 내용(예: 방금 수정한 코드 등)이 **영구적으로 삭제**됩니다. 삭제된 내용은 복구할 수 없습니다.

## 실행 단계

1. 원격 저장소(GitHub)의 최신 정보를 가져옵니다.

```powershell
// turbo
git fetch origin
```

2. 로컬 저장소를 원격 저장소의 `main` 브랜치 상태로 강제로 맞춥니다.

```powershell
git reset --hard origin/main
```

---
**설명**:
- `git fetch origin`: 깃허브의 최신 변경 내역 정보를 가져옵니다.
- `git reset --hard origin/main`: 현재 내 컴퓨터의 파일들을 깃허브의 최신 내용(`origin/main`)과 완전히 똑같이 만듭니다.
