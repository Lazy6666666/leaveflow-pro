import React from 'react';
import { Link } from 'react-router-dom';

export const FinalCTA = () => {
    return (
        <section className="relative w-full h-[500px] bg-[#0A0A0A] overflow-hidden flex items-center justify-center">

            {/* Background Graphic Box (Abstract Representation) */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1320px] h-[500px] bg-[#0A0A0A]/[0.73] pointer-events-none grayscale bg-cover bg-center"
                style={{ backgroundImage: "url('/images/landing/hero.png')" }}
            />

            {/* Overlay to dim background */}
            <div className="absolute inset-0 bg-[#0A0A0A]/[0.8]" />

            {/* Content */}
            <div className="relative z-10 w-full max-w-4xl px-6 flex flex-col items-center gap-[36px] text-center">
                <span className="text-[#555555] font-['Inter'] text-[11px] font-semibold tracking-wider">
                    GET STARTED TODAY
                </span>
                <h2 className="text-[#FFFFFF] font-['Cormorant_Garamond'] text-[56px] md:text-[72px] font-medium leading-[1] whitespace-pre-line tracking-tight">
                    {"HR clarity starts\nwith one click."}
                </h2>
                <p className="text-[#777777] font-['Inter'] text-[15px] font-normal leading-[1.7] max-w-xl">
                    {"Join forward-thinking teams already using BALANCE to manage leave\nand attendance — accurately, effortlessly, transparently."}
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-[16px]">
                    <Link to="/auth?signup=true" className="bg-[#FFFFFF] text-[#0A0A0A] font-['Inter'] text-[14px] font-semibold px-[48px] py-[18px] rounded-[2px] hover:bg-neutral-200 transition-colors">
                        Request a Demo
                    </Link>
                    <a href="#features" className="bg-transparent text-[#888888] font-['Inter'] text-[14px] px-[48px] py-[18px] rounded-[2px] border border-[#333333] hover:text-[#FFFFFF] transition-colors">
                        See How It Works →
                    </a>
                </div>
            </div>
        </section>
    );
};
