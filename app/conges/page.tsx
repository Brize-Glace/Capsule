import type { Metadata } from "next";
import { LeavesPage } from "@/components/leaves/leaves-page";

export const metadata: Metadata = { title: "Mes congés" };

export default function Page() {
  return <LeavesPage />;
}
