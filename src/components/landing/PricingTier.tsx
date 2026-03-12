import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Check } from 'lucide-react';

const plans = [
    {
        name: "Starter",
        price: "19",
        description: "Ideal for small teams moving away from legacy spreadsheets.",
        features: ["Up to 20 Employees", "Geolocation Basics", "Standard Reports"],
        cta: "Start Free Trial",
        highlight: false
    },
    {
        name: "Enterprise",
        price: "49",
        description: "The complete infrastructure for high-growth organizations.",
        features: ["Unlimited Employees", "Advanced Geofencing", "Predictive Analytics", "Priority 24/7 Support"],
        cta: "Deploy Now",
        highlight: true
    },
    {
        name: "Custom",
        price: "...",
        description: "Tailored solutions for global enterprises with complex needs.",
        features: ["On-Premise Options", "White-label Portal", "Dedicated Account Lead"],
        cta: "Contact Sales",
        highlight: false
    }
];

export const PricingTier = () => {
    return (
        <section
            id="pricing"
            className="w-full bg-[#FAFAF9] py-[160px] px-6 md:px-[72px] lg:px-[120px] border-t border-black/5"
            aria-labelledby="pricing-heading"
        >
            <div className="max-w-7xl mx-auto">
                <div className="text-center md:text-left mb-24">
                    <span className="text-black font-['Manrope'] text-[10px] font-bold tracking-[0.5em] uppercase block mb-6 opacity-60">
                        Section 03 / Investment
                    </span>
                    <h2 id="pricing-heading" className="text-black font-['Cormorant_Garamond'] text-[clamp(40px,5vw,72px)] font-medium leading-[0.95] tracking-tight">
                        Predictable Scaling. <br />
                        <span className="italic opacity-80 text-black/60">No Hidden Variables.</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            className={`relative flex flex-col p-10 md:p-12 rounded-sm border transition-all duration-500 ${plan.highlight
                                ? "bg-black border-black scale-105 z-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]"
                                : "bg-white border-black/5 hover:border-black/20"
                                }`}
                        >
                            <div className="mb-12">
                                <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${plan.highlight ? "text-white/40" : "text-black/20"}`}>
                                    {plan.name}
                                </span>
                                <div className={`text-[clamp(48px,5vw,64px)] font-['Cormorant_Garamond'] font-medium mt-4 ${plan.highlight ? "text-white" : "text-black"}`}>
                                    {plan.price !== "..." && <span className="text-2xl align-top mr-1">$</span>}
                                    {plan.price}
                                    {plan.price !== "..." && <span className="text-lg font-['Inter'] font-light opacity-40 ml-2">/mo</span>}
                                </div>
                            </div>

                            <p className={`text-sm leading-relaxed mb-12 ${plan.highlight ? "text-white/80" : "text-black font-medium"}`}>
                                {plan.description}
                            </p>

                            <div className="flex-1 space-y-4 mb-12">
                                {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <Check className={`w-4 h-4 ${plan.highlight ? "text-white/80" : "text-black"}`} />
                                        <span className={`text-sm ${plan.highlight ? "text-white" : "text-black font-medium"}`}>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button className={`w-full py-5 rounded-sm font-['Inter'] text-sm font-semibold transition-all active:scale-[0.98] ${plan.highlight
                                ? "bg-white text-black hover:bg-neutral-100"
                                : "bg-black text-white hover:bg-[#1A1A1A]"
                                }`}>
                                {plan.cta}
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* Secure Trust Layer */}
                <div className="mt-24 flex flex-col items-center gap-8">
                    <div className="flex items-center gap-3 opacity-60 select-none">
                        <Shield className="w-4 h-4 text-black" />
                        <span className="text-black font-['Manrope'] text-[10px] font-bold tracking-[0.3em] uppercase">
                            Stripe Protocol Encrypted
                        </span>
                    </div>
                    <div className="flex gap-12 opacity-40 grayscale filter transition-all hover:grayscale-0 hover:opacity-100">
                        <span className="text-black font-bold tracking-tighter text-xl italic">VISA</span>
                        <span className="text-black font-bold tracking-tighter text-xl">mastercard</span>
                        <span className="text-black font-bold tracking-tighter text-xl">AMEX</span>
                    </div>
                </div>
            </div>
        </section>
    );
};
