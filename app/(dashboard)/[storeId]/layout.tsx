import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";

interface DashboardLayoutPageProps {
  children: React.ReactNode;
  params: { storeId: string };
}

const DashboardLayoutPage = async ({
  children,
  params,
}: DashboardLayoutPageProps) => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!session || !userId) {
    redirect("/login");
  }

  const store = await db.store.findFirst({
    where: {
      id: params.storeId,
      userId,
    },
  });

  if (!store) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      {/* Main content with proper spacing for sidebar */}
      <div className="md:pl-64 pt-16 md:pt-0">
        <main className="p-6 pt-0">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayoutPage;
