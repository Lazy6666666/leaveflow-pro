import React from 'react';

const problems = [
    {
        icon: "◲",
        title: "Lost Leave\nRequests",
        desc: "Emails get buried. Spreadsheets go stale.\nApprovals take days — and attendance data gets lost.",
        bg: "bg-[#141414]",
        border: "border-[#222222]"
    },
    {
        icon: "⟳",
        title: "No Real-Time\nVisibility",
        desc: "Managers have no single source of truth.\nWho's in? Who's on leave? Nobody really knows in\nreal time.",
        bg: "bg-[#111111]",
        border: "border-[#1A1A1A]"
    },
    {
        icon: "⊘",
        title: "Manual Clock-In\nFraud Risk",
        desc: "Without geolocation verification, time fraud slips through\nundetected, costing the business daily.",
        bg: "bg-[#0D0D0D]",
        border: "border-[#141414]"
    }
];

export const ProblemManifest = () => {
    return (
        <section className="w-full bg-[#0A0A0A] py-[120px] px-6 md:px-[120px] flex flex-col gap-[64px]">
            <div className="w-full text-right">
                <span className="text-[#555555] font-['Inter'] text-[11px] font-semibold tracking-wider block mb-2">
                    01 — THE PROBLEM
                </span>
                <h2 className="text-[#FFFFFF] font-['Cormorant_Garamond'] text-[40px] md:text-[56px] font-medium leading-[1.1] whitespace-pre-line tracking-tight">
                    {"HR processes that\nfeel like paperwork."}
                </h2>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-[2px] bg-[#222222]/30 p-[2px] rounded-sm">
                {problems.map((problem, i) => (
                    <div
                        key={i}
                        className={`${problem.bg} w-full h-full min-h-[280px] p-[40px] flex flex-col gap-[16px] border ${problem.border} hover:bg-[#1A1A1A] transition-colors`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="text-[#555555] font-['Inter'] text-[28px] font-normal leading-none">
                                {problem.icon}
                            </div>
                            <div className="w-12 h-12 grayscale opacity-40 rounded-sm overflow-hidden">
                                <img
                                    src="/images/landing/feature_report.png"
                                    alt=""
                                    width={96}
                                    height={96}
                                    loading="lazy"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>
                        <h3 className="text-[#FFFFFF] font-['Cormorant_Garamond'] text-[24px] font-medium leading-[1.1] whitespace-pre-line tracking-tight mt-auto">
                            {problem.title}
                        </h3>
                        <p className="text-[#888888] font-['Inter'] text-[13px] font-normal leading-[1.6] whitespace-pre-line">
                            {problem.desc}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
};
