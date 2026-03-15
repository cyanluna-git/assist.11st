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
import { InstallPrompt } from "@/components/pwa/install-prompt";

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
      name: users.name,
      company: users.company,
      position: users.position,
      bio: users.bio,
      avatarUrl: users.avatarUrl,
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
            <Header
              user={{
                id: session.sub,
                name: profile?.name ?? session.name,
                email: session.email,
                role: session.role,
                avatarUrl: profile?.avatarUrl ?? null,
              }}
            />
            <main className="flex-1 px-4 py-4.5 pb-20 sm:px-6 sm:py-7 md:pb-7 lg:px-10 lg:py-8.5">
              {children}
            </main>
            <MobileNav />
            <InstallPrompt />
          </MainContent>
        </div>
      </SidebarProvider>
    </QueryProvider>
  );
}
