---
name: Aletheia
description: A calm, bookish AI assistant whose agents show their work.
colors:
  brand-blue: "oklch(54.6% 0.245 262.881)"
  brand-blue-deep: "oklch(48.8% 0.243 264.376)"
  brand-blue-bright: "oklch(62.3% 0.214 259.815)"
  brand-blue-soft: "oklch(70.7% 0.165 254.624)"
  brand-blue-wash: "oklch(93.2% 0.032 255.585)"
  brand-blue-night: "oklch(28.2% 0.091 267.935)"
  paper: "oklch(100% 0 0)"
  paper-warm: "oklch(98.5% 0.001 106.423)"
  stone-mist: "oklch(97% 0.001 106.424)"
  stone-line: "oklch(92.3% 0.003 48.717)"
  stone-line-strong: "oklch(86.9% 0.005 56.366)"
  stone-hint: "oklch(70.9% 0.01 56.259)"
  stone-quiet: "oklch(55.3% 0.013 58.071)"
  stone-body: "oklch(44.4% 0.011 73.639)"
  stone-ink: "oklch(26.8% 0.007 34.298)"
  stone-ink-deep: "oklch(21.6% 0.006 56.043)"
  night-surface: "oklch(21% 0.006 285.885)"
  night-floor: "oklch(14.1% 0.005 285.823)"
  danger: "oklch(57.7% 0.245 27.325)"
typography:
  wordmark:
    fontFamily: "Poiret One, sans-serif"
    fontSize: "4.25rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.06em"
  headline:
    fontFamily: "Bookerly, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 300
    lineHeight: 1
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Bookerly, Georgia, serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5rem
  nav:
    fontFamily: "Bookerly, Georgia, serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Bookerly, Georgia, serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1rem
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
  full: "9999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  6: "24px"
components:
  button-send:
    backgroundColor: "{colors.brand-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    size: "28px"
  button-send-hover:
    backgroundColor: "{colors.brand-blue-deep}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.stone-ink}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  button-destructive:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  composer:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.stone-ink-deep}"
    rounded: "{rounded.2xl}"
    typography: "{typography.body}"
  chip-tool:
    backgroundColor: "{colors.brand-blue-wash}"
    textColor: "{colors.brand-blue}"
    rounded: "{rounded.lg}"
    padding: "4px 8px"
    typography: "{typography.label}"
  pill-filter:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.stone-body}"
    rounded: "{rounded.full}"
    height: "32px"
    padding: "0 14px"
  pill-filter-active:
    backgroundColor: "{colors.brand-blue-wash}"
    textColor: "{colors.brand-blue-deep}"
  menu:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.xl}"
    padding: "6px"
  menu-item:
    textColor: "{colors.stone-ink}"
    rounded: "{rounded.lg}"
    padding: "8px 10px"
    typography: "{typography.body}"
  menu-item-focus:
    backgroundColor: "{colors.stone-mist}"
    textColor: "{colors.stone-ink-deep}"
---

# Design System: Aletheia

## Overview

**Creative North Star: "The Unconcealing"**

*Aletheia* is the Greek word for truth understood as unconcealment: something hidden being brought into the open. The interface takes that literally. At rest it is quiet and bookish: a serif reading face, warm paper-toned neutrals, generous calm space, and a single blue accent used sparingly. Its expressive moments come when something is *revealed*: the fractal tree growing on the login screen, the plan panel opening to show which agents are working, a step opening to show what it found. Decoration never competes with content; revelation is the decoration.

The product is a working tool, not a showcase. Density is moderate, patterns are familiar (a left rail, a centred conversation, a composer anchored at the bottom), and brand lives in precise details: the serif, the warm neutrals, the restraint of the accent, and honest status language. Light mode is warm stone on white; dark mode deliberately cools to neutral zinc rather than inverting the warmth.

