import React from 'react';
import { Link } from 'react-router-dom';

export const Navbar = () => {
    return (
        <nav
            className="w-full h-[72px] bg-[#0A0A0A] px-6 md:px-[72px] flex items-center justify-between sticky top-0 z-50 border-b border-white/5"
            aria-label="Main Navigation"
        >
            <div className="flex items-center gap-[12px]">
                <img src="/balance-logo.png" alt="BALANCE Logo" className="h-[32px] w-auto" />
                <span className="text-[#FFFFFF] font-['Cormorant_Garamond'] text-[24px] font-semibold tracking-tight">
                    BALANCE
                </span>
            </div>

            <div className="hidden md:flex items-center gap-[40px]" role="list">
                <a href="#platform" className="text-white/60 font-['Manrope'] text-[13px] font-medium hover:text-white transition-colors" role="listitem">Platform</a>
                <a href="#solutions" className="text-white/60 font-['Manrope'] text-[13px] font-medium hover:text-white transition-colors" role="listitem">Solutions</a>
                <a href="#technology" className="text-white/60 font-['Manrope'] text-[13px] font-medium hover:text-white transition-colors" role="listitem">Technology</a>
                <a href="#pricing" className="text-white/60 font-['Manrope'] text-[13px] font-medium hover:text-white transition-colors" role="listitem">Pricing</a>
            </div>

            <div className="flex items-center gap-[24px]">
                <Link
                    to="/auth"
                    className="hidden sm:block text-white/60 font-['Manrope'] text-[13px] font-medium hover:text-white transition-colors"
                    aria-label="Sign in to your account"
                >
                    Sign In
                </Link>
                <Link
                    to="/auth?signup=true"
                    className="bg-[#FFFFFF] rounded-[2px] px-[24px] py-[10px] text-[#0A0A0A] font-['Inter'] text-[13px] font-semibold hover:bg-neutral-200 transition-colors"
                    aria-label="Get early access to BALANCE"
                >
                    Get Early Access
                </Link>
            </div>
        </nav>
    );
};
