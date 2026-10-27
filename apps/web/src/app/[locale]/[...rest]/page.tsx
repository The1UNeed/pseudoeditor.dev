import { notFound } from "next/navigation";

/** Unmatched paths under a locale render the localized not-found page inside the [locale] layout. */
export default function CatchAllPage() {
  notFound();
}
