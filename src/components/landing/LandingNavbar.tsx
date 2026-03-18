"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import {
  IconMenu2 as Menu,
  IconX as X,
  IconChevronRight as ChevronRight,
} from "@tabler/icons-react";

export const navLinks = [
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
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-[900px] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          scrolled ? "top-4" : "top-8"
        }`}
      >
        <div
          className={`flex items-center justify-between p-2 pl-6 bg-white/70 backdrop-blur-3xl border border-black/[0.04] rounded-[2rem] shadow-[0_8px_32px_-12px_rgba(0,0,0,0.08)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            scrolled ? "py-1.5 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.12)]" : "py-2"
          }`}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 relative z-20">
            <span className="font-['Cormorant_Garamond'] text-xl font-medium tracking-[0.08em] uppercase text-[#1A1815]">
              Balance.
            </span>
          </div>

          {/* Desktop Links with Aceternity Underline */}
          <nav className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => (
              <motion.a
                key={link.name}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveItem(link.name);
                }}
                className={`relative px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${
                  activeItem === link.name ? "text-[#1A1815]" : "text-[#1A1815]/40 hover:text-[#1A1815]"
                }`}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="relative z-10">{link.name}</span>
                {activeItem === link.name && (
                   <motion.span
                   layoutId="nav-underline-premium"
                   className="absolute bottom-0 left-4 right-4 h-0.5 bg-[#C9A962] rounded-full"
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
              className="hidden md:flex group relative items-center justify-between gap-6 pl-6 pr-1.5 py-1.5 bg-[#1A1815] text-[#FDFBF7] rounded-[2rem] active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_4px_16px_-4px_rgba(26,24,21,0.4)]"
            >
              <span className="text-[10px] uppercase font-bold tracking-[0.2em]">Start Trial</span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center transition-all duration-500 group-hover:bg-[#C9A962] group-hover:scale-105">
                <ArrowUpRight strokeWidth={1} size={16} className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-[2px] group-hover:-translate-y-[2px]" />
              </div>
            </Link>

            <motion.button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden w-12 h-12 rounded-[2rem] bg-black/5 flex items-center justify-center relative active:scale-95 transition-all duration-500"
              aria-label="Toggle Menu"
              whileTap={{ scale: 0.92 }}
            >
              <div className="relative w-5 h-5 flex flex-col justify-center items-center">
                <span
                  className={`absolute h-[1px] w-5 bg-[#1A1815] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    isOpen ? "rotate-45" : "-translate-y-1.5"
                  }`}
                />
                <span
                  className={`absolute h-[1px] w-4 bg-[#1A1815] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    isOpen ? "opacity-0 scale-x-0" : "opacity-100 scale-x-100"
                  }`}
                />
                <span
                  className={`absolute h-[1px] w-5 bg-[#1A1815] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
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
            className="fixed inset-0 z-50 bg-[#FDFBF7]/90 md:hidden flex flex-col pt-32 px-8"
          >
            <nav className="flex flex-col gap-4">
              {navLinks.map((link, i) => (
                <motion.button
                  key={link.name}
                  onClick={() => {
                    setActiveItem(link.name);
                    setIsOpen(false);
                  }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.1 * i, ease: [0.32, 0.72, 0, 1] }}
                  className={`flex items-center justify-between group rounded-xl p-4 transition-all duration-500 ${
                    activeItem === link.name ? "bg-[#1A1815]/5 shadow-sm" : "hover:bg-[#1A1815]/5"
                  }`}
                >
                  <span className="font-['Cormorant_Garamond'] text-4xl text-[#1A1815]">
                    {link.name}
                  </span>
                  <ChevronRight
                    size={24}
                    className={`transition-all duration-500 ${
                      activeItem === link.name ? "text-[#C9A962] translate-x-1" : "text-[#1A1815]/20"
                    }`}
                  />
                </motion.button>
              ))}
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
                className="mt-8"
              >
                <Link
                  to="/auth/register"
                  onClick={() => setIsOpen(false)}
                  className="group relative flex items-center justify-between gap-8 pl-8 pr-2 py-3 bg-[#1A1815] text-[#FDFBF7] rounded-[2.5rem] active:scale-[0.98] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-[0_20px_40px_-12px_rgba(26,24,21,0.3)]"
                >
                  <span className="text-sm uppercase font-bold tracking-[0.2em]">Join Balance</span>
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center transition-all duration-500 group-hover:bg-[#C9A962] group-hover:scale-105">
                    <ArrowUpRight strokeWidth={1.5} size={20} className="transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-[2px] group-hover:-translate-y-[2px]" />
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
