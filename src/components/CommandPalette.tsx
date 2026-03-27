import React, { useCallback, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { PlusCircle } from "lucide-react";
import { adminItems, employeeItems, managerItems, type AppSidebarItem } from "@/components/AppSidebar";
import { useAuth, type AppFeature } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useAnalytics";

interface CommandPaletteProps {
  onOpenChange: (open: boolean) => void;
  onRequestLeave: () => void;
  open: boolean;
}

type CommandEntry = {
  description: string;
  group: string;
  href?: string;
  icon: AppSidebarItem["icon"];
  id: string;
  keywords: string[];
  label: string;
  onSelect?: () => void;
  shortcut?: string;
};

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return target.isContentEditable || tagName === "input" || tagName === "textarea" || tagName === "select";
};

const mapNavItems = (group: string, items: AppSidebarItem[], keywords: string[]) =>
  items.map<CommandEntry>((item) => ({
    description: `Open ${item.label.toLowerCase()}.`,
    group,
    href: item.href,
    icon: item.icon,
    id: item.href,
    keywords: [...keywords, item.label.toLowerCase(), item.href],
    label: item.label,
  }));

const shortcutLabel = () =>
  typeof navigator !== "undefined" && /(Mac|iPhone|iPad|iPod)/i.test(navigator.platform) ? "⌘K" : "Ctrl K";

export const commandPaletteShortcutLabel = shortcutLabel;

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onOpenChange, onRequestLeave, open }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const hasFeature = auth.hasFeature ?? ((feature: AppFeature) => {
    switch (feature) {
      case "manager_hub":
        return auth.hasManagerAccess ?? false;
      case "admin_system":
      case "hr_operations":
      case "document_expiry":
      case "agent_workspace":
        return auth.hasRole?.("hr_admin") ?? false;
      case "admin_setup":
        return (auth.needsAdminSetup ?? false) && !(auth.hasRole?.("hr_admin") ?? false);
      default:
        return false;
    }
  });
  const { track } = useAnalytics();

  const entries = useMemo(() => {
    const quickActions: CommandEntry[] = [
      {
        description: "Open the existing leave request flow.",
        group: "Quick actions",
        icon: PlusCircle,
        id: "new-request",
        keywords: ["new", "request", "leave", "time", "off"],
        label: "New Request",
        onSelect: onRequestLeave,
        shortcut: "N",
      },
    ];

    const navigation = [
      ...mapNavItems("Workspace", employeeItems, ["workspace", "employee"]),
      ...(hasFeature("manager_hub") ? mapNavItems("Management", managerItems, ["manager", "approvals", "calendar"]) : []),
      ...mapNavItems(
        "Administration",
        adminItems.filter((item) => !item.feature || hasFeature(item.feature)),
        ["admin", "hr", "operations", "system", "developer"],
      ),
      ...(hasFeature("admin_setup")
        ? [
            {
              description: "Complete the admin setup flow.",
              group: "Administration",
              href: "/admin-setup",
              icon: adminItems[1]?.icon ?? employeeItems[0].icon,
              id: "/admin-setup",
              keywords: ["admin", "setup", "onboarding"],
              label: "Admin Setup",
            } satisfies CommandEntry,
          ]
        : []),
    ];

    return [...quickActions, ...navigation];
  }, [hasFeature, onRequestLeave]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey) && !isEditableTarget(event.target)) {
        event.preventDefault();
        onOpenChange(!open);
      }
    };

    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [onOpenChange, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    void track(
      "command_palette_opened",
      { source_path: location.pathname },
      { path: location.pathname, surface: "authenticated-shell" },
    );
  }, [location.pathname, open, track]);

  const runCommand = useCallback((command: () => void) => {
    onOpenChange(false);
    command();
  }, [onOpenChange]);

  const groupedEntries = entries.reduce<Record<string, CommandEntry[]>>((acc, entry) => {
    acc[entry.group] ??= [];
    acc[entry.group].push(entry);
    return acc;
  }, {});

  const handleSelect = (entry: CommandEntry) => {
    runCommand(() => {
      entry.onSelect?.();
      if (entry.href) {
        navigate(entry.href);
      }
    });

    void track(
      "command_palette_action_selected",
      { action_id: entry.id, action_label: entry.label, target_path: entry.href ?? null },
      { path: location.pathname, surface: "authenticated-shell" },
    );
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search navigation and actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groupedEntries).map(([group, groupEntries], index) => (
          <div key={group}>
            {index > 0 ? <CommandSeparator /> : null}
            <CommandGroup heading={group}>
              {groupEntries.map((entry) => {
                const Icon = entry.icon;
                return (
                  <CommandItem
                    key={entry.id}
                    className="flex items-center gap-2"
                    keywords={entry.keywords}
                    onSelect={() => handleSelect(entry)}
                    value={entry.label}
                  >
                    <Icon className="h-4 w-4" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span>{entry.label}</span>
                      <span className="truncate text-xs text-muted-foreground">{entry.description}</span>
                    </div>
                    {entry.shortcut ? <CommandShortcut>{entry.shortcut}</CommandShortcut> : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
};
