import type { Metadata } from "next";
import { BudgetPage } from "@/components/budget/budget-page";

export const metadata: Metadata = { title: "Mon budget" };

export default function Page() {
  return <BudgetPage />;
}
