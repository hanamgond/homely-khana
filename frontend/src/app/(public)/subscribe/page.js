import { SubscribeClient } from "@/modules/subscribe";

export const metadata = {
  title: "Subscribe | Homely Khana",
  description: "Choose a meal plan that fits your schedule.",
};

export default function SubscribePage({ searchParams }) {
  // We pass searchParams so you can handle URLs like /subscribe?plan=trial
  return <SubscribeClient searchParams={searchParams} />;
}