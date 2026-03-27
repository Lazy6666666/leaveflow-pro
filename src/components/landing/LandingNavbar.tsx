"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";
import {
  IconMenu2 as Menu,
  IconX as X,
  IconChevronRight as ChevronRight,
} from "@tabler/icons-react";

const navLinks = [
  { name: "Product", href: "#product" },
  { name: "Engine", href: "#engine" },
  { name: "Global", href: "#global" },
  { name: "Company", href: "#company" },
];

const tapProps = {
  whileTap: { scale: 0.98 },
  transition: {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
    mass: 0.6,
  },
};

export const LandingNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(navLinks[0].name);
  const [scrolled, setScrolled] = useState(false);
  const { track } = useAnalytics();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      <header
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-[900px] transition-all duration-700 ease-premium ${
          scrolled ? "top-4" : "top-8"
        }`}
      >
        <div
          className={`flex items-center justify-between p-2 pl-6 bg-white/80 backdrop-blur-3xl border border-black/5 rounded-[2rem] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)] transition-all duration-700 ease-premium ${
            scrolled ? "py-1.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]" : "py-2"
          }`}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 relative z-20">
            <span className="font-['Cormorant_Garamond'] text-xl font-medium tracking-[0.08em] uppercase text-[#191c1d]">
              Leaveflow.
            </span>
          </div>

          {/* Desktop Links with Aceternity Underline */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => (
              <motion.a
                key={link.name}
                href={link.href}
                onClick={() => {
                  setActiveItem(link.name);
                }}
                className={`relative px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${
                  activeItem === link.name ? "text-[#191c1d]" : "text-[#191c1d]/40 hover:text-[#191c1d]"
                }`}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="relative z-10">{link.name}</span>
                {activeItem === link.name && (
                   <motion.span
                   layoutId="nav-underline-premium"
                   className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#af642d] rounded-full"
                   transition={{ type: "spring", stiffness: 380, damping: 30 }}
                 />
                )}
              </motion.a>
            ))}
          </nav>

          {/* Right Side: CTA + Hamburger */}
          <div className="flex items-center gap-2 relative z-20">
            <Link
              to="/auth/register"
              onClick={() => {
                void track(
                  "landing_cta_clicked",
                  { cta_location: "navbar_primary", target_path: "/auth/register" },
                  { surface: "landing", path: "/" },
                );
              }}
              className="hidden md:flex group relative items-center justify-between gap-6 pl-6 pr-1.5 py-1.5 bg-[#191c1d] text-white rounded-[2rem] active:scale-[0.98] transition-all duration-500 ease-premium shadow-[0_4px_16px_-4px_rgba(25,28,29,0.3)]"
            >
              <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Start Trial</span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-all duration-500 group-hover:bg-[#af642d] group-hover:scale-105">
                <ArrowUpRight strokeWidth={1} size={16} className="text-white transition-transform duration-500 ease-premium group-hover:translate-x-[2px] group-hover:-translate-y-[2px]" />
              </div>
            </Link>

            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden w-12 h-12 rounded-[2rem] bg-black/5 border border-black/10 flex items-center justify-center relative active:scale-95 transition-all duration-500"
              aria-label="Toggle Menu"
              aria-expanded={isOpen}
              whileTap={{ scale: 0.92 }}
            >
              <div aria-hidden="true" className="relative w-5 h-5 flex flex-col justify-center items-center">
                <span
                  className={`absolute h-[1px] w-5 bg-[#191c1d] transition-all duration-700 ease-premium ${
                    isOpen ? "rotate-45" : "-translate-y-1.5"
                  }`}
                />
                <span
                  className={`absolute h-[1px] w-4 bg-[#191c1d] transition-all duration-500 ease-premium ${
                    isOpen ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
                  }`}
                />
                <span
                  className={`absolute h-[1px] w-5 bg-[#191c1d] transition-all duration-700 ease-premium ${
                    isOpen ? "-rotate-45" : "translate-y-1.5"
                  }`}
                />
              </div>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Expanded Mobile Modal (Aceternity Style) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, y: 0, backdropFilter: "blur(24px)" }}
            exit={{ opacity: 0, y: -20, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-50 bg-white/95 md:hidden flex flex-col pt-32 px-8"
          >
            <nav aria-label="Mobile Navigation" className="flex flex-col gap-4">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  onClick={() => {
                    setActiveItem(link.name);
                    setIsOpen(false);
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 * i, ease: [0.32, 0.72, 0, 1] }}
                  className={`flex items-center justify-between group rounded-xl p-4 transition-all duration-500 ${
                    activeItem === link.name ? "bg-black/5 shadow-sm" : "hover:bg-black/5"
                  }`}
                >
                  <span className="font-['Cormorant_Garamond'] text-4xl text-[#191c1d]">
                    {link.name}
                  </span>
                  <ChevronRight
                    size={24}
                    className={`transition-all duration-500 ${
                      activeItem === link.name ? "text-[#af642d] translate-x-1" : "text-[#191c1d]/20"
                    }`}
                  />
                </motion.a>
              ))}
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="mt-8"
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
                  className="group relative flex items-center justify-between gap-8 pl-8 pr-2 py-3 bg-[#191c1d] text-white rounded-[2.5rem] active:scale-[0.98] transition-all duration-500 ease-premium shadow-[0_20px_40px_-12px_rgba(25,28,29,0.3)]"
                >
                  <span className="text-sm uppercase font-bold tracking-[0.2em]">Join Leaveflow</span>
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center transition-all duration-500 group-hover:bg-[#af642d] group-hover:scale-105" aria-hidden="true">
                    <ArrowUpRight strokeWidth={1.5} size={20} className="text-white transition-transform duration-500 ease-premium group-hover:translate-x-[2px] group-hover:-translate-y-[2px]" />
                  </div>
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
