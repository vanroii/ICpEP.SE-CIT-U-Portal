import Link from "next/link";
import { Badge } from "./ui/Badge";
import { Calendar, MapPin, Users, ArrowRight } from "lucide-react";

export interface ContentCardProps {
  title: string;
  meta?: string;
  date?: string;
  venue?: string;
  category?: string;
  isMembersOnly?: boolean;
  participantCount?: number;
  capacity?: number | null;
  href: string;
  cta?: string;
  type?: "event" | "post";
}

export function ContentCard({
  title,
  meta,
  date,
  venue,
  category,
  isMembersOnly,
  participantCount,
  capacity,
  href,
  cta = "View Details",
  type = "event",
}: ContentCardProps) {
  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-[#e0dedb] bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      {/* Visual Header / Banner */}
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-[#1ca7e0] via-[#0a7db0] to-[#1b1613] p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          {category && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/90 text-[#0a7db0] backdrop-blur-xs">
              {category}
            </span>
          )}
          {isMembersOnly && (
            <Badge tone="warning" className="bg-[#fcf0d4]/95 font-semibold">
              Members Only
            </Badge>
          )}
        </div>

        {/* Gear / Circuit pattern background accent */}
        <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full border-4 border-white/10 opacity-30 pointer-events-none group-hover:scale-110 transition-transform duration-500" />
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <h3 className="text-base font-bold text-[#1b1613] line-clamp-2 leading-snug group-hover:text-[#0a7db0] transition-colors">
            {title}
          </h3>

          <div className="space-y-1.5 text-xs text-[#8c8785]">
            {date && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0a7db0] shrink-0" />
                <span>{date}</span>
              </div>
            )}
            {venue && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#0a7db0] shrink-0" />
                <span className="truncate">{venue}</span>
              </div>
            )}
            {meta && !date && !venue && <p>{meta}</p>}
            {typeof participantCount === "number" && (
              <div className="flex items-center gap-1.5 pt-1">
                <Users className="w-3.5 h-3.5 text-[#8c8785] shrink-0" />
                <span>
                  {participantCount} {capacity ? `/ ${capacity}` : ""} registered
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-[#f0eeeb]">
          <Link
            href={href}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1ca7e0] px-4 py-2 text-xs font-semibold text-[#1b1613] hover:bg-[#1898cc] active:bg-[#1483b0] transition-colors shadow-xs"
          >
            {cta}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
