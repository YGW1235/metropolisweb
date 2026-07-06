"use client";

import { useEffect } from "react";

export function ViewTracker({ topicId }: { topicId: string }) {
  useEffect(() => {
    fetch(`/topics/${topicId}/view`, {
      method: "POST",
    }).catch(() => {
      // 조회수 기록 실패는 사용자 경험을 막지 않습니다.
    });
  }, [topicId]);

  return null;
}