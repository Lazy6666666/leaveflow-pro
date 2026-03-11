import React from 'react';
import { Shield } from 'lucide-react'; // Fallback icon instead of lock string if possible

export const PricingTier = () => {
    return (
        <section id="pricing" className="w-full bg-[#0A0A0A] py-[120px] px-6 md:px-[120px] flex flex-col gap-[64px]">
            <div className="w-full flex flex-col gap-[16px] text-center md:text-left">
                <span className="text-[#555555] font-['Inter'] text-[11px] font-semibold tracking-wider block">
                    03 — PRICING
                </span>
                <h2 className="text-[#FFFFFF] font-['Cormorant_Garamond'] text-[40px] md:text-[56px] font-medium leading-[1.1] whitespace-pre-line tracking-tight text-center">
                    Clear, transparent pricing.
                </h2>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-[32px]">
                {/* Starter Plan */}
                <div className="bg-[#141414] py-[60px] px-[40px] flex flex-col justify-between gap-[32px] border border-transparent">
                    <div className="flex flex-col gap-[8px]">
                        <span className="text-[#FFFFFF] font-['Inter'] text-[20px] font-medium">Starter</span>
                        <div className="text-[#FFFFFF] font-['Inter'] text-[48px] font-semibold">$19</div>
                    </div>
                    <button className="w-full bg-[#222222] py-[14px] rounded-[2px] text-[#FFFFFF] font-['Inter'] text-[14px] font-medium hover:bg-[#333333] transition-colors">
                        Get Started
                    </button>
                </div>

                {/* Pro Plan */}
                <div className="bg-[#000000] py-[60px] px-[40px] flex flex-col justify-between gap-[32px] relative border border-transparent shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-0 bg-[#FFFFFF] px-[12px] py-[4px] rounded-full mr-[40px]">
                        <span className="text-[#0A0A0A] font-['Inter'] text-[10px] font-bold tracking-wider">MOST POPULAR</span>
                    </div>
                    <div className="flex flex-col gap-[8px]">
                        <span className="text-[#FFFFFF] font-['Inter'] text-[20px] font-medium">Professional</span>
                        <div className="text-[#FFFFFF] font-['Inter'] text-[48px] font-semibold">$49</div>
                    </div>
                    <button className="w-full bg-[#FFFFFF] py-[14px] rounded-[2px] text-[#000000] font-['Inter'] text-[14px] font-semibold hover:bg-neutral-200 transition-colors">
                        Get Started
                    </button>
                </div>

                {/* Enterprise Plan */}
                <div className="bg-[#141414] py-[60px] px-[40px] flex flex-col justify-between gap-[32px] border border-transparent">
                    <div className="flex flex-col gap-[8px]">
                        <span className="text-[#FFFFFF] font-['Inter'] text-[20px] font-medium">Enterprise</span>
                        <div className="text-[#FFFFFF] font-['Inter'] text-[48px] font-semibold">Custom</div>
                    </div>
                    <button className="w-full bg-[#222222] py-[14px] rounded-[2px] text-[#FFFFFF] font-['Inter'] text-[14px] font-medium hover:bg-[#333333] transition-colors">
                        Contact Sales
                    </button>
                </div>
            </div>

            <div className="w-full flex flex-col items-center gap-[16px] pt-[40px]">
                <div className="flex items-center gap-[8px]">
                    <Shield className="w-[14px] h-[14px] text-[#555555]" />
                    <span className="text-[#555555] font-['Inter'] text-[11px] font-semibold tracking-wider">
                        SECURE PAYMENTS BY STRIPE
                    </span>
                </div>
                <div className="flex items-center gap-[12px]">
                    <div className="h-[32px] px-[12px] flex items-center justify-center bg-[#141414] rounded-[4px] border border-[#222222]">
                        <span className="text-[#FFFFFF] font-['Inter'] text-[12px] font-bold italic">VISA</span>
                    </div>
                    <div className="h-[32px] px-[12px] flex items-center justify-center bg-[#141414] rounded-[4px] border border-[#222222]">
                        <span className="text-[#FFFFFF] font-['Inter'] text-[12px] font-semibold">Mastercard</span>
                    </div>
                    <div className="h-[32px] px-[12px] flex items-center justify-center bg-[#141414] rounded-[4px] border border-[#222222]">
                        <span className="text-[#FFFFFF] font-['Inter'] text-[12px] font-semibold">AMEX</span>
                    </div>
                </div>
            </div>
        </section>
    );
};