**Key Characteristics:**
- A literary serif (Bookerly) for all reading text and UI chrome; a thin geometric display face (Poiret One) only for the wordmark.
- Warm stone neutrals in light mode, cool zinc in dark mode, mapped automatically.
- One brand accent, blue, carried by the `brand-*` scale and used for action and selection, never for decoration.
- Mostly flat surfaces; depth is soft and ambient, reserved for floating layers.
- Progressive disclosure as a brand act: details start collapsed and open on request.

## Colors

A warm, paper-and-ink neutral field with one confident blue accent.

### Primary
- **Aletheia Blue** (`brand-blue`, Tailwind `blue-600`): the action colour. It fills the send button, links, focus accents, switch tracks, the selected-model check and the consent banner's primary button. White text on it is the only approved pairing for filled controls.
- **Deep Aletheia Blue** (`brand-blue-deep`, `blue-700`): hover and pressed state for anything filled with Aletheia Blue, and text on Blue Wash for higher contrast.
- **Bright Aletheia Blue** (`brand-blue-bright`, `blue-500`): the wordmark colour on the login page, and the primary accent in dark mode.
- **Soft Blue** (`brand-blue-soft`, `blue-400`): accent text and links on dark surfaces.
- **Blue Wash** (`brand-blue-wash`, `blue-100`): tinted backgrounds for selected things: tool chips in the composer and the active connector filter pill.
- **Night Blue** (`brand-blue-night`, `blue-950`): the core of the radial glow behind the login fractal tree, and (at 50% opacity) the dark-mode version of Blue Wash.

### Neutral
- **Paper** (`paper`, white): the composer, dialogs, menus and the light-mode page.
- **Warm Paper** (`paper-warm`, `stone-50`): hover surfaces and dialog headers.
- **Stone Mist** (`stone-mist`, `stone-100`): the chat canvas (applied at 40% over Paper), menu-item focus, hover fills.
- **Stone Line** (`stone-line`, `stone-200`): default borders, dividers and menu separators.
- **Strong Stone Line** (`stone-line-strong`, `stone-300`): borders that need to read, such as outline buttons and focused fields.
- **Stone Hint** (`stone-hint`, `stone-400`): placeholder text and caret glyphs. Decorative-only weight; never use it for text people need to read.
- **Stone Quiet** (`stone-quiet`, `stone-500`): secondary text: the disclaimer, timestamps, menu labels, dialog descriptions.
- **Stone Body** (`stone-body`, `stone-600`): icons and quiet controls in the toolbar.
- **Stone Ink** (`stone-ink`, `stone-800`): assistant message text and menu items.
- **Deep Ink** (`stone-ink-deep`, `stone-900`): headings and the text you type.
- **Night Surface** (`night-surface`, `zinc-900`): dark-mode dialog bodies and menus.
- **Night Floor** (`night-floor`, `zinc-950`): dark-mode page, dialog headers and footers.
- **Danger** (`danger`): destructive buttons and destructive menu items only.

### Named Rules
**The One Accent Rule.** Blue is the only hue in the interface chrome. Everything else is stone. If a new screen needs a second colour to explain itself, the hierarchy is wrong.

**The Token-Only Rule.** Write `brand-*` and `stone-*`, never `blue-*` or `zinc-*`. Users can switch the accent to red, green or orange (`data-accent`), and dark mode remaps every `stone-*` to zinc; raw hues break both.

**The Any-Accent Rule.** Blue is the brand, but every new surface must also look right and stay readable with the red, green and orange accents. Check filled accent controls against all four.

## Typography

**Display Font:** Poiret One (with sans-serif fallback)
**Body Font:** Bookerly (with Georgia, serif fallback)
**Alternate Body Fonts:** Plus Jakarta Sans and OpenDyslexic, user-selectable in Settings through `data-font`

**Character:** A thin Art Deco display face for the name, set against a warm, highly readable book serif for everything else. The pairing reads like a well-set book: one elegant title, then patient text.

