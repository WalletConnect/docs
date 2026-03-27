---
name: walletconnect-pay-docs-writing
description: Write and review documentation for WalletConnect Pay products using Mintlify. Use when writing docs, creating SDK guides, writing overview pages, reviewing documentation, or when the user mentions docs, documentation, Mintlify, or technical writing for this project.
---

# WalletConnect Pay Documentation Writing

## Voice and Tone

- **Always use "WalletConnect Pay"** as the subject — never first-person ("we", "our", "us").
- Be concise and direct. Avoid vague language ("stuff", "things", "various", "etc.").
- Use active voice. Write for a technical audience but remain accessible.

## Page Structure

Every `.mdx` file must begin with frontmatter. **Never use H1 (`#`)** — the title comes from frontmatter.

```mdx
---
title: "WalletConnect Pay"
description: "Overview of WalletConnect Pay, a universal protocol for blockchain-based payment requests."
sidebarTitle: "Introduction"
---
```

| Field | Required | Notes |
|-------|----------|-------|
| `title` | Yes | Full page title, used for SEO |
| `description` | Yes | 1-2 sentence summary for SEO |
| `sidebarTitle` | Recommended | Simple, jargon-free label (e.g. "Kotlin" not "Kotlin SDK Implementation Guide") |

### Heading Hierarchy

- **H2 (`##`)**: Major sections
- **H3 (`###`)**: Subsections within H2
- **H4 (`####`)**: Sparingly, within H3
- **Never use bold text as a substitute for headings**

## Components and Templates

For Mintlify component usage (callouts, steps, cards, code groups, accordions, mermaid diagrams) and page templates (overview pages, SDK docs), see [references/components.md](references/components.md).

## Code Blocks

- Always specify language for syntax highlighting
- Include a title (becomes filename display)
- Keep code focused — show only relevant code
- Use realistic placeholder values (`"your-api-key"`, not `"abc123"`)

## Quality Checklist

Before publishing, verify:

- Frontmatter has `title`, `description`, and `sidebarTitle`
- No H1 in body; proper heading hierarchy (H2 → H3 → H4)
- No first-person pronouns referring to WalletConnect
- Code blocks have language and title
- `<CodeGroup>` for multi-platform examples
- `<Steps>` for sequential processes
- `<AccordionGroup>` for FAQs
- Callouts use appropriate types
- Mermaid diagrams for complex flows
