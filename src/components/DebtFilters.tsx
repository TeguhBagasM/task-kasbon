"use client";

import type {
  DebtStatusFilter,
  DebtTypeFilter,
  DebtFilters,
} from "@/types/debt";

const inputClass =
  "h-12 w-full rounded-lg border border-tinta/15 bg-white px-4 text-tinta outline-none placeholder:text-tinta/40 focus:border-pulpen disabled:opacity-60";

// Baris filter: 2 dropdown berdampingan + search penuh di bawahnya.
// <select> native agar keyboard/voiceover mobile jalan apa adanya.
export function DebtFilters({
  filters,
  onChange,
}: {
  filters: DebtFilters;
  onChange: (filters: DebtFilters) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="filter-status"
            value={filters.status}
            onChange={(event) =>
              onChange({
                ...filters,
                status: event.target.value as DebtStatusFilter,
              })
            }
            className={inputClass}
          >
            <option value="all">Semua</option>
            <option value="unsettled">Belum lunas</option>
            <option value="settled">Lunas</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-type" className="text-sm font-medium">
            Tipe
          </label>
          <select
            id="filter-type"
            value={filters.type}
            onChange={(event) =>
              onChange({
                ...filters,
                type: event.target.value as DebtTypeFilter,
              })
            }
            className={inputClass}
          >
            <option value="all">Semua</option>
            <option value="owed_to_me">Dihutang ke saya</option>
            <option value="i_owe">Saya hutang</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-search" className="text-sm font-medium">
          Cari nama
        </label>
        <input
          id="filter-search"
          type="search"
          autoComplete="off"
          placeholder="Ketik nama..."
          value={filters.search}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
          className={inputClass}
        />
      </div>
    </div>
  );
}
