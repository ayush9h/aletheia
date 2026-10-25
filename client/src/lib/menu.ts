// Shared look for dropdown menus (sidebar chat options, account, chat input tools and models)
export const MENU_CONTENT =
  "font-paragraph rounded-xl border-stone-200 p-1.5 shadow-lg shadow-stone-900/5 dark:border-stone-700/60 dark:bg-stone-900 dark:shadow-black/40";

export const MENU_ITEM =
  "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-stone-700 focus:bg-stone-100 focus:text-stone-900 dark:text-stone-200 dark:focus:bg-stone-800 dark:focus:text-stone-100 [&_svg]:text-stone-500 dark:[&_svg]:text-stone-400";

// Pair with variant="destructive", which colours the text and icon red
export const MENU_ITEM_DANGER =
  "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm";

export const MENU_SEPARATOR = "-mx-1.5 my-1.5 bg-stone-200 dark:bg-stone-700/60";

// For SelectItem: leaves room on the right for its check indicator, tinted with the accent
export const MENU_SELECT_ITEM =
  "cursor-pointer rounded-lg py-2 pl-2.5 pr-8 text-sm text-stone-700 focus:bg-stone-100 focus:text-stone-900 dark:text-stone-200 dark:focus:bg-stone-800 dark:focus:text-stone-100 [&_svg]:!text-brand-600 dark:[&_svg]:!text-brand-400";

export const MENU_LABEL =
  "flex items-center gap-2 px-2.5 pb-1 pt-2 text-xs font-medium text-stone-500 dark:text-stone-400";
