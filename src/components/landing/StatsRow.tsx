import React from 'react';

const stats = [
    { value: "98%", label: "APPROVAL ACCURACY" },
    { value: "< 10s", label: "AVERAGE CLOCK-IN TIME" },
    { value: "500+", label: "EMPLOYEES TRACKED" },
    { value: "Zero", label: "UNVERIFIED CLOCK-INS" }
];

export const StatsRow = () => {
    return (
        <section className="w-full bg-[#050505] min-h-[200px] px-6 md:px-[120px] py-[60px] flex flex-wrap items-center justify-between gap-[40px] md:gap-0">
            {stats.map((stat, i) => (
                <div key={i} className="flex flex-col gap-[8px] w-full sm:w-1/2 md:w-auto text-center md:text-left">
                    <div className="text-[#FFFFFF] font-['Cormorant_Garamond'] text-[56px] md:text-[64px] font-medium leading-[1]">
                        {stat.value}
                    </div>
                    <div className="text-[#777777] font-['Inter'] text-[11px] font-semibold tracking-wider">
                        {stat.label}
                    </div>
                </div>
            ))}
        </section>
    );
};
