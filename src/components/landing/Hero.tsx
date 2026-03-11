import React from 'react';
import { Link } from 'react-router-dom';

export const Hero = () => {
    return (
        <section className="relative w-full min-h-[800px] flex flex-col text-center border-b border-white/5">
            {/* Background Image Placeholder using an abstract fluid Unsplash image similar to the generated AI one */}
            <div
                className="absolute inset-0 bg-black bg-cover bg-center bg-no-repeat grayscale opacity-70"
                style={{ backgroundImage: "url('/images/landing/hero.png')" }}
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-[#0A0A0A]/[0.66] pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 flex-1 flex flex-col items-center pt-[140px] px-6 gap-[36px]">

                {/* Badge */}
                <div className="flex items-center gap-[8px] bg-[#FFFFFF]/[0.09] px-[20px] py-[7px] rounded-full border border-white/10 backdrop-blur-sm">
                    <div className="w-[6px] h-[6px] rounded-full bg-[#E0E0E0] animate-pulse" />
                    <span className="text-[#AAAAAA] font-['Inter'] text-[11px] font-semibold tracking-wider">
                        NEXT-GENERATION INTERFACE
                    </span>
                </div>

                {/* Headline */}
                <h1 className="text-[#FFFFFF] font-['Cormorant_Garamond'] text-[56px] md:text-[96px] font-medium leading-[1] whitespace-pre-line tracking-tight">
                    {"Leave, Balanced.\nWork, Tracked."}
                </h1>

                {/* Subtitle */}
                <p className="text-[#848484] font-['Inter'] text-[16px] md:text-[18px] leading-[1.6] max-w-2xl whitespace-pre-line">
                    {"BALANCE is the all-in-one leave management platform built for modern teams.\nFrom clock-in to approval — seamless, intelligent, and effortless."}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center gap-[16px] mt-4">
                    <Link to="/auth?signup=true" className="bg-[#FFFFFF] text-[#0A0A0A] font-['Inter'] text-[15px] font-semibold px-[40px] py-[16px] rounded-[2px] hover:bg-neutral-200 transition-colors">
                        Start Free Trial
                    </Link>
                    <a href="#features" className="bg-transparent text-[#FFFFFF] font-['Inter'] text-[15px] font-semibold px-[40px] py-[16px] rounded-[2px] border border-[#444444] hover:bg-white/5 transition-colors">
                        See How It Works →
                    </a>
                </div>

                {/* Scroll hint */}
                <div className="mt-auto pb-[40px]">
                    <span className="text-[#555555] font-['Inter'] text-[11px] uppercase tracking-wider">
                        ↓ scroll to discover
                    </span>
                </div>
            </div>
        </section>
    );
};
