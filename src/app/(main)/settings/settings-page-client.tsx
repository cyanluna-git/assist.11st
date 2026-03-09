"use client";

import { Loader2 } from "lucide-react";
import {
  useNotificationSettings,
  useToggleNotificationSetting,
} from "@/hooks/use-notifications";
import type { NotificationType } from "@/types/notification";
import { NOTIFICATION_TYPE_LABELS } from "@/types/notification";

const NOTIFICATION_TYPE_DESCRIPTIONS: Record<NotificationType, string> = {
  comment: "게시글에 새 댓글이 달렸을 때",
  reply: "내 댓글에 답글이 달렸을 때",
  notice: "새 공지가 등록되었을 때",
  poll: "새 투표가 등록되었을 때",
  event_reminder: "일정 시작 전 알림",
};

const ORDERED_TYPES: NotificationType[] = [
  "comment",
  "reply",
  "notice",
  "poll",
  "event_reminder",
];

function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-brand" : "bg-muted"
      }`}
    >
      <span
        className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export function SettingsPageClient() {
  const { data: settings, isLoading } = useNotificationSettings();
  const toggleSetting = useToggleNotificationSetting();

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-lg font-semibold text-text-strong">설정</h1>

      {/* Notification Settings Section */}
      <section>
        <h2 className="mb-1 text-sm font-semibold text-text-strong">
          알림 설정
        </h2>
        <p className="mb-4 text-xs text-text-muted">
          유형별로 알림 수신 여부를 설정합니다.
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-5 animate-spin text-text-subtle" />
          </div>
        ) : (
          <div className="divide-y divide-line-subtle rounded-xl border border-line-subtle">
            {ORDERED_TYPES.map((type) => {
              const enabled = settings?.[type] ?? true;

              return (
                <div
                  key={type}
                  className="flex items-center justify-between px-4 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-main">
                      {NOTIFICATION_TYPE_LABELS[type]}
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {NOTIFICATION_TYPE_DESCRIPTIONS[type]}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={enabled}
                    onChange={(newVal) =>
                      toggleSetting.mutate({ type, enabled: newVal })
                    }
                    disabled={toggleSetting.isPending}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
