import React from 'react';
import { motion } from 'framer-motion';

const stats = [
    { value: "98%", label: "Approval Accuracy", sub: "Verified Data" },
    { value: "<10s", label: "Clock-In Friction", sub: "Latency Goal" },
    { value: "500+", label: "Daily Active Users", sub: "Scaling Now" },
    { value: "Zero", label: "Verification Gaps", sub: "Zero-Trust" }
];

export const StatsRow = () => {
    return (
        <section className="w-full bg-[#050505] py-32 px-6 md:px-[72px] lg:px-[120px] border-b border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-20">
                {stats.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="flex flex-col gap-4 relative"
                    >
                        <div className="absolute -top-4 -left-4 w-2 h-2 border-l border-t border-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="text-white font-['Cormorant_Garamond'] text-7xl font-medium tracking-tighter leading-none mb-2">
                            {stat.value}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-white animate-pulse" />
                                <div className="text-white font-['Manrope'] text-[10px] font-bold tracking-[0.3em] uppercase opacity-60">
                                    {stat.label}
                                </div>
                            </div>
                            <div className="text-white/20 font-['Manrope'] text-[8px] font-bold tracking-[0.5em] uppercase pl-3">
                                LOG // {stat.sub}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};
