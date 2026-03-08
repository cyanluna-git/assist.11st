import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

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

  return (
    <div className="flex min-h-dvh bg-canvas">
      <Sidebar />
      <div className="flex flex-1 flex-col md:pl-[72px] lg:pl-[272px]">
        <Header user={{ name: session.name, email: session.email, role: session.role }} />
        <main className="flex-1 px-4 py-4.5 sm:px-6 sm:py-7 lg:px-10 lg:py-8.5">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
