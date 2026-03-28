import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Logo } from "@/components/ui/Logo";

const links = [
  { href: "#platform", label: "Platform" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#pricing", label: "Pricing" },
  { href: "#final-cta", label: "Contact" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { track } = useAnalytics();

  return (
    <header className="sticky top-0 z-50 px-6 pt-4 lg:px-10">
      <nav
        className="flex items-center justify-between rounded-full px-6 py-3"
        aria-label="Main navigation"
      >
        <Link to="/" className="flex items-center gap-3">
          <Logo size="md" showText={false} className="w-12 h-12" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-[#686055] transition hover:text-[#171411]"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/auth"
            onClick={() => void track("landing_cta_clicked", {
              cta_location: "navbar_sign_in",
              target_path: "/auth",
            }, { surface: "landing", path: "/" })}
            className="text-sm font-medium text-[#686055] transition hover:text-[#171411]"
          >
            Sign in
          </Link>
          <Link
            to="/auth?signup=true"
            onClick={() => void track("landing_cta_clicked", {
              cta_location: "navbar_book_walkthrough",
              target_path: "/auth?signup=true",
            }, { surface: "landing", path: "/" })}
            className="rounded-full bg-[#171411] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2b2621]"
          >
            Book a walkthrough
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full md:hidden"
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="mx-auto mt-3 max-w-7xl rounded-2xl border border-black/10 bg-white p-5 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-[#181512]"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/auth?signup=true"
              onClick={() => {
                setOpen(false);
                void track("landing_cta_clicked", {
                  cta_location: "navbar_mobile_book_walkthrough",
                  target_path: "/auth?signup=true",
                }, { surface: "landing", path: "/" });
              }}
              className="rounded-xl bg-[#181512] px-4 py-3 text-center text-sm font-semibold text-white"
            >
              Book a walkthrough
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
