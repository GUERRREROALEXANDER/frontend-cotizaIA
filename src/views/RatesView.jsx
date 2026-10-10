import { Construction } from "lucide-react";
import { EmptyState, Panel } from "../components/ui.jsx";

// STUB: replaced in the features stage.
export default function RatesView() {
  return (
    <Panel>
      <EmptyState icon={Construction} title="En construcción" description="Esta sección llega en la siguiente etapa." />
    </Panel>
  );
}
