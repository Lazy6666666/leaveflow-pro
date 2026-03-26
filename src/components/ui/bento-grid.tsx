import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-6 md:auto-rows-[20rem] md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  children,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "group/bento shadow-input row-span-1 flex flex-col justify-between space-y-4 rounded-3xl border border-neutral-200 bg-white p-6 transition duration-200 hover:shadow-xl dark:border-white/[0.1] dark:bg-black dark:shadow-none relative overflow-hidden",
        className,
      )}
    >
      {/* Background container for effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {children}
      </div>

      <div className="relative z-10 flex flex-col h-full justify-between">
        {header}
        <div className="transition duration-200 group-hover/bento:translate-x-2 mt-4">
          {icon}
          <div className="mt-4 mb-2 font-['DM_Sans'] font-bold text-foreground text-lg">
            {title}
          </div>
          <div className="font-sans text-sm font-medium text-foreground leading-relaxed">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
};