### Hierarchy
- **Wordmark** (400, 4.25rem rising to 5rem at `sm`, line-height 1, tracking -0.06em): the "aletheia" wordmark on the login and legal pages, in Bright Aletheia Blue. Nowhere else.
- **Headline** (300, 1.25rem, line-height 1, tracking -0.025em): page-level prompts such as "Log in to your account".
- **Body** (400, 14px, 24px leading): chat messages, dialog text, menu items. Messages are capped at a 48rem column.
- **Nav** (400, 15px): the sidebar.
- **Label** (500, 12px, 16px leading): menu group labels, chips, plan-panel status, metadata.

### Named Rules
**The Single Wordmark Rule.** Poiret One appears only as the wordmark. Headings and UI use the body family.

**The Real Weights Rule.** Poiret One ships one weight (400). Never apply bold to it; the browser fakes the weight. Bookerly ships regular, so treat `font-extralight` and `font-semibold` on it as approximations and prefer size and colour for emphasis.

**The User's Font Rule.** All reading text uses `font-paragraph`, never a hard-coded family, so the user's choice of Bookerly, Jakarta or OpenDyslexic is respected everywhere.

## Layout

The app is a two-column grid: the sidebar (16rem open, 4rem collapsed rail) and the chat. The sidebar starts closed. Below the `md` breakpoint (768px) the sidebar becomes an off-canvas drawer over a blurred scrim, closes when a chat is picked, and a single menu button opens it.

The conversation is a centred column (48rem max) with 16px side gutters. The composer sits in a slightly wider 56rem frame anchored at the bottom. In an empty chat the greeting, composer and starter prompts are vertically centred, and the composer glides to the bottom (400ms, `cubic-bezier(0.16, 1, 0.3, 1)`) after the first message. Messages fade out under a 2.5rem mask above the composer instead of clipping at a hard line.

Spacing follows Tailwind's 4px grid: 4 and 8px inside controls, 12px between messages, 16–24px between groups. Touch targets are at least 44px on phones; small visual controls get a larger invisible hit area rather than a larger visual size.

## Elevation & Depth

The system is flat by default. Surfaces separate through tone (Paper on Stone Mist) and hairline borders (Stone Line), not shadows. Shadows are soft, ambient and offset downward, and are reserved for things that float above the page.

### Shadow Vocabulary
- **Composer whisper** (`box-shadow: 0 1px 4px rgba(0,0,0,0.025)`): the only shadow on the main canvas, barely lifting the composer. Removed in dark mode.
- **Menu lift** (`shadow-lg` tinted `stone-900` at 5%; black at 40% in dark): dropdown menus.
- **Dialog lift** (`shadow-2xl` tinted `stone-900` at 10%; black at 50% in dark): the connectors dialog and other large modals.
- **Consent card** (`0 10px 30px -10px rgb(28 25 23 / 0.2)`): the cookie consent banner.

### Named Rules
**The Flat Canvas Rule.** Nothing on the chat canvas carries a shadow except the composer's whisper. Messages, the plan panel and starter prompts sit directly on the page.

## Shapes

Corners are gently rounded and grow with the size of the surface: 6–8px for small controls and inline code, 10px for icon buttons and chips, 14px for menus, 18px for the composer, and fully rounded only for filter pills and status dots. Borders are 1px hairlines. The base radius token is `--radius: 0.625rem` (10px); the `sm` to `2xl` steps derive from it.

## Components

### Buttons
Quiet until they matter.
- **Shape:** gently rounded (10px for the send button, 8px for text buttons).
- **Send:** a small 28px Aletheia Blue square with a white 14px arrow; Deep Aletheia Blue on hover; 50% opacity when there's nothing to send. While an answer streams it shows a white spinner at full opacity and cannot be pressed.
- **Outline:** Paper with a Strong Stone Line border and Stone Ink text, Stone Mist on hover. Used for Cancel and Retry.
- **Destructive:** Danger fill, white text, only inside a confirmation dialog. The "Danger zone" row button that opens it is an outline with red text.
- **Icon buttons:** 28–32px, Stone Body icon, Stone Mist fill on hover, no border.
- **Press:** every button nudges down 1px and scales to 98% when pressed (150ms ease-out).

