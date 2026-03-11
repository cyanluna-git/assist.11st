"use client";

import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { ProfileDetail } from "@/types/profile";

interface DigitalCardProps {
  profile: ProfileDetail;
  baseUrl: string;
}

const DigitalCard = forwardRef<HTMLDivElement, DigitalCardProps>(
  ({ profile, baseUrl }, ref) => {
    const qrUrl = `${baseUrl}/profiles/${profile.id}`;

    return (
      <div
        ref={ref}
        className="relative flex h-52 w-96 overflow-hidden rounded-2xl bg-white shadow-lg"
        style={{ fontFamily: "system-ui, sans-serif" }}
      >
        {/* Left section */}
        <div className="flex flex-1 flex-col justify-between p-5">
          <div className="flex items-center gap-3">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name ?? ""}
                className="size-12 rounded-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="size-12 rounded-full bg-gray-100" />
            )}
            <div>
              <p className="text-base font-bold text-gray-900">
                {profile.name ?? "이름 없음"}
              </p>
              {profile.position && (
                <p className="text-xs text-gray-500">{profile.position}</p>
              )}
              {profile.company && (
                <p className="text-xs font-medium text-gray-700">
                  {profile.company}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            {profile.email && (
              <p className="text-[11px] text-gray-500">{profile.email}</p>
            )}
            {profile.phone && (
              <p className="text-[11px] text-gray-500">{profile.phone}</p>
            )}
            <div className="flex gap-2 pt-1">
              {profile.github && (
                <span className="text-[10px] text-gray-400">GitHub</span>
              )}
              {profile.linkedin && (
                <span className="text-[10px] text-gray-400">LinkedIn</span>
              )}
              {profile.portfolio && (
                <span className="text-[10px] text-gray-400">Portfolio</span>
              )}
            </div>
          </div>

          <p className="text-[10px] font-semibold tracking-widest text-brand">
            ASSIST 11기
          </p>
        </div>

        {/* Right section - QR */}
        <div className="flex w-32 flex-col items-center justify-center gap-2 bg-gray-50 p-4">
          <QRCodeSVG value={qrUrl} size={80} level="M" />
          <p className="text-center text-[9px] leading-tight text-gray-400">
            스캔하여
            <br />
            프로필 보기
          </p>
        </div>
      </div>
    );
  }
);

DigitalCard.displayName = "DigitalCard";

export { DigitalCard };
