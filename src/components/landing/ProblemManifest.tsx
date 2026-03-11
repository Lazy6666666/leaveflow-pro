import React from 'react';
import { motion } from 'framer-motion';

const problems = [
    {
        id: "01",
        icon: "◲",
        title: "The Paperwork Labyrinth",
        desc: "Fragmented emails, stagnant spreadsheets, and buried requests. HR becomes a bottleneck rather than a facilitator.",
        accent: "bg-[#1A1A1A]"
    },
    {
        id: "02",
        icon: "⟳",
        title: "Operational Blindness",
        desc: "Zero real-time visibility into workforce distribution. Managers operate on outdated data, leading to staffing gaps.",
        accent: "bg-[#111111]"
    },
    {
        id: "03",
        icon: "⊘",
        title: "Verification Deficit",
        desc: "Unvalidated attendance costs enterprises millions in leakage. Trust is a strategy, but verification is the standard.",
        accent: "bg-[#0A0A0A]"
    }
];

export const ProblemManifest = () => {
    return (
        <section
            id="manifest"
            className="w-full bg-[#FAFAF9] py-[160px] px-6 md:px-[72px] lg:px-[120px]"
            aria-labelledby="manifest-heading"
        >
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 mb-32 items-end">
                    <div className="lg:col-span-1 flex items-center h-full">
                        <span className="text-black/30 font-['Manrope'] text-[9px] font-bold tracking-[0.8em] [writing-mode:vertical-lr] rotate-180 hidden lg:block uppercase whitespace-nowrap">
                            Section 01 / Critical Vector
                        </span>
                    </div>
                    <div className="lg:col-span-7">
                        <motion.h2
                            id="manifest-heading"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                            className="text-black font-['Cormorant_Garamond'] text-[clamp(40px,6vw,84px)] font-medium leading-[0.9] tracking-tighter"
                        >
                            The Friction of <br />
                            <span className="italic opacity-80 text-black/60">Manual Management.</span>
                        </motion.h2>
                    </div>
                    <div className="lg:col-span-4 lg:text-right">
                        <p className="text-black font-['Manrope'] text-sm md:text-base leading-relaxed font-medium max-w-sm ml-auto">
                            Modern teams deserve precision. We've identified the three critical vectors of HR inefficiency.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-black/5 overflow-hidden rounded-sm bg-white/50">
                    {problems.map((problem, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            className={`group relative p-10 md:p-14 lg:p-16 border-r border-b last:border-r-0 border-black/5 hover:bg-white transition-colors duration-700 min-h-[450px] flex flex-col justify-between`}
                        >
                            {/* Background Accent Animation */}
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-black/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                            <div className="relative">
                                <span className="text-black/10 font-['Inter'] text-[9px] font-bold tracking-[0.5em] block mb-16">
                                    VCTR — {problem.id}
                                </span>
                                <div className="flex justify-between items-end mb-14 h-24">
                                    <div className="text-black opacity-[0.03] font-light text-[120px] absolute -left-8 -top-8 group-hover:opacity-10 transition-all duration-1000 pointer-events-none">
                                        {problem.icon}
                                    </div>
                                    <div className="w-32 h-32 grayscale opacity-[0.04] group-hover:opacity-[0.15] transition-all duration-1000 filter blur-[0.5px] group-hover:blur-0 ml-auto translate-x-4">
                                        <img src="/images/landing/feature_report.png" alt="" className="w-full h-full object-cover rounded-sm border border-black/5" />
                                    </div>
                                </div>
                                <h3 className="text-black font-['Cormorant_Garamond'] text-[clamp(28px,4vw,42px)] font-medium leading-[0.95] tracking-tighter mb-8">
                                    {problem.title}
                                </h3>
                            </div>

                            <div className="space-y-8">
                                <p className="text-black font-['Manrope'] text-sm leading-relaxed font-medium">
                                    {problem.desc}
                                </p>
                                <div className="w-12 h-[1px] bg-black/20 group-hover:w-24 group-hover:bg-black transition-all duration-500" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
