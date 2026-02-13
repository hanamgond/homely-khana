import { MenuClient } from "@/modules/subscribe";

export const metadata = {
  title: "Weekly Menu | Homely Khana",
  description: "Check out this week's fresh, home-cooked menu.",
};

export default function MenuPage() {
  return <MenuClient />;
}