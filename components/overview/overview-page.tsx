"use client";

import Link from "next/link";
import { useApp } from "@/components/app/app-context";
import { NewLeaveButton } from "@/components/shared/new-leave-button";
import { PageHead } from "@/components/shared/page-head";
import { capitalize, formatFr, today } from "@/lib/format";
import { buildLedger } from "@/lib/ledger";
import { CountersTable } from "./counters-table";
import { MoneySummary } from "./money-summary";
import { NextBreak } from "./next-break";

export function OverviewPage() {
  const { data } = useApp();
  const ledgers = data.jobs.map((job) => buildLedger(job, data.leaves));

  return (
    <div className="page">
      <PageHead context={capitalize(formatFr(today(), "EEEE d MMMM"))} title="Bonjour Romain">
        <NewLeaveButton />
      </PageHead>

      <section className="sheet overview-leave" aria-labelledby="counters-title">
        <NextBreak />
        <div className="counters">
          <div className="block-head">
            <h2 id="counters-title">Compteurs de congés</h2>
            <Link className="link-button" href="/emplois">
              Gérer les emplois
            </Link>
          </div>
          <CountersTable ledgers={ledgers} leaves={data.leaves} />
        </div>
      </section>

      <MoneySummary />
    </div>
  );
}
