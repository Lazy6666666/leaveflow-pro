"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface NavItem {
  name: string;
  href: string;
}

export const NavbarUnderline = ({ items, activeItem, onSelect }: { 
  items: NavItem[]; 
  activeItem: string;
  onSelect: (name: string) => void;
}) => {
  return (
    <nav className="flex items-center justify-center gap-4 sm:gap-8" aria-label="Main Navigation">
      {items.map((item) => (
        <Link
          key={item.name}
          to={item.href}
          onClick={() => onSelect(item.name)}
          aria-current={activeItem === item.name ? "page" : undefined}
          className={cn(
            "relative px-1 py-2 text-sm font-medium transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded-sm",
            activeItem === item.name ? "text-[#171411]" : "text-[#686055] hover:text-[#171411]"
          )}
        >
          <span className="relative z-10">{item.name}</span>
          
          {activeItem === item.name && (
            <motion.div
              layoutId="nav-underline"
              transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
              className="absolute inset-x-0 -bottom-1 h-[2px] bg-teal-500"
            />
          )}
        </Link>
      ))}
    </nav>
  );
};