### Chips
- **Tool chip:** Blue Wash background, Aletheia Blue 12px text, 10px corners, a small × to remove. Shows which agents are attached to the next message.
- **Filter pill:** fully rounded, 32px tall, Stone Body text, Stone Mist on hover; when active, Blue Wash with Deep Aletheia Blue text (dark: Night Blue at 50% with Soft Blue text).

### Inputs / Fields
- **Composer:** Paper, 18px corners, Stone Line border, the composer whisper shadow. 16px text on phones (prevents iOS zoom), 14px from `md`. Placeholder "Ask anything" in Stone Hint.
- **Focus:** the border darkens to Stone Hint with a 2px soft stone ring, shown for keyboard focus.
- **Text fields in Settings:** follow the same stone border and focus treatment.

### Menus
- **Style:** Paper, 14px corners, 6px padding, menu lift shadow. Items are 14px Bookerly with 10px corners; focus fills Stone Mist. Group labels use the Label style in Stone Quiet. All menus use the shared classes in `src/lib/menu.ts`.
- **Selection:** a check in Aletheia Blue, never a filled row.

### Navigation (Sidebar)
- **Style:** a translucent stone rail with a hairline right border; 15px Bookerly items with icons. Pinned and recent chats are collapsible groups. Each chat row's options button appears on hover, and is always visible on touch screens.
- **Mobile:** the off-canvas drawer described in Layout.

### Dialogs
- **Light:** Paper body, Warm Paper header.
- **Dark:** header and footer on Night Floor, body on Night Surface, borders at `stone-700` 50%.
- **Destructive confirmations:** a compact 24rem dialog with a question title ("Delete chat?"), a plain description that says the action can't be undone, and Cancel / Delete buttons.

### Plan Panel (signature component)
The clearest expression of "The Unconcealing". Above each assistant answer, a single 12px status line names what is happening in plain language ("Planning", "Web search", "2 steps in parallel", "Writing the answer"), with a pulsing dot and an elapsed time after 10 seconds. It opens into a hairline timeline of steps, each with a status glyph (pulse, check, cross). Finished steps offer "Show what it found", which reveals the agent's actual result in a Stone Mist well. It collapses once the answer arrives, but its summary line stays.

### Fractal Tree (signature component)
The login panel: a branching tree drawn into a radial Night Blue glow, growing slowly into view. It is a button ("Grow a new tree"), follows the accent colour, and renders fully grown with no motion when reduced motion is on.

## Do's and Don'ts

### Do:
- **Do** use `brand-*` for every accent and `stone-*` for every neutral, per The Token-Only Rule.
- **Do** keep blue for action and selection: the send button, links, checks, tool chips and active pills.
- **Do** use `font-paragraph` for all text except the wordmark.
- **Do** reveal detail progressively: collapsed by default, open on request, with honest plain-language status.
- **Do** give small controls a 44px touch area on phones through an invisible hit area, not a bigger visual.
- **Do** check new filled-accent controls against the red, green and orange accents, and in dark mode.
- **Do** honour reduced motion on every animation, as the tree and plan panel already do.

### Don't:
- **Don't** write `blue-*`, `zinc-*` or raw hex colours in components; they break accent switching and dark mode.
- **Don't** use solid black or `stone-900` fills for selected or active states; selection is Blue Wash with blue text.
- **Don't** add shadows to messages, cards or anything else on the chat canvas (The Flat Canvas Rule).
- **Don't** set Poiret One in bold or use it for headings.
- **Don't** use Stone Hint for text people need to read; it fails contrast.
- **Don't** introduce a second accent hue or gradient text for emphasis.
