import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export function KitDownloadButton() {
  return <div className="download-control"><Button asChild size="lg" className="primary-cta"><a href="/downloads/people-analytics-dax-kit-free.zip" download>Descargar kit gratuito <ArrowDown aria-hidden="true" /></a></Button><span>Incluye medidas DAX, proyecto Power BI e importador para Windows.</span></div>;
}
