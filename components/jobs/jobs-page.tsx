"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useApp } from "@/components/app/app-context";
import { PageHead } from "@/components/shared/page-head";
import { Button } from "@/components/ui/button";
import type { Job } from "@/lib/types";
import { AddJobDialog } from "./add-job-dialog";
import { DeleteJobDialog } from "./delete-job-dialog";
import { EditJobDialog } from "./edit-job-dialog";
import { JobCard } from "./job-card";
import { JobDetailsDialog } from "./job-details-dialog";

export function JobsPage() {
  const { data, setData, flash } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const findJob = (id: string | null) => data.jobs.find((job) => job.id === id);
  const detailJob = findJob(detailId);
  const editJob = findJob(editId);
  const deleteJob = findJob(deleteId);

  function addJob(job: Job) {
    setData((d) => ({ ...d, jobs: [...d.jobs, job] }));
    setAddOpen(false);
    flash("Emploi ajouté");
  }

  function updateJob(updated: Job) {
    setData((d) => ({ ...d, jobs: d.jobs.map((job) => (job.id === updated.id ? updated : job)) }));
    setEditId(null);
  }

  // Leaves of a deleted job are deleted with it, so no leave points to a missing job.
  function removeJob(id: string) {
    if (data.jobs.length === 1) return;
    setData((d) => ({ ...d, jobs: d.jobs.filter((j) => j.id !== id), leaves: d.leaves.filter((l) => l.jobId !== id) }));
    setDeleteId(null);
  }

  return (
    <div className="page">
      <PageHead title="Mes emplois">
        <Button className="primary-action" onClick={() => setAddOpen(true)}>
          <Plus /> Ajouter un emploi
        </Button>
      </PageHead>

      <div className="jobs">
        {data.jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            leaveCount={data.leaves.filter((l) => l.jobId === job.id).length}
            canDelete={data.jobs.length > 1}
            onShowDetails={() => setDetailId(job.id)}
            onEdit={() => setEditId(job.id)}
            onDelete={() => setDeleteId(job.id)}
          />
        ))}
      </div>

      <aside className="legal">
        <h2>À propos du 31 mai</h2>
        <p>
          La perte des congés N−1 n’est pas automatique dans tous les cas : convention collective, accord d’entreprise,
          report autorisé ou arrêt maladie peuvent changer la règle. Capsule vous alerte, mais votre bulletin de paie et
          votre service RH restent la référence.
        </p>
      </aside>

      <AddJobDialog open={addOpen} setOpen={setAddOpen} colorIndex={data.jobs.length} onSave={addJob} />
      {detailJob && (
        <JobDetailsDialog
          job={detailJob}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            setDetailId(null);
            setEditId(detailJob.id);
          }}
        />
      )}
      {editJob && <EditJobDialog key={editJob.id} job={editJob} onClose={() => setEditId(null)} onSave={updateJob} />}
      {deleteJob && (
        <DeleteJobDialog
          job={deleteJob}
          leaves={data.leaves.filter((l) => l.jobId === deleteJob.id)}
          onClose={() => setDeleteId(null)}
          onDelete={() => removeJob(deleteJob.id)}
        />
      )}
    </div>
  );
}
