import React from 'react';

const LANDING_IMAGE_WIDTH = 512;
const LANDING_IMAGE_HEIGHT = 256;

export const FeaturesGrid = () => {
    return (
        <section id="features" className="w-full bg-[#0A0A0A] py-[120px] px-6 md:px-[120px] flex flex-col gap-[80px]">
            <div className="w-full text-right">
                <span className="text-[#555555] font-['Inter'] text-[11px] font-semibold tracking-wider block mb-2">
                    02 — THE SOLUTION
                </span>
                <h2 className="text-[#FFFFFF] font-['Cormorant_Garamond'] text-[40px] md:text-[56px] font-medium leading-[1.1] whitespace-pre-line tracking-tight">
                    {"One platform.\nEvery HR workflow."}
                </h2>
            </div>

            <div className="flex flex-col gap-[2px] bg-[#222222]/30 p-[2px] rounded-sm">
                {/* Row 1: 50/50 */}
                <div className="h-auto md:h-[260px] flex flex-col md:flex-row gap-[2px]">
                    {/* Card A */}
                    <div className="flex-1 bg-[#141414] p-[44px] flex flex-col gap-[16px] hover:bg-[#1A1A1A] transition-colors border border-[#222222]">
                        <span className="text-[#333333] font-['Inter'] text-[10px] font-semibold">01</span>
                        <h3 className="text-[#FFFFFF] font-['Cormorant_Garamond'] text-[26px] font-medium leading-[1.1]">
                            Geolocation<br />Clock-In / Out
                        </h3>
                        <div className="w-full h-32 overflow-hidden rounded-sm my-2 grayscale opacity-80">
                            <img
                                src="/images/landing/feature_geo.png"
                                alt="Geolocation"
                                width={LANDING_IMAGE_WIDTH}
                                height={LANDING_IMAGE_HEIGHT}
                                loading="lazy"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <p className="text-[#555555] font-['Inter'] text-[13px] leading-[1.6]">
                            Employees clock in with verified GPS location. HR admins see exactly where and when — no time fraud, no disputes.
                        </p>
                    </div>
                    {/* Card B */}
                    <div className="flex-1 bg-[#0E0E0E] p-[44px] flex flex-col gap-[16px] hover:bg-[#1A1A1A] transition-colors border border-[#1A1A1A]">
                        <span className="text-[#333333] font-['Inter'] text-[10px] font-semibold">02</span>
                        <h3 className="text-[#FFFFFF] font-['Cormorant_Garamond'] text-[26px] font-medium leading-[1.1]">
                            Leave Requests<br />& Approvals
                        </h3>
                        <div className="w-full h-32 overflow-hidden rounded-sm my-2 grayscale opacity-80">
                            <img
                                src="/images/landing/feature_leave.png"
                                alt="Leave Requests"
                                width={LANDING_IMAGE_WIDTH}
                                height={LANDING_IMAGE_HEIGHT}
                                loading="lazy"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <p className="text-[#555555] font-['Inter'] text-[13px] leading-[1.6]">
                            Employees submit requests in seconds. Managers approve with one click. History, balances, and status all in one view.
                        </p>
                    </div>
                </div>

                {/* Row 2: 50/50 */}
                <div className="h-auto md:h-[260px] flex flex-col md:flex-row gap-[2px]">
                    {/* Card C */}
                    <div className="flex-1 bg-[#0F0F0F] p-[44px] flex flex-col gap-[16px] hover:bg-[#1A1A1A] transition-colors border border-[#222222]">
                        <span className="text-[#333333] font-['Inter'] text-[10px] font-semibold">03</span>
                        <h3 className="text-[#FFFFFF] font-['Cormorant_Garamond'] text-[26px] font-medium leading-[1.1]">
                            Live Attendance<br />Dashboard
                        </h3>
                        <div className="w-full h-32 overflow-hidden rounded-sm my-2 grayscale opacity-80">
                            <img
                                src="/images/landing/feature_dashboard.png"
                                alt="Attendance Dashboard"
                                width={LANDING_IMAGE_WIDTH}
                                height={LANDING_IMAGE_HEIGHT}
                                loading="lazy"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <p className="text-[#555555] font-['Inter'] text-[13px] leading-[1.6]">
                            Real-time view of who's present, on leave, late, or absent. Filter by department. Export for payroll. Always accurate.
                        </p>
                    </div>
                    {/* Card D */}
                    <div className="flex-1 bg-[#111111] p-[44px] flex flex-col gap-[16px] hover:bg-[#1A1A1A] transition-colors border border-[#1A1A1A]">
                        <span className="text-[#333333] font-['Inter'] text-[10px] font-semibold">04</span>
                        <h3 className="text-[#FFFFFF] font-['Cormorant_Garamond'] text-[26px] font-medium leading-[1.1]">
                            HR Reports<br />& Analytics
                        </h3>
                        <div className="w-full h-32 overflow-hidden rounded-sm my-2 grayscale opacity-80">
                            <img
                                src="/images/landing/feature_report.png"
                                alt="HR Reports"
                                width={LANDING_IMAGE_WIDTH}
                                height={LANDING_IMAGE_HEIGHT}
                                loading="lazy"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <p className="text-[#555555] font-['Inter'] text-[13px] leading-[1.6]">
                            Generate leave summaries, overtime reports, and attendance history per employee — PDF-ready in seconds.
                        </p>
                    </div>
                </div>

                {/* Row 3: 33/33/33 */}
                <div className="h-auto md:h-[180px] flex flex-col md:flex-row gap-[2px]">
                    {/* Card E */}
                    <div className="flex-1 bg-[#141414] py-[36px] px-[44px] flex flex-col gap-[8px] hover:bg-[#1A1A1A] transition-colors border border-transparent">
                        <span className="text-[#333333] font-['Inter'] text-[10px] font-semibold">05</span>
                        <h3 className="text-[#FFFFFF] font-['Cormorant_Garamond'] text-[22px] font-medium">
                            Role-Based Access
                        </h3>
                        <p className="text-[#555555] font-['Inter'] text-[13px] leading-[1.6]">
                            Separate dashboards for employees and admins. Every user sees only what they need.
                        </p>
                    </div>
                    {/* Card F */}
                    <div className="flex-1 bg-[#0E0E0E] py-[36px] px-[44px] flex flex-col gap-[8px] hover:bg-[#1A1A1A] transition-colors border border-transparent">
                        <span className="text-[#333333] font-['Inter'] text-[10px] font-semibold">06</span>
                        <h3 className="text-[#FFFFFF] font-['Cormorant_Garamond'] text-[22px] font-medium">
                            Leave History & Balance
                        </h3>
                        <p className="text-[#555555] font-['Inter'] text-[13px] leading-[1.6]">
                            Full audit trail per employee. Remaining days, used types, and approval history always visible.
                        </p>
                    </div>
                    {/* Card G */}
                    <div className="flex-1 bg-[#131313] py-[36px] px-[44px] flex flex-col gap-[8px] hover:bg-[#1A1A1A] transition-colors border border-transparent">
                        <span className="text-[#333333] font-['Inter'] text-[10px] font-semibold">07</span>
                        <h3 className="text-[#FFFFFF] font-['Cormorant_Garamond'] text-[22px] font-medium">
                            Mobile-Ready Interface
                        </h3>
                        <p className="text-[#555555] font-['Inter'] text-[13px] leading-[1.6]">
                            Fully responsive. Employees clock in from their phone, on-site or remote, verified by GPS.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
};
