import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast glass glass-panel group-[.toaster]:border-white/15 group-[.toaster]:bg-white/10 group-[.toaster]:text-foreground group-[.toaster]:shadow-2xl dark:glass-dark dark:group-[.toaster]:bg-white/5",
          title: "font-medium tracking-tight",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:glass group-[.toast]:border group-[.toast]:border-white/15 group-[.toast]:bg-white/10 group-[.toast]:text-foreground hover:group-[.toast]:bg-white/20",
          cancelButton:
            "group-[.toast]:bg-transparent group-[.toast]:text-muted-foreground hover:group-[.toast]:bg-white/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
