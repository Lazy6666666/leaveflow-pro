"use client";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { IconPointerFilled } from "@tabler/icons-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const LandingFeatures = () => {
  const cards = [
    {
      title: "Intelligent Communication",
      description:
        "Seamlessly orchestrate team interactions with integrated voice and text protocols.",
      skeleton: <MessageSkeleton />,
    },
    {
      title: "Secure Document Flow",
      description: "Encrypt and share sensitive HR assets with end-to-end enterprise security.",
      skeleton: (
        <FileTransferSkeleton className="mask-r-from-80% mask-l-from-80%" />
      ),
    },
    {
      title: "Collaborative Workspaces",
      description: "Unite your human capital in shared digital environments designed for motion.",
      skeleton: <TeamCollaborationSkeleton />,
    },
  ];

  return (
    <section id="product" className="px-4 py-20 md:px-8 md:py-32 lg:px-16 bg-[#FDFBF7]">
      <div className="max-w-7xl mx-auto mb-20 text-center">
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="inline-block px-4 py-1.5 rounded-full bg-[#1A1815]/5 border border-[#1A1815]/10 mb-6"
        >
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#1A1815]/60">Capabilities</span>
        </motion.div>
        <h2 className="font-['Outfit'] text-4xl md:text-6xl font-black text-[#1A1815] tracking-tight">
          Engineered for <span className="font-['Cormorant_Garamond'] font-light italic text-[#C9A962]">Human Capital.</span>
        </h2>
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 divide-x-0 divide-y divide-[#1A1815]/10 overflow-hidden rounded-3xl shadow-2xl ring-1 shadow-[#1A1815]/5 ring-[#1A1815]/10 md:grid-cols-3 md:divide-x md:divide-y-0 lg:grid-cols-3 bg-white">
        {cards.map((card) => (
          <Card key={card.title} {...card} />
        ))}
      </div>
    </section>
  );
};

