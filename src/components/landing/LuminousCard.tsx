import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";

interface LuminousCardProps {
  plan: {
    name: string;
    price: string;
    description: string;
    features: string[];
    highlight: boolean;
  };
  index: number;
}

export const LuminousCard = ({ plan, index }: LuminousCardProps) => {
  const { track } = useAnalytics();

  return (
    <motion.div
      className={`relative w-[280px] rounded-2xl p-6 ${
        plan.highlight
          ? "bg-[#0B0B0B] text-white"
          : "bg-white text-[#2D2A26] border border-black/10"
      }`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -4 }}
    >
      {/* Logo/Icon Area */}
      <div className="mb-6 flex justify-center">
        <div className={`h-16 w-16 rounded-2xl flex items-center justify-center ${
          plan.highlight
            ? "bg-gradient-to-br from-teal-400 to-cyan-500"
            : "bg-gradient-to-br from-teal-100 to-cyan-100"
        }`}>
          <div className={`text-2xl font-bold ${
            plan.highlight ? "text-white" : "text-teal-600"
          }`}>
            {"<"}
          </div>
        </div>
      </div>

      {/* Plan Details */}
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-[0.28em] ${
          plan.highlight ? "text-white/70" : "text-white/60"
        }`}>
          {plan.name}
        </p>
        <p className="mt-3 font-['DM_Sans'] text-4xl font-black tracking-tight">
          {plan.price}
        </p>
        {plan.price !== "Tailored" && (
          <p className={`text-xs ${plan.highlight ? "text-white/60" : "text-white/60"}`}>
            per month
          </p>
        )}
      </div>

      <p className={`mt-4 text-sm leading-relaxed ${
        plan.highlight ? "text-white/80" : "text-white/70"
      }`}>
        {plan.description}
      </p>

      {/* Features */}
      <ul className="mt-6 space-y-3">
        {plan.features.slice(0, 4).map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-sm">
            <Check className={`w-4 h-4 shrink-0 mt-0.5 ${
              plan.highlight ? "text-teal-400" : "text-teal-600"
            }`} strokeWidth={3} />
            <span className={plan.highlight ? "text-white/90" : ""}>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link
        to="/auth?signup=true"
        onClick={() => void track("landing_cta_clicked", {
          cta_location: `pricing_${plan.name.toLowerCase()}`,
          target_path: "/auth?signup=true",
          plan_name: plan.name,
        }, { surface: "landing", path: "/" })}
        className={`mt-6 flex w-full items-center justify-center rounded-full py-3 text-sm font-extrabold uppercase tracking-widest transition ${
          plan.highlight
            ? "bg-white text-black hover:bg-[#F0F0F0]"
            : "bg-[#2D2A26] text-white hover:bg-[#1A1A1A]"
        }`}
      >
        Choose {plan.name}
      </Link>
    </motion.div>
  );
};
