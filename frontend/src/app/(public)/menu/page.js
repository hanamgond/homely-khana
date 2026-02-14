//frontend/src/app/(public)/menu/page.js

import { MenuClient } from "@/modules/subscribe";
import api from '@/shared/lib/api';

export const metadata = {
  title: "Weekly Menu | Homely Khana",
  description: "Check out this week's fresh, home-cooked menu.",
};

export default function MenuPage() {
  return <MenuClient />;
}