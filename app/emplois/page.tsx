import type { Metadata } from "next";
import { JobsPage } from "@/components/jobs/jobs-page";

export const metadata: Metadata = { title: "Mes emplois" };

export default function Page() {
  return <JobsPage />;
}
