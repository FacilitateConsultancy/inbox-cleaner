"use client";

import type { SenderGroup, SenderDecision, SenderAction } from "@/types";

interface Props {
  senders: SenderGroup[];
  totalEmails: number;
  decisions: SenderDecision;
  onDecide: (email: string, action: SenderAction) => void;
  onDecideAll: (action: "keep" | "remove") => void;
  onProceed: () => void;
  removeCount: number;
  removeEmailCount: number;
}

export function SenderList({
  senders,
  totalEmails,
  decisions,
  onDecide,
  onDecideAll,
  onProceed,
  removeCount,
  removeEmailCount,
}: Props) {
  const undecided = senders.filter(
    (s) => !decisions[s.email] || decisions[s.email] === "undecided"
  ).length;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Emails scanned" value={totalEmails} color="blue" />
        <Stat label="Unique senders" value={senders.length} color="purple" />
        <Stat label="Marked to remove" value={removeCount} color="red" />
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl px-5 py-3.5 mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {undecided > 0 ? (
            <>
              <span className="font-medium text-gray-800">{undecided}</span> sender{undecided !== 1 ? "s" : ""} undecided
            </>
          ) : (
            <span className="text-green-600 font-medium">All senders decided ✓</span>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <Btn
            onClick={() => onDecideAll("keep")}
            className="border border-green-300 text-green-700 hover:bg-green-50"
          >
            Keep all undecided
          </Btn>
          <Btn
            onClick={() => onDecideAll("remove")}
            className="border border-red-300 text-red-700 hover:bg-red-50"
          >
            Remove all undecided
          </Btn>
          <button
            onClick={onProceed}
            disabled={removeCount === 0}
            className="text-sm px-4 py-1.5 rounded-lg font-medium bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white transition-colors"
          >
            Delete {removeEmailCount > 0 ? `${removeEmailCount.toLocaleString()} emails` : "selected"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="hidden sm:grid sm:grid-cols-[1fr_80px_130px_160px] text-xs font-semibold uppercase tracking-wider text-gray-400 px-5 py-3 border-b border-gray-100">
          <span>Sender</span>
          <span className="text-right">Emails</span>
          <span className="text-right">Latest</span>
          <span className="text-right">Action</span>
        </div>
        <ul className="divide-y divide-gray-100">
          {senders.map((s) => (
            <SenderRow
              key={s.email}
              sender={s}
              action={decisions[s.email] ?? "undecided"}
              onDecide={onDecide}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

function SenderRow({
  sender,
  action,
  onDecide,
}: {
  sender: SenderGroup;
  action: SenderAction;
  onDecide: (email: string, action: SenderAction) => void;
}) {
  const date = new Date(sender.latestDate).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const rowBg =
    action === "remove"
      ? "bg-red-50"
      : action === "keep"
      ? "bg-green-50"
      : "hover:bg-gray-50";

  return (
    <li
      className={`grid sm:grid-cols-[1fr_80px_130px_160px] grid-cols-1 items-center px-5 py-3.5 transition-colors ${rowBg}`}
    >
      <div className="min-w-0">
        <p className="font-medium text-gray-900 truncate text-sm">{sender.name}</p>
        <p className="text-xs text-gray-400 truncate">{sender.email}</p>
      </div>
      <p className="hidden sm:block text-sm font-semibold text-gray-700 text-right">
        {sender.count.toLocaleString()}
      </p>
      <p className="hidden sm:block text-sm text-gray-400 text-right">{date}</p>
      <div className="flex gap-1.5 sm:justify-end mt-2 sm:mt-0">
        <ToggleBtn
          label="Keep"
          active={action === "keep"}
          activeClass="bg-green-100 text-green-700 border-green-300"
          inactiveClass="text-gray-400 border-gray-200 hover:border-green-300 hover:text-green-600"
          onClick={() => onDecide(sender.email, action === "keep" ? "undecided" : "keep")}
        />
        <ToggleBtn
          label="Remove"
          active={action === "remove"}
          activeClass="bg-red-100 text-red-700 border-red-300"
          inactiveClass="text-gray-400 border-gray-200 hover:border-red-300 hover:text-red-600"
          onClick={() => onDecide(sender.email, action === "remove" ? "undecided" : "remove")}
        />
      </div>
    </li>
  );
}

function Stat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "purple" | "red";
}) {
  const cls = {
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    red: "bg-red-50 text-red-700",
  }[color];
  return (
    <div className={`${cls} rounded-xl px-5 py-4`}>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
      <p className="text-xs mt-0.5 opacity-70">{label}</p>
    </div>
  );
}

function Btn({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${className ?? ""}`}
    >
      {children}
    </button>
  );
}

function ToggleBtn({
  label,
  active,
  activeClass,
  inactiveClass,
  onClick,
}: {
  label: string;
  active: boolean;
  activeClass: string;
  inactiveClass: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all ${
        active ? activeClass : inactiveClass
      }`}
    >
      {label}
    </button>
  );
}
