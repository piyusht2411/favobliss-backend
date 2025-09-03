import { auth } from "@/auth";
import { StoreSwitcher } from "@/components/store-switcher";
import { SideNav } from "@/components/side-nav";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { SmDevicesSidebar } from "@/components/sm-devices-sidebar";
import { ProfileDropdown } from "@/components/auth/utils/profile-dropdown";

export const Navbar = async () => {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const stores = await db.store.findMany({
    where: {
      userId: session.user.id,
    },
  });

  return (
    <>
      {/* Top Header - Only for mobile menu and profile */}
      <header className="md:hidden fixed top-0 left-0 right-0 border-b bg-white dark:bg-gray-900 z-50">
        <div className="flex h-16 items-center px-4">
          <div className="mr-3">
            <SmDevicesSidebar />
          </div>
          <StoreSwitcher items={stores} className="flex-1" />
          <div className="ml-auto">
            <ProfileDropdown
              name={session.user.name || ""}
              email={session.user.email || ""}
              avatar={session.user.image || ""}
            />
          </div>
        </div>
      </header>

      {/* Left Sidebar - Desktop */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex-col z-40 shadow-sm">
        {/* Sidebar Header */}
        <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700 min-h-[4rem]">
          <StoreSwitcher items={stores} />
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2">
          <SideNav />
        </div>

        {/* Profile Section at Bottom */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
          <ProfileDropdown
            name={session.user.name || ""}
            email={session.user.email || ""}
            avatar={session.user.image || ""}
          />
        </div>
      </aside>
    </>
  );
};
