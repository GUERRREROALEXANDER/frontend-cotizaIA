import { useCallback, useEffect, useState } from "react";
import { viewById, viewBySlug } from "../navigation.js";

function viewFromHash() {
  const slug = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  return viewBySlug[slug]?.id || "dashboard";
}

// The current screen lives in the URL hash so refresh, back/forward and
// shared links land on the same view. No router dependency needed.
export function useHashView() {
  const [view, setView] = useState(viewFromHash);

  useEffect(() => {
    const onHashChange = () => setView(viewFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((id) => {
    const target = viewById[id];
    if (!target) return;
    if (window.location.hash !== `#/${target.slug}`) window.location.hash = `/${target.slug}`;
    setView(id);
  }, []);

  return [view, navigate];
}
