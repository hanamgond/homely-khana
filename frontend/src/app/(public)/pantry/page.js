import { PantryClient } from "@/modules/pantry";

export const metadata = {
  title: "The Pantry | Homely Khana",
  description: "Order pickles, podis, and snacks.",
};

export default function PantryPage() {
  return <PantryClient />;
}