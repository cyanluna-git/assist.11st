import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const COHORT_LABEL = "aSSiST AI전략경영 11기";

function cleanPhone(phone: string | null): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("010")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  return phone.trim();
}

function escapeVcard(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

// vCard line folding: max 75 chars per line, fold with CRLF + space
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [];
  chunks.push(line.slice(0, 75));
  let i = 75;
  while (i < line.length) {
    chunks.push(" " + line.slice(i, i + 74));
    i += 74;
  }
  return chunks.join("\r\n");
}

async function fetchPhotoBase64(
  url: string,
): Promise<{ data: string; type: string } | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const type = contentType.split(";")[0].split("/")[1]?.toUpperCase() || "JPEG";
    const buffer = await res.arrayBuffer();
    const data = Buffer.from(buffer).toString("base64");
    return { data, type };
  } catch {
    return null;
  }
}

async function toVcard(user: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  position: string | null;
  avatarUrl: string | null;
}): Promise<string> {
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];

  // UID allows contact apps to update existing contact instead of duplicating
  lines.push(`UID:assist11th-${user.id}`);
  lines.push(`FN:${escapeVcard(user.name)}`);
  lines.push(`N:${escapeVcard(user.name)};;;;`);

  if (user.company?.trim()) {
    lines.push(`ORG:${escapeVcard(user.company.trim())}`);
  }
  if (user.position?.trim()) {
    lines.push(`TITLE:${escapeVcard(user.position.trim())}`);
  }

  const phone = cleanPhone(user.phone);
  if (phone) {
    lines.push(`TEL;TYPE=CELL:${phone}`);
  }

  if (user.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${user.email}`);
  }

  // Embed photo as base64 if available
  if (user.avatarUrl?.startsWith("https://")) {
    const photo = await fetchPhotoBase64(user.avatarUrl);
    if (photo) {
      lines.push(foldLine(`PHOTO;ENCODING=b;TYPE=${photo.type}:${photo.data}`));
    }
  }

  lines.push(`NOTE:${COHORT_LABEL}`);
  lines.push(`CATEGORIES:${COHORT_LABEL}`);
  lines.push("END:VCARD");

  return lines.map(foldLine).join("\r\n");
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const members = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      company: users.company,
      position: users.position,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .orderBy(asc(users.name));

  // Fetch photos in parallel — allSettled so one failure doesn't break the whole export
  const results = await Promise.allSettled(members.map(toVcard));
  const vcards = results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
    .map((r) => r.value);
  const vcfContent = vcards.join("\r\n") + "\r\n";

  return new NextResponse(vcfContent, {
    status: 200,
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="assist11th-contacts.vcf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
