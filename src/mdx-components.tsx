import type { ComponentProps, ComponentType } from "react";

type MDXComponents = Record<string, ComponentType<any>>;

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children, ...props }: ComponentProps<"h1">) => (
      <h1
        className="font-[var(--font-display)] text-3xl tracking-[0.12em] text-[var(--foreground)] sm:text-4xl"
        {...props}
      >
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: ComponentProps<"h2">) => (
      <h2
        className="mt-10 font-[var(--font-display)] text-2xl tracking-[0.12em] text-[var(--foreground)]"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: ComponentProps<"h3">) => (
      <h3
        className="mt-6 font-[var(--font-display)] text-xl tracking-[0.1em] text-[var(--foreground)]"
        {...props}
      >
        {children}
      </h3>
    ),
    p: ({ children, ...props }: ComponentProps<"p">) => (
      <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }: ComponentProps<"ul">) => (
      <ul className="mt-3 grid gap-2 text-sm text-[var(--muted)]" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: ComponentProps<"ol">) => (
      <ol className="mt-3 grid gap-2 text-sm text-[var(--muted)]" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: ComponentProps<"li">) => (
      <li className="rounded-xl border border-white/10 bg-white/5 px-3 py-2" {...props}>
        {children}
      </li>
    ),
    a: ({ children, ...props }: ComponentProps<"a">) => (
      <a className="text-[var(--foreground)] underline underline-offset-4" {...props}>
        {children}
      </a>
    ),
    strong: ({ children, ...props }: ComponentProps<"strong">) => (
      <strong className="text-[var(--foreground)]" {...props}>
        {children}
      </strong>
    ),
    code: ({ children, ...props }: ComponentProps<"code">) => {
      const className = typeof props.className === "string" ? props.className : "";
      const isBlock = className.includes("language-");

      if (isBlock) {
        return (
          <code
            className={`block min-w-0 text-[13px] text-[var(--foreground)] ${className}`}
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <code
          className="rounded border border-white/10 bg-white/10 px-1.5 py-0.5 text-[13px] text-[var(--foreground)]"
          {...props}
        >
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }: ComponentProps<"pre">) => (
      <pre
        className="mt-4 w-full max-w-full min-w-0 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-[var(--foreground)] [-webkit-overflow-scrolling:touch]"
        {...props}
      >
        {children}
      </pre>
    ),
    blockquote: ({ children, ...props }: ComponentProps<"blockquote">) => (
      <blockquote
        className="mt-4 border-l-2 border-[var(--accent)]/60 pl-4 text-sm text-[var(--muted)]"
        {...props}
      >
        {children}
      </blockquote>
    ),
    ...components,
  };
}
