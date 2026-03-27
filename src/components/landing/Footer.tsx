import { motion } from "framer-motion";
import { Instagram, Facebook, Twitter, Linkedin, Github } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const links = {
  Product: [
    { href: "#platform", label: "Platform" },
    { href: "#capabilities", label: "Capability tour" },
    { href: "#pricing", label: "Pricing" },
  ],
  Company: [
    { href: "#hero", label: "About BALANCE" },
    { href: "#final-cta", label: "Contact" },
    { href: "/auth", label: "Sign in" },
  ],
  Resources: [
    { href: "#", label: "Documentation" },
    { href: "#", label: "API Reference" },
    { href: "#", label: "Help Center" },
  ],
};

const socialLinks = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
];

export const Footer = () => {
  return (
    <footer className="px-6 border-t border-white/5 lg:px-10 pb-12 pt-16 bg-[#09090b]">
      <div className="mx-auto max-w-[1440px]">
        <div className="border-y border-white/10 py-12 md:py-16">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
            {/* Brand Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="flex flex-col gap-4 group cursor-pointer"
                whileHover={{ scale: 1.02 }}
              >
                <Logo size="md" showText={true} />
                <p className="text-[10px] uppercase tracking-[0.32em] text-white/60">leave and attendance infrastructure</p>
              </motion.div>
              <p className="mt-6 max-w-md text-sm font-medium text-white/70 leading-relaxed">
                A more elegant landing surface for a product that needs to communicate trust, operational clarity, and calm control from the first scroll.
              </p>

              {/* Social Links */}
              <nav aria-label="Social Media Links" className="mt-8 flex items-center gap-3">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 text-white/70 transition hover:bg-[#e879f9] hover:text-black hover:ring-[#e879f9]"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <social.icon className="h-5 w-5" strokeWidth={2} />
                  </motion.a>
                ))}
              </nav>
            </motion.div>

            {/* Links Grid */}
            <motion.nav
              aria-label="Footer Navigation"
              className="grid gap-8 sm:grid-cols-3"
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {Object.entries(links).map(([heading, group]) => (
                <div key={heading}>
                  <motion.p
                    className="text-[10px] font-bold uppercase tracking-[0.32em] text-white/60 mb-5"
                    whileHover={{ x: 4, color: "#e879f9" }}
                  >
                    {heading}
                  </motion.p>
                  <ul className="space-y-3">
                    {group.map((link) => (
                      <li key={link.label}>
                        <motion.a
                          href={link.href}
                          className="block text-sm font-medium text-white/60 transition hover:text-white relative group"
                          whileHover={{ x: 4 }}
                        >
                          {link.label}
                          <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0.5 bg-[#e879f9] group-hover:w-2 transition-all duration-300" />
                        </motion.a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </motion.nav>
          </div>

          {/* Bottom Bar */}
          <motion.div
            className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-[10px] font-bold uppercase tracking-[0.28em] text-white/60 md:flex-row md:items-center md:justify-between"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <span>Copyright 2026 Leaveflow Pro</span>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
            <span className="hidden lg:inline">Deterministic Global Operations</span>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};
