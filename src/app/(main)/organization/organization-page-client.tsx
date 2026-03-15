"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, PencilLine, Save, ShieldCheck, UploadCloud } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { AvatarUpload } from "@/components/profiles/avatar-upload";
import {
  useOrganization,
  usePublishBylawVersion,
  useSaveOrganizationRoles,
  useUploadOrganizationImage,
} from "@/hooks/use-organization";
import { ORGANIZATION_ROLE_ORDER, type OrganizationRoleKey } from "@/lib/organization";
import type { OrganizationRole } from "@/types/organization";

type RoleFormState = Record<
  OrganizationRoleKey,
  {
    memberName: string;
    photoUrl: string | null;
  }
>;

function createRoleForm(roles: OrganizationRole[]): RoleFormState {
  return roles.reduce((acc, role) => {
    acc[role.roleKey] = {
      memberName: role.memberName ?? "",
      photoUrl: role.photoUrl ?? null,
    };
    return acc;
  }, {} as RoleFormState);
}

function formatDateTime(value?: string | null) {
  if (!value) return "미기록";
  return new Date(value).toLocaleString("ko-KR");
}

export function OrganizationPageClient({
  currentUserRole,
}: {
  currentUserRole: string;
}) {
  const canEdit = currentUserRole === "admin";
  const { data, isLoading, isError } = useOrganization();
  const saveRoles = useSaveOrganizationRoles();
  const publishBylaw = usePublishBylawVersion();
  const uploadImage = useUploadOrganizationImage();

  const [isEditingRoles, setIsEditingRoles] = useState(false);
  const [roleForm, setRoleForm] = useState<RoleFormState | null>(null);
  const [uploadingRoleKey, setUploadingRoleKey] = useState<OrganizationRoleKey | null>(null);
  const [version, setVersion] = useState("");
  const [content, setContent] = useState("");
  const [draftError, setDraftError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setRoleForm((prev) => prev ?? createRoleForm(data.roles));
    setContent((prev) => prev || data.currentBylaw?.content || "");
  }, [data]);

  const history = data?.bylawHistory ?? [];
  const roles = data?.roles ?? [];
  const roleFormReady = roleForm ?? (data ? createRoleForm(data.roles) : null);
  const roleCards = roles.map((role) => {
    const draft = roleFormReady?.[role.roleKey];
    return {
      ...role,
      memberName: draft?.memberName ?? role.memberName ?? "",
      photoUrl: draft?.photoUrl ?? role.photoUrl ?? null,
    };
  });

  if (isLoading) {
    return <OrganizationSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-sm text-text-muted">운영진 정보를 불러오지 못했습니다.</p>
      </div>
    );
  }

  async function handleRoleUpload(roleKey: OrganizationRoleKey, file: File) {
    setUploadingRoleKey(roleKey);
    try {
      const result = await uploadImage.mutateAsync(file);
      setRoleForm((prev) =>
        prev
          ? {
              ...prev,
              [roleKey]: {
                ...prev[roleKey],
                photoUrl: result.url,
              },
            }
          : prev,
      );
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "사진 업로드에 실패했습니다.");
    } finally {
      setUploadingRoleKey(null);
    }
  }

  async function handleSaveRoles() {
    if (!roleFormReady) return;
    setDraftError(null);
    try {
      await saveRoles.mutateAsync(
        ORGANIZATION_ROLE_ORDER.map((roleKey) => ({
          roleKey,
          memberName: roleFormReady[roleKey].memberName,
          photoUrl: roleFormReady[roleKey].photoUrl,
        })),
      );
      setIsEditingRoles(false);
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "운영진 저장에 실패했습니다.");
    }
  }

  async function handlePublishBylaw() {
    setDraftError(null);
    try {
      await publishBylaw.mutateAsync({ version, content });
      setVersion("");
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "회칙 발행에 실패했습니다.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-[28px] border border-line-subtle bg-[radial-gradient(circle_at_top_left,_rgba(206,169,83,0.18),_transparent_35%),linear-gradient(135deg,_rgba(16,24,40,0.96),_rgba(38,53,75,0.92))] px-6 py-8 text-white sm:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-medium text-white/85">
              <ShieldCheck className="size-3.5" />
              11기 운영진 안내
            </span>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                운영진 구성과 활동 회칙
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/72 sm:text-base">
                회장단과 총무 정보를 한 번에 확인하고, 현재 적용 중인 활동 회칙과 개정 이력을
                같은 화면에서 볼 수 있습니다.
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm text-white/78">
            <div>현재 회칙 버전: {data.currentBylaw?.version ?? "미등록"}</div>
            <div className="mt-1 text-xs text-white/56">
              마지막 수정: {formatDateTime(data.currentBylaw?.createdAt)}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>11기 운영진</CardTitle>
                <p className="text-sm text-text-muted">
                  직책별 운영진 정보를 카드 형태로 확인할 수 있습니다.
                </p>
              </div>
              {canEdit && (
                <Button
                  variant={isEditingRoles ? "outline" : "default"}
                  size="sm"
                  onClick={() => {
                    setRoleForm(createRoleForm(data.roles));
                    setIsEditingRoles((prev) => !prev);
                    setDraftError(null);
                  }}
                >
                  <PencilLine data-icon="inline-start" className="size-3.5" />
                  {isEditingRoles ? "편집 닫기" : "운영진 수정"}
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {roleCards.map((role) => (
                  <div
                    key={role.roleKey}
                    className="rounded-2xl border border-line-subtle bg-canvas/60 p-4"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar src={role.photoUrl} name={role.title} size="lg" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
                          {role.title}
                        </div>
                        <div className="mt-2 text-lg font-semibold text-text-strong">
                          {role.memberName || "공석"}
                        </div>
                        <p className="mt-2 text-xs text-text-muted">
                          마지막 반영: {formatDateTime(role.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {canEdit && isEditingRoles && roleFormReady && (
                <div className="space-y-4 rounded-2xl border border-dashed border-line-subtle bg-muted/30 p-4">
                  <div>
                    <p className="text-sm font-medium text-text-strong">운영진 카드 편집</p>
                    <p className="mt-1 text-xs text-text-muted">
                      이름을 비워두면 공석으로 표시됩니다. 사진은 선택 사항입니다.
                    </p>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {roles.map((role) => (
                      <div
                        key={role.roleKey}
                        className="rounded-2xl border border-line-subtle bg-surface p-4"
                      >
                        <div className="flex gap-4">
                          <AvatarUpload
                            src={roleFormReady[role.roleKey].photoUrl}
                            name={roleFormReady[role.roleKey].memberName || role.title}
                            isUploading={uploadingRoleKey === role.roleKey}
                            onUpload={(file) => handleRoleUpload(role.roleKey, file)}
                          />
                          <div className="min-w-0 flex-1 space-y-2">
                            <div>
                              <Label htmlFor={`role-${role.roleKey}`}>{role.title}</Label>
                              <Input
                                id={`role-${role.roleKey}`}
                                value={roleFormReady[role.roleKey].memberName}
                                placeholder={`${role.title} 이름`}
                                onChange={(e) =>
                                  setRoleForm((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          [role.roleKey]: {
                                            ...prev[role.roleKey],
                                            memberName: e.target.value,
                                          },
                                        }
                                      : prev,
                                  )
                                }
                              />
                            </div>
                            <div>
                              <Label htmlFor={`photo-${role.roleKey}`}>사진 URL</Label>
                              <Input
                                id={`photo-${role.roleKey}`}
                                value={roleFormReady[role.roleKey].photoUrl ?? ""}
                                placeholder="https://..."
                                onChange={(e) =>
                                  setRoleForm((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          [role.roleKey]: {
                                            ...prev[role.roleKey],
                                            photoUrl: e.target.value.trim() || null,
                                          },
                                        }
                                      : prev,
                                  )
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={handleSaveRoles} disabled={saveRoles.isPending}>
                      {saveRoles.isPending ? (
                        <Loader2 data-icon="inline-start" className="size-3.5 animate-spin" />
                      ) : (
                        <Save data-icon="inline-start" className="size-3.5" />
                      )}
                      저장
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setRoleForm(createRoleForm(data.roles));
                        setIsEditingRoles(false);
                        setDraftError(null);
                      }}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>활동 회칙</CardTitle>
              <p className="text-sm text-text-muted">
                현재 적용 중인 회칙을 확인하고, 개정 이력도 함께 볼 수 있습니다.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.currentBylaw ? (
                <>
                  <div className="rounded-2xl border border-line-subtle bg-canvas/60 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
                      <span className="rounded-full bg-brand/10 px-2.5 py-1 text-brand">
                        {data.currentBylaw.version}
                      </span>
                      <span>수정일 {formatDateTime(data.currentBylaw.createdAt)}</span>
                      {data.currentBylaw.createdByName && (
                        <span>작성자 {data.currentBylaw.createdByName}</span>
                      )}
                    </div>
                    <div className="mt-5 space-y-4 text-sm leading-7 text-text-main [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:whitespace-pre-wrap [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-line-subtle [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-line-subtle [&_th]:bg-muted/50 [&_th]:px-3 [&_th]:py-2">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {data.currentBylaw.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-line-subtle px-4 py-8 text-center text-sm text-text-muted">
                  아직 등록된 회칙이 없습니다.
                </div>
              )}

              {canEdit && (
                <div className="space-y-3 rounded-2xl border border-dashed border-line-subtle bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <UploadCloud className="size-4 text-text-muted" />
                    <p className="text-sm font-medium text-text-strong">새 회칙 버전 발행</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[220px_1fr]">
                    <div className="space-y-2">
                      <Label htmlFor="bylaw-version">버전명</Label>
                      <Input
                        id="bylaw-version"
                        value={version}
                        placeholder="예: v1.0 / 2026 봄 개정"
                        onChange={(e) => setVersion(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bylaw-content">회칙 본문</Label>
                      <Textarea
                        id="bylaw-content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[220px]"
                        placeholder="마크다운으로 회칙을 입력하세요."
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handlePublishBylaw}
                      disabled={publishBylaw.isPending || !version.trim() || !content.trim()}
                    >
                      {publishBylaw.isPending ? (
                        <Loader2 data-icon="inline-start" className="size-3.5 animate-spin" />
                      ) : (
                        <Save data-icon="inline-start" className="size-3.5" />
                      )}
                      새 버전 발행
                    </Button>
                    <span className="text-xs text-text-muted">
                      기존 버전은 유지되고, 최신 발행본이 현재 회칙으로 표시됩니다.
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card size="sm">
            <CardHeader>
              <CardTitle>회칙 이력</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {history.length === 0 && (
                <p className="text-sm text-text-muted">등록된 회칙 이력이 없습니다.</p>
              )}
              {history.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-line-subtle bg-canvas/60 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-text-strong">{item.version}</span>
                    {index === 0 && (
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-medium text-brand">
                        최신
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {formatDateTime(item.createdAt)}
                    {item.createdByName ? ` · ${item.createdByName}` : ""}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>안내</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-text-muted">
              <p>운영진 사진은 선택 사항이며, 비워두면 이니셜 아바타로 표시됩니다.</p>
              <p>운영진 이름을 비워두면 해당 직책은 공석으로 노출됩니다.</p>
              <p>회칙은 새 버전을 발행할 때마다 이력에 누적됩니다.</p>
              {draftError && <p className="text-error">{draftError}</p>}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function OrganizationSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-[220px] rounded-[28px]" />
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Skeleton className="h-[340px]" />
          <Skeleton className="h-[420px]" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-[280px]" />
          <Skeleton className="h-[160px]" />
        </div>
      </div>
    </div>
  );
}
