// A brief can be sent through the agent again only while it has no finished quotation:
// no proposal yet (run failed early) or one stuck RECEIVED / ANALYZING (run failed midway).
const RETRYABLE = new Set(["RECEIVED", "ANALYZING"]);

export function canRetryProcessing(brief) {
  if (!brief) return false;
  return !brief.proposalStatus || RETRYABLE.has(brief.proposalStatus);
}
