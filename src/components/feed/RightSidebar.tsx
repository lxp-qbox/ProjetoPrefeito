
"use client";

import { SearchWidget } from "./SearchWidget";
import { PremiumSignupWidget } from "./PremiumSignupWidget";
import { WhatsHappeningWidget } from "./WhatsHappeningWidget";
import { WhoToFollowWidget } from "./WhoToFollowWidget";
import { FooterLinksWidget } from "./FooterLinksWidget";

export default function RightSidebar() {
  return (
    <aside className="hidden lg:block w-[350px] pl-6 space-y-6 py-4">
      <SearchWidget />
      <PremiumSignupWidget />
      <WhatsHappeningWidget />
      <WhoToFollowWidget />
      <FooterLinksWidget />
    </aside>
  );
}