const MessageSkeleton = ({ className }: { className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const messages = [
    {
      id: 1,
      name: "Sarah",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
      text: "Is the payroll file ready?",
      isUser: false,
    },
    {
      id: 2,
      name: "You",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100",
      text: "Almost, just verifying the logic.",
      isUser: true,
    },
    {
      id: 3,
      name: "Tyler",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100",
      text: "Verified! Proceed. ✅",
      isUser: false,
    },
  ];

  return (
    <div
      ref={ref}
      className={cn("flex h-full flex-col justify-center gap-3 p-4", className)}
    >
      {messages.map((message, index) => {
        const baseDelay = index * 0.3;
        return (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${message.isUser ? "flex-row-reverse" : ""}`}
          >
            <motion.img
              src={message.avatar}
              alt={message.name}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.3, delay: baseDelay }}
              className="size-6 shrink-0 rounded-full object-cover ring-2 ring-[#C9A962]/20"
            />
            <motion.div
              initial={{ opacity: 0, x: message.isUser ? 10 : -10 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.3, delay: baseDelay + 0.15 }}
              className={cn(
                  "rounded-2xl px-3 py-1.5 text-xs shadow-sm ring-1",
                  message.isUser 
                    ? "bg-[#1A1815] text-[#FDFBF7] ring-[#1A1815]" 
                    : "bg-neutral-50 text-neutral-700 ring-neutral-200"
              )}
            >
              {message.text}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

const FileTransferSkeleton = ({ className }: { className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [isHovered, setIsHovered] = useState(false);

  const icons = [
    "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=100",
    "https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?auto=format&fit=crop&q=80&w=100",
    "https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&q=80&w=100",
  ];

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-full items-center justify-center p-4",
        className,
      )}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-hidden opacity-20">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="relative h-px w-full">
            <div className="absolute inset-0 border-t border-dashed border-[#1A1815]/20" />
            <motion.div
              className="absolute top-0 h-px w-24 bg-gradient-to-r from-transparent via-[#C9A962] to-transparent"
              initial={{ x: "-100%", opacity: 0 }}
              animate={
                isInView
                  ? {
                      x: ["0%", "500%"],
                      opacity: [0, 1, 1, 0],
                    }
                  : {}
              }
              transition={{
                duration: 2.5,
                delay: i * 0.4,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>
        ))}
      </div>

      <div className="relative z-10 flex items-end gap-16">
        <motion.div
          className="relative cursor-pointer"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.2 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ perspective: "1000px" }}
        >
          <div
            className="relative"
            style={{ width: 80, height: 60, transformStyle: "preserve-3d" }}
          >
            <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-[#C9A962] to-[#B69650] shadow-xl">
              <div
                className="absolute left-2 rounded-t-lg bg-gradient-to-b from-[#B69650] to-[#A3833E]"
                style={{ top: -10, width: 30, height: 12 }}
              />
            </div>

            {icons.map((image, index) => {
              const hoverY = -60 - (2 - index) * 8;
              const hoverX = (index - 1) * 36;
              const hoverRotation = (index - 1) * 15;
              const teaseY = -8 - (2 - index) * 3;
              const teaseRotation = (index - 1) * 5;

              return (
                <motion.div
                  key={index}
                  className="absolute top-2 left-1/2 origin-bottom overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black/5"
                  animate={{
                    x: `calc(-50% + ${isHovered ? hoverX : 0}px)`,
                    y: isHovered ? hoverY : teaseY,
                    rotate: isHovered ? hoverRotation : teaseRotation,
                    width: isHovered ? 60 : 40,
                    height: isHovered ? 45 : 30,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                    delay: index * 0.03,
                  }}
                  style={{ zIndex: 10 + index }}
                >
                  <img
                    src={image}
                    alt={`Asset ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </motion.div>
              );
            })}

            <motion.div
              className="absolute inset-x-0 bottom-0 h-[85%] origin-bottom rounded-xl bg-gradient-to-b from-[#B69650] to-[#C9A962] shadow-inner"
              animate={{
                rotateX: isHovered ? -45 : -25,
                scaleY: isHovered ? 0.8 : 1,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{ transformStyle: "preserve-3d", zIndex: 20 }}
            >
              <div className="absolute top-2 right-4 left-4 h-px bg-white/30" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div
            className="relative rounded-xl bg-neutral-900 shadow-2xl p-2 flex flex-col items-center justify-center gap-2"
            style={{ width: 64, height: 84 }}
          >
             <div className="w-8 h-8 rounded-full border border-[#C9A962]/30 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-[#C9A962] animate-pulse" />
             </div>
             <div className="w-10 h-1 bg-[#C9A962]/20 rounded-full" />
             <div className="w-6 h-1 bg-[#C9A962]/10 rounded-full" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const TeamCollaborationSkeleton = ({ className }: { className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const collaborators = [
    {
      id: 1,
      name: "Strategy",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100",
      color: "#C9A962",
      path: [{ x: 30, y: 20 }, { x: 100, y: 50 }, { x: 50, y: 90 }, { x: 30, y: 20 }],
    },
    {
      id: 2,
      name: "Payroll",
      avatar: "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=100",
      color: "#1A1815",
      path: [{ x: 140, y: 80 }, { x: 70, y: 30 }, { x: 110, y: 60 }, { x: 140, y: 80 }],
    },
  ];

  const codeLines = [
    { indent: 0, width: "70%", color: "bg-[#C9A962]/40" },
    { indent: 1, width: "85%", color: "bg-[#1A1815]/5" },
    { indent: 1, width: "60%", color: "bg-[#C9A962]/20" },
    { indent: 2, width: "90%", color: "bg-[#1A1815]/5" },
    { indent: 0, width: "40%", color: "bg-[#C9A962]/40" },
  ];

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-full items-center justify-center overflow-visible p-4",
        className,
      )}
    >
      <motion.div
        className="relative w-full max-w-[180px] rounded-2xl bg-white p-4 shadow-xl ring-1 ring-[#1A1815]/5 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]"
        initial={{ opacity: 0, y: 15 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-4 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="size-2 rounded-full bg-[#1A1815]/10" />
            <div className="size-2 rounded-full bg-[#1A1815]/10" />
            <div className="size-2 rounded-full bg-[#1A1815]/10" />
          </div>
          <div className="ml-4 h-2 w-16 rounded-full bg-[#C9A962]/10" />
        </div>

        {codeLines.map((line, index) => (
          <div
            key={index}
            className="my-2.5 flex items-center"
            style={{ paddingLeft: line.indent * 12 }}
          >
            <div
              className={`h-2 rounded-full ${line.color}`}
              style={{ width: line.width }}
            />
          </div>
        ))}
      </motion.div>

      {collaborators.map((collaborator, index) => (
        <motion.div
          key={collaborator.id}
          className="absolute"
          initial={{ opacity: 0 }}
          animate={
            isInView
              ? {
                  opacity: 1,
                  x: collaborator.path.map((p) => p.x),
                  y: collaborator.path.map((p) => p.y),
                }
              : {}
          }
          transition={{
            opacity: { duration: 0.4, delay: 0.6 + index * 0.2 },
            x: { duration: 8, delay: 0.6 + index * 0.4, repeat: Infinity, ease: "linear" },
            y: { duration: 8, delay: 0.6 + index * 0.4, repeat: Infinity, ease: "linear" },
          }}
        >
          <IconPointerFilled
            className="size-6 drop-shadow-lg"
            style={{ color: collaborator.color }}
          />
          <div
            className="absolute top-6 left-4 z-50 flex w-max items-center gap-2 rounded-full py-1 pr-3 pl-1 shadow-2xl ring-2 ring-white"
            style={{ backgroundColor: collaborator.color }}
          >
            <img
              src={collaborator.avatar}
              alt={collaborator.name}
              className="size-6 shrink-0 rounded-full object-cover"
            />
            <span className="shrink-0 text-[10px] font-bold tracking-tight text-[#FDFBF7]">
              {collaborator.name}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const Card = ({
  title,
  description,
  skeleton,
}: {
  title: string;
  description: string;
  skeleton: React.ReactNode;
}) => {
  return (
    <div className="flex h-full flex-col justify-between bg-white p-12 transition-all duration-500 hover:bg-[#1A1815]/[0.02] group">
      <div className="h-64 w-full overflow-visible rounded-2xl bg-neutral-50 flex items-center justify-center mb-8 ring-1 ring-[#1A1815]/5 transition-all duration-500 group-hover:ring-[#1A1815]/10 group-hover:shadow-inner">
        {skeleton}
      </div>
      <div>
        <h3 className="font-['Outfit'] text-xl font-bold tracking-tight text-[#1A1815] mb-3 group-hover:text-[#C9A962] transition-colors duration-500">
          {title}
        </h3>
        <p className="font-['Outfit'] font-light text-base leading-relaxed text-[#1A1815]/50 group-hover:text-[#1A1815]/70 transition-colors duration-500">
          {description}
        </p>
      </div>
    </div>
  );
};
