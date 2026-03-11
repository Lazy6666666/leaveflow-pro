import React from 'react';

export const Footer = () => {
    return (
        <footer className="w-full bg-[#080808] pt-[80px] pb-[40px] px-6 md:px-[120px] flex flex-col gap-[60px] border-t border-white/5">
            <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-[80px]">
                {/* Brand */}
                <div className="md:col-span-4 flex flex-col gap-[16px]">
                    <span className="text-[#FFFFFF] font-['Cormorant_Garamond'] text-[20px] font-semibold">
                        ◈ BALANCE
                    </span>
                    <p className="text-[#444444] font-['Inter'] text-[13px] leading-[1.7] max-w-xs">
                        {"The new standard in HR attendance\nand leave management."}
                    </p>
                </div>

                {/* Links */}
                <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-[40px] md:gap-[80px]">
                    {/* Column 1 */}
                    <div className="flex flex-col gap-[16px]">
                        <span className="text-[#444444] font-['Inter'] text-[10px] font-semibold tracking-wider">PRODUCT</span>
                        <a href="#" className="text-[#666666] hover:text-white transition-colors font-['Inter'] text-[13px]">Leave Management</a>
                        <a href="#" className="text-[#666666] hover:text-white transition-colors font-['Inter'] text-[13px]">Attendance Tracking</a>
                        <a href="#" className="text-[#666666] hover:text-white transition-colors font-['Inter'] text-[13px]">Geolocation Clock-In</a>
                        <a href="#" className="text-[#666666] hover:text-white transition-colors font-['Inter'] text-[13px]">HR Reports</a>
                    </div>

                    {/* Column 2 */}
                    <div className="flex flex-col gap-[16px]">
                        <span className="text-[#444444] font-['Inter'] text-[10px] font-semibold tracking-wider">COMPANY</span>
                        <a href="#" className="text-[#666666] hover:text-white transition-colors font-['Inter'] text-[13px]">About</a>
                        <a href="#" className="text-[#666666] hover:text-white transition-colors font-['Inter'] text-[13px]">Blog</a>
                        <a href="#" className="text-[#666666] hover:text-white transition-colors font-['Inter'] text-[13px]">Careers</a>
                    </div>

                    {/* Column 3 */}
                    <div className="flex flex-col gap-[16px]">
                        <span className="text-[#444444] font-['Inter'] text-[10px] font-semibold tracking-wider">LEGAL</span>
                        <a href="#" className="text-[#666666] hover:text-white transition-colors font-['Inter'] text-[13px]">Privacy Policy</a>
                        <a href="#" className="text-[#666666] hover:text-white transition-colors font-['Inter'] text-[13px]">Terms of Service</a>
                    </div>
                </div>
            </div>

            <div className="w-full h-[1px] bg-[#1A1A1A]" />

            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-[16px]">
                <span className="text-[#333333] font-['Inter'] text-[11px]">
                    © 2026 BALANCE. All rights reserved.
                </span>
                <span className="text-[#333333] font-['Inter'] text-[11px]">
                    Built for modern workplaces.
                </span>
            </div>
        </footer>
    );
};
