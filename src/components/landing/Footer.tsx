import React from 'react';

export const Footer = () => {
    return (
        <footer className="w-full bg-[#050505] pt-[120px] pb-[60px] px-6 md:px-[72px] lg:px-[120px] flex flex-col gap-[100px] border-t border-white/5">
            <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-20 lg:gap-32">
                {/* Brand */}
                <div className="lg:col-span-5 flex flex-col gap-[24px]">
                    <div className="flex items-center gap-[12px]">
                        <img src="/BALNOBG.png" alt="BALANCE Logo" className="h-[24px] w-auto brightness-0 invert opacity-40 group-hover:opacity-100 transition-opacity" />
                        <span className="text-[#FFFFFF] font-['Cormorant_Garamond'] text-[24px] font-medium tracking-tighter uppercase opacity-80">
                            Balance
                        </span>
                    </div>
                    <p className="text-white font-['Manrope'] text-sm leading-relaxed max-w-sm font-normal opacity-60">
                        {"Engineered for architectural clarity in HR logistics. The new standard for enterprise attendance and leave management."}
                    </p>
                    <div className="flex gap-10 pt-8 border-t border-white/[0.03] mt-8 w-fit">
                        <SocialLink name="INSTAGRAM" label="Instagram Profile" />
                        <SocialLink name="LINKEDIN" label="LinkedIn Profile" />
                        <SocialLink name="REPOSITORY" label="GitHub Repository" />
                    </div>
                </div>

                {/* Content columns */}
                <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-12 lg:gap-24">
                    {/* Column 1 */}
                    <nav className="flex flex-col gap-[20px]" aria-label="System Links">
                        <span className="text-white/40 font-['Manrope'] text-[10px] font-bold tracking-[0.3em] uppercase">SYSTEM</span>
                        <FooterLink name="Infrastructure" />
                        <FooterLink name="Attendance" />
                        <FooterLink name="Verification" />
                        <FooterLink name="Reporting" />
                    </nav>

                    {/* Column 2 */}
                    <nav className="flex flex-col gap-[20px]" aria-label="Organization Links">
                        <span className="text-white/40 font-['Manrope'] text-[10px] font-bold tracking-[0.3em] uppercase">ORGANIZATION</span>
                        <FooterLink name="About Balance" />
                        <FooterLink name="Documentation" />
                        <FooterLink name="Careers" />
                    </nav>

                    {/* Column 3 */}
                    <nav className="flex flex-col gap-[20px]" aria-label="Legal Protocols">
                        <span className="text-white/40 font-['Manrope'] text-[10px] font-bold tracking-[0.3em] uppercase">PROTOCOLS</span>
                        <FooterLink name="Security" />
                        <FooterLink name="Privacy" />
                        <FooterLink name="Terms" />
                    </nav>
                </div>
            </div>

            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-[24px] pt-12 border-t border-white/5">
                <span className="text-white font-['Manrope'] text-[10px] font-medium tracking-widest uppercase opacity-20">
                    © 2026 BALANCE ARCHITECTURES. ALL RIGHTS RESERVED.
                </span>
                <span className="text-white font-['Manrope'] text-[10px] font-medium tracking-[0.3em] uppercase opacity-40">
                    Designed for high performance teams.
                </span>
            </div>
        </footer>
    );
};

const FooterLink = ({ name }) => (
    <a href="#" className="text-white/60 hover:text-white transition-colors font-['Manrope'] text-[13px] font-medium">
        {name}
    </a>
);

const SocialLink = ({ name, label }) => (
    <a href="#" className="text-white/40 hover:text-white transition-colors font-['Manrope'] text-[11px] font-bold tracking-widest" aria-label={label}>
        {name}
    </a>
);
