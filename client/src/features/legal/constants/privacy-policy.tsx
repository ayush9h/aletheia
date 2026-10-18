import Link from "next/link";

import type { LegalDocument } from "@/features/legal/types/legal.types";
import { SITE } from "@/lib/site";

const email = <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;

const PROVIDERS = [
  ["Groq", "Runs the AI models that write replies, plan tasks and title your chats", "Your messages, relevant memories and data fetched from connected apps"],
  ["Voyage AI and Pinecone", "Create and store long-term memory, when memory is on", "Notes derived from your conversations"],
  ["Tavily and SerpAPI", "Search the web when a reply needs current information", "Search queries"],
  ["GitHub and Slack", "Connected apps you choose to authorise", "Requests made with the access you granted"],
  ["PostHog", "Product analytics, only after you allow it", "Pages viewed, interactions, browser and device details"],
  ["Langfuse and Papertrail", "Monitoring, debugging and error logs", "Request traces and logs, which can include message content"],
  ["Vercel, PostgreSQL and Redis", "Hosting, storage and rate limiting", "All data the service stores"],
];

export const PRIVACY_POLICY: LegalDocument = {
  title: "Privacy Policy",
  updated: "October 18, 2026",
  intro: (
    <p>
      This policy explains what Aletheia collects when you use {new URL(SITE.url).host}, why, who
      processes it and the choices you have. Aletheia is an independent project based in {SITE.address}.
    </p>
  ),
  sections: [
    {
      id: "summary",
      title: "Summary",
      content: (
        <ul>
          <li>You sign in with GitHub or Google. We never see or store a password.</li>
          <li>Your chats are stored so you can return to them, and you can delete them at any time.</li>
          <li>Messages are sent to AI providers to generate replies. We do not use your conversations to train AI models.</li>
          <li>Analytics only run if you allow them in the cookie banner.</li>
          <li>We do not sell your personal information or use it for advertising.</li>
        </ul>
      ),
    },
    {
      id: "information-we-collect",
      title: "Information we collect",
      content: (
        <>
          <h3>Account information</h3>
          <p>
            When you sign in with GitHub or Google, we receive your name, email address, profile picture and account
            ID from that provider. They are kept in an encrypted session cookie, and your account ID is stored with your
            data so we can link it to you.
          </p>
          <h3>Conversations</h3>
          <p>
            Your messages, Aletheia&apos;s replies, the steps it took to answer, chat titles, pinned chats, and the time
            and tokens each reply used.
          </p>
          <h3>Personalisation and memory</h3>
          <p>
            The nickname, occupation, description, custom instructions and tone you set in Settings. When memory is on,
            Aletheia saves notes from your conversations to personalise future replies.
          </p>
          <h3>Connected apps</h3>
          <p>
            If you connect GitHub or Slack, we store your account ID, username and the access token that provider
            issues. Aletheia only reads data from these apps when a request needs it.
          </p>
          <h3>Usage and technical data</h3>
          <p>
            With your consent, PostHog records pages you view and how you use the app. Our servers also log technical
            details such as IP address and request metadata to keep the service secure and to enforce rate limits.
          </p>
        </>
      ),
    },
    {
      id: "how-we-use-it",
      title: "How we use your information",
      content: (
        <ul>
          <li>To provide the service: answer your messages, run tasks in connected apps and save your chats.</li>
          <li>To personalise replies using your settings and, if enabled, your memory.</li>
          <li>To keep Aletheia secure, prevent abuse and enforce fair usage limits.</li>
          <li>To find and fix bugs and understand which features are used, with your consent for analytics.</li>
          <li>To reply when you contact us.</li>
        </ul>
      ),
    },
    {
      id: "ai-processing",
      title: "AI and voice features",
      content: (
        <>
          <p>
            Aletheia sends your messages, relevant memories and data fetched from connected apps to Groq, which runs
            the AI models that produce replies. We do not use your conversations to train AI models. AI replies can be
            inaccurate, so check important information.
          </p>
          <p>
            Voice input uses your browser&apos;s built-in speech recognition, which some browsers process on their own
            servers under their own privacy terms. Read aloud runs entirely in your browser.
          </p>
        </>
      ),
    },
    {
      id: "service-providers",
      title: "Service providers",
      content: (
        <>
          <p>We share information only with the providers that run parts of Aletheia:</p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-stone-50 text-stone-900 dark:bg-stone-900 dark:text-stone-100">
                <tr>
                  <th className="px-4 py-3 font-semibold">Provider</th>
                  <th className="px-4 py-3 font-semibold">Purpose</th>
                  <th className="px-4 py-3 font-semibold">Data involved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                {PROVIDERS.map(([name, purpose, data]) => (
                  <tr key={name} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-stone-900 dark:text-stone-100">{name}</td>
                    <td className="px-4 py-3">{purpose}</td>
                    <td className="px-4 py-3">{data}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            We may also disclose information if the law requires it. We do not sell personal information or share it
            for advertising.
          </p>
        </>
      ),
    },
    {
      id: "cookies",
      title: "Cookies and local storage",
      content: (
        <>
          <ul>
            <li>
              <strong>Essential:</strong> your sign-in session, short-lived security cookies used while connecting an
              app, and your cookie choice.
            </li>
            <li>
              <strong>Analytics:</strong> PostHog cookies, set only after you choose Accept or turn on measurement.
            </li>
            <li>
              <strong>Local storage:</strong> your theme, accent colour and font, kept only in your browser.
            </li>
          </ul>
          <p>You can change your choice anytime in Settings → Data Controls → Privacy settings.</p>
        </>
      ),
    },
    {
      id: "retention",
      title: "Retention and deletion",
      content: (
        <ul>
          <li>Chats are kept until you delete them. You can delete one chat or all chats in Settings → Data Controls.</li>
          <li>Memory stops growing when you turn it off in Settings → Personalisation.</li>
          <li>Connected app tokens are kept until you reconnect the app or ask us to remove them.</li>
          <li>
            To delete your account and all associated data, email {email}. We complete deletion within 30 days, except
            where the law requires us to keep something.
          </li>
        </ul>
      ),
    },
    {
      id: "your-rights",
      title: "Your rights",
      content: (
        <>
          <p>
            Depending on where you live, including under India&apos;s Digital Personal Data Protection Act, 2023 and the
            EU GDPR, you can ask to access, correct or delete your personal data, withdraw consent, and nominate someone
            to act for you. EU residents can also object to processing, request a portable copy and complain to their
            data protection authority.
          </p>
          <p>Email {email} to make a request. We respond within 30 days.</p>
        </>
      ),
    },
    {
      id: "security",
      title: "Security",
      content: (
        <p>
          Data is encrypted in transit with HTTPS, access tokens stay on our servers and are never sent to your browser,
          and access to our systems is restricted. No online service is completely secure. If a breach affects your
          data, we will notify you and the relevant authorities without undue delay.
        </p>
      ),
    },
    {
      id: "international-transfers",
      title: "International transfers",
      content: (
        <p>
          Our providers may process data outside India, including in the United States and the European Union. Where
          required, we rely on safeguards such as standard contractual clauses.
        </p>
      ),
    },
    {
      id: "children",
      title: "Children",
      content: (
        <p>
          Aletheia is not intended for anyone under 13. Users under 18 should use it only with a parent or guardian&apos;s
          permission. If you believe a child has given us personal data, contact us and we will delete it.
        </p>
      ),
    },
    {
      id: "changes",
      title: "Changes to this policy",
      content: (
        <p>
          We will update the date above whenever this policy changes, and highlight significant changes in the app.
          Also see our <Link href="/terms">Terms of Service</Link>.
        </p>
      ),
    },
    {
      id: "contact",
      title: "Contact and grievances",
      content: (
        <p>
          For privacy questions, requests or grievances, email {email}. Aletheia, {SITE.address}.
        </p>
      ),
    },
  ],
};
