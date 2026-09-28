"use client";

import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

export type HelpTopic = {
  id: string;
  title: string;
  blurb: string;
  questions: { id: string; question: string; answer: string }[];
};

// ponytail: answers are plain strings so search can read them; the one bit of
// markup they need is a link, written `[label](/href)`.
const LINK = /\[(.+?)\]\((.+?)\)/g;

function Answer({ text }: { text: string }) {
  // Two capture groups, so split yields text, label, href, text, …
  const parts = text.split(LINK);
  return (
    <p>
      {parts.map((part, i) =>
        i % 3 === 0 ? part : i % 3 === 1 ? <Link key={i} href={parts[i + 1]}>{part}</Link> : null,
      )}
    </p>
  );
}

/** Search over every question, topic cards while idle, then the questions by topic. */
export function HelpCenter({ topics }: { topics: HelpTopic[] }) {
  const [query, setQuery] = useState("");
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const shown = topics.map((topic) => ({
    ...topic,
    questions: topic.questions.filter(({ question, answer }) => {
      const text = `${question} ${answer.replace(LINK, "$1")}`.toLowerCase();
      return words.every((word) => text.includes(word));
    }),
  }));
  const matches = shown.reduce((sum, topic) => sum + topic.questions.length, 0);

  return (
    <>
      <div
        role="search"
        className="mx-auto mt-8 flex h-12 w-full max-w-md items-center gap-3 rounded-full bg-foreground/5 px-4 ring-1 ring-foreground/10 focus-within:ring-2 focus-within:ring-foreground"
      >
        <SearchIcon aria-hidden="true" className="size-5 shrink-0 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          aria-label="Search questions"
          className="h-12 min-w-0 rounded-none border-0 bg-transparent px-0 text-base shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
        />
      </div>
      <p role="status" className="sr-only">
        {words.length > 0 && `${matches} matching question${matches === 1 ? "" : "s"}`}
      </p>

      {words.length === 0 && (
        <nav aria-label="Topics" className="mt-12">
          <ul className="grid gap-4 sm:grid-cols-3">
            {topics.map(({ id, title, blurb, questions }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="flex h-full flex-col rounded-xl border p-5 outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-foreground"
                >
                  <span className="text-sm font-semibold tracking-wide uppercase">{title}</span>
                  <span className="mt-1 text-sm text-muted-foreground">{blurb}</span>
                  <span className="mt-auto pt-4 font-mono text-xs text-muted-foreground">
                    {questions.length} question{questions.length === 1 ? "" : "s"}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {shown.map(({ id, title, questions }) =>
        questions.length === 0 ? null : (
          <section key={id} id={id} aria-labelledby={`${id}-heading`} className="mt-12 scroll-mt-28">
            <h2 id={`${id}-heading`} className="text-2xl font-semibold tracking-tight">
              {title}
            </h2>
            <Accordion className="mt-4 border-t">
              {questions.map(({ id: value, question, answer }) => (
                <AccordionItem key={value} value={value} className="border-b">
                  <AccordionTrigger className="py-5 text-base sm:text-lg">{question}</AccordionTrigger>
                  <AccordionContent className="pb-5 text-base leading-7 text-muted-foreground">
                    <Answer text={answer} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        ),
      )}

      {words.length > 0 && matches === 0 && (
        <p className="mt-12 text-center text-muted-foreground">
          No questions match “{query.trim()}”.
        </p>
      )}
    </>
  );
}
