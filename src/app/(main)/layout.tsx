import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { QueryProvider } from "@/components/providers/query-provider";
import { SidebarProvider } from "@/components/providers/sidebar-provider";
import { MainContent } from "@/components/layout/main-content";

export const dynamic = "force-dynamic";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const profile = await db
    .select({
      company: users.company,
      position: users.position,
      bio: users.bio,
    })
    .from(users)
    .where(eq(users.id, session.sub))
    .then((rows) => rows[0] ?? null);

  if (!profile?.company || !profile?.position || !profile?.bio) {
    redirect("/onboarding");
  }

  return (
    <QueryProvider>
      <SidebarProvider>
        <div className="flex min-h-dvh bg-canvas">
          <Sidebar />
          <MainContent>
            <Header user={{ id: session.sub, name: session.name, email: session.email, role: session.role }} />
            <main className="flex-1 px-4 py-4.5 sm:px-6 sm:py-7 lg:px-10 lg:py-8.5">
              {children}
            </main>
            <MobileNav />
          </MainContent>
        </div>
      </SidebarProvider>
    </QueryProvider>
  );
}
