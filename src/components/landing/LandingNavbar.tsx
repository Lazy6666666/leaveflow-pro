"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Overview", href: "#hero-section" },
  { name: "Philosophy", href: "#philosophy" },
];

/**
 * Redesigned LandingNavbar: "The Digital Concierge"
 * Aesthetic: Elevated, transparent, glassmorphism, no borders.
 */
export const LandingNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { track } = useAnalytics();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-[60] transition-all duration-700 ease-concierge px-6 md:px-12",
          scrolled ? "py-4" : "py-8"
        )}
      >
        <div
          className={cn(
            "mx-auto max-w-7xl flex items-center justify-between px-8 transition-all duration-700 rounded-[32px] border-0",
            scrolled
              ? "bg-white/70 backdrop-blur-2xl shadow-float py-3"
              : "bg-transparent py-4"
          )}
        >
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
               <Logo size="md" className="w-14 h-14 transition-transform duration-500 group-hover:scale-110" showText={false} />
            </Link>
          </div>

          {/* Center: Nav Items */}
          <nav className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors duration-300"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right: CTA */}
          <div className="flex items-center gap-6">
            <Link
              to="/auth"
              className="hidden sm:block text-sm font-bold text-foreground hover:text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/auth/register"
              onClick={() => {
                void track(
                  "landing_cta_clicked",
                  { cta_location: "navbar_primary", target_path: "/auth/register" },
                  { surface: "landing", path: "/" },
                );
              }}
              className="hidden md:flex items-center justify-center h-12 px-8 terracotta-gradient text-white text-sm font-bold rounded-2xl shadow-lg shadow-primary/10 transition-all hover:scale-105 active:scale-95"
            >
              Get Started
            </Link>

            {/* Mobile Toggle */}
            <button
              type="button"
              aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isOpen}
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-foreground hover:text-primary transition-colors"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-50 bg-background md:hidden flex flex-col pt-32 px-10"
          >
            <nav className="flex flex-col gap-10">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-4xl font-display font-bold text-foreground hover:text-primary transition-all"
                >
                  {link.name}
                </motion.a>
              ))}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="pt-10 flex flex-col gap-6"
              >
                <Link
                  to="/auth/register"
                  onClick={() => {
                    setIsOpen(false);
                    void track(
                      "landing_cta_clicked",
                      { cta_location: "navbar_mobile_primary", target_path: "/auth/register" },
                      { surface: "landing", path: "/" },
                    );
                  }}
                  className="flex items-center justify-center h-16 terracotta-gradient text-white font-bold rounded-3xl text-lg shadow-xl"
                >
                  Join the Balance Ecosystem
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
