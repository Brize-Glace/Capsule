import type { Job } from "@/lib/types";

/** Job name preceded by its color dot. */
export function JobTag({ job }: { job?: Job }) {
  return (
    <span className="job-tag">
      <i style={{ background: job?.color }} />
      {job?.name ?? "Emploi supprimé"}
    </span>
  );
}
