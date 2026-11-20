// Kanban columns of the proposals board. Each backend status belongs to exactly
// one column; ProposalKanban.jsx re-exports these for existing imports.
export const STATUS_GROUPS = [
  {
    id: "nuevas",
    tone: "new",
    label: "Nuevas",
    statuses: ["RECEIVED", "ANALYZING", "QUOTED"],
  },
  {
    id: "por-revisar",
    tone: "review",
    label: "Por revisar",
    statuses: ["IN_REVIEW"],
  },
  {
    id: "enviadas",
    tone: "sent",
    label: "Enviadas",
    statuses: ["SENT", "NEGOTIATING"],
  },
  {
    id: "ganadas",
    tone: "won",
    label: "Ganadas",
    statuses: ["ACCEPTED", "CONTRACT_ISSUED"],
  },
  {
    id: "cerradas",
    tone: "closed",
    label: "Cerradas",
    statuses: ["REJECTED", "EXPIRED"],
  },
];

const groupStatuses = (id) => STATUS_GROUPS.find((group) => group.id === id)?.statuses || [];

// The four headline numbers shown above the board come from the same grouping
// the columns use, so a proposal is never counted twice or in two places.
export function summarizeProposals(proposals = []) {
  const count = (id) => proposals.filter((proposal) => groupStatuses(id).includes(proposal.status)).length;
  const inPlayStatuses = STATUS_GROUPS.filter((group) => group.id !== "cerradas").flatMap((group) => group.statuses);
  return {
    inPlay: proposals
      .filter((proposal) => inPlayStatuses.includes(proposal.status))
      .reduce((sum, proposal) => sum + Number(proposal.total || 0), 0),
    review: count("por-revisar"),
    sent: count("enviadas"),
    won: count("ganadas"),
    closed: count("cerradas"),
  };
}
