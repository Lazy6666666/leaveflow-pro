import React from 'react';
// import balanceLogo from "@/assets/balance-logo.png";
const balanceLogo = "/BALNOBG.png";

const Logo = ({ className = "w-10 h-10" }: { className?: string; textColor?: string }) => {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <img
                src={balanceLogo}
                alt="BALANCE logo"
                className="w-full h-full object-contain"
            />
        </div>
    );
};

export default Logo;
