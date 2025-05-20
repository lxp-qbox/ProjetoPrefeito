"use client";

// This will be the default page for the /admin route
import AdminHostsPageContent from "./hosts/page-content";

export default function AdminRootPage() {
  // By default, the /admin route will show the host management page
  return <AdminHostsPageContent />;
}
