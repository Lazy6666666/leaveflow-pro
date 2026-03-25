import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { AiFeedItem } from "./feedItems";

type AIActionFeedProps = {
  items: AiFeedItem[];
  onAskAi: (prompt: string) => void;
};

export function AIActionFeed({ items, onAskAi }: AIActionFeedProps) {
  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
            Wave 3
          </Badge>
          <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em]">
            AI action feed
          </Badge>
        </div>
        <div>
          <CardTitle className="text-2xl">Suggested next actions for your current role</CardTitle>
          <CardDescription className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Reuse the existing BALANCE AI assistant prompts, tools, and follow-through links without exposing actions outside the role scope already active in this session.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 xl:grid-cols-2">
        {items.map((item) => (
          <article key={item.id} className="flex h-full flex-col rounded-3xl border border-border/70 bg-card/60 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <item.icon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
              <Badge variant="outline" className="rounded-full">
                {item.roleLabel}
              </Badge>
            </div>

            <div className="mt-5 grid gap-3 rounded-2xl border border-dashed border-border bg-background/70 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Feed state</p>
                <p className="mt-2 text-sm font-medium text-foreground">{item.stateLabel}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Assistant signal</p>
                <p className="mt-2 text-sm font-medium text-foreground">{item.signal}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Prompt starter</p>
              <p className="mt-2 text-sm leading-6 text-foreground">{item.prompt}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button type="button" onClick={() => onAskAi(item.prompt)}>
                <Sparkles className="h-4 w-4" />
                Ask BALANCE AI
              </Button>
              <Button asChild variant="outline">
                <Link to={item.href}>
                  {item.hrefLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
