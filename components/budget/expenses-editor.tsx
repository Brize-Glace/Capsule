"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useApp } from "@/components/app/app-context";
import { Button } from "@/components/ui/button";
import type { Expense } from "@/lib/types";

/** Editable list of monthly expenses, with a row to add a new one. */
export function ExpensesEditor() {
  const { data, setData } = useApp();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const expenses = data.budget.expenses;
  const canAdd = name.trim() !== "" && Number(amount) > 0;

  const setExpenses = (update: (expenses: Expense[]) => Expense[]) =>
    setData((d) => ({ ...d, budget: { ...d.budget, expenses: update(d.budget.expenses) } }));

  function addExpense() {
    if (!canAdd) return;
    setExpenses((list) => [...list, { id: crypto.randomUUID(), name: name.trim(), amount: Number(amount) }]);
    setName("");
    setAmount("");
  }

  const editExpense = (id: string, patch: Partial<Expense>) =>
    setExpenses((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const removeExpense = (id: string) => setExpenses((list) => list.filter((e) => e.id !== id));

  const addOnEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addExpense();
  };

  return (
    <>
      {expenses.length ? (
        <ul className="rows">
          {expenses.map((expense) => (
            <li className="row expense-row" key={expense.id}>
              <input
                className="inline-input"
                aria-label={`Nom de la dépense ${expense.name}`}
                value={expense.name}
                onChange={(e) => editExpense(expense.id, { name: e.target.value })}
              />
              <span className="money-field compact">
                <input
                  aria-label={`Montant de ${expense.name}`}
                  type="number"
                  min="0"
                  value={expense.amount}
                  onChange={(e) => editExpense(expense.id, { amount: Number(e.target.value) })}
                />
                <b>€</b>
              </span>
              <button
                className="icon-button quiet"
                aria-label={`Supprimer ${expense.name}`}
                onClick={() => removeExpense(expense.id)}
              >
                <Trash2 />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hint">Aucune dépense pour l’instant.</p>
      )}

      <div className="row expense-row expense-add">
        <input
          className="inline-input"
          aria-label="Nom de la nouvelle dépense"
          placeholder="Nouvelle dépense, ex. Assurance"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={addOnEnter}
        />
        <span className="money-field compact">
          <input
            aria-label="Montant de la nouvelle dépense"
            type="number"
            min="0"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={addOnEnter}
          />
          <b>€</b>
        </span>
        <Button variant="outline" className="secondary-action" onClick={addExpense} disabled={!canAdd}>
          <Plus /> Ajouter
        </Button>
      </div>
    </>
  );
}
