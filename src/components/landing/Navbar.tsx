import React from 'react';
import { Link } from 'react-router-dom';

export const Navbar = () => {
    return (
        <nav className="w-full h-[72px] bg-[#0A0A0A] px-6 md:px-[72px] flex items-center justify-between sticky top-0 z-50 border-b border-white/5">
            <div className="flex items-center gap-[10px]">
                <span className="text-[#FFFFFF] font-['Cormorant_Garamond'] text-[20px] font-semibold">
                    ◈ BALANCE
                </span>
            </div>

            <div className="hidden md:flex items-center gap-[40px]">
                <a href="#platform" className="text-[#848484] font-['Inter'] text-[13px] font-medium hover:text-white transition-colors">Platform</a>
                <a href="#solutions" className="text-[#848484] font-['Inter'] text-[13px] font-medium hover:text-white transition-colors">Solutions</a>
                <a href="#technology" className="text-[#848484] font-['Inter'] text-[13px] font-medium hover:text-white transition-colors">Technology</a>
                <a href="#pricing" className="text-[#848484] font-['Inter'] text-[13px] font-medium hover:text-white transition-colors">Pricing</a>
            </div>

            <div className="flex items-center gap-[24px]">
                <Link to="/auth" className="hidden sm:block text-[#848484] font-['Inter'] text-[13px] font-medium hover:text-white transition-colors">
                    Sign In
                </Link>
                <Link to="/auth?signup=true" className="bg-[#FFFFFF] rounded-[2px] px-[24px] py-[10px] text-[#0A0A0A] font-['Inter'] text-[13px] font-semibold hover:bg-neutral-200 transition-colors">
                    Get Early Access
                </Link>
            </div>
        </nav>
    );
};
