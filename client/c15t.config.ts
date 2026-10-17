import { defineConsentConfig, offline } from "c15t/next";
import {posthog} from "@c15t/integrations/posthog"


export default defineConsentConfig({
    mode: offline({
        policyRules: [
            { id: "world-opt-in", match: { isDefault: true }, model: "opt-in", prompt: "choice" },
        ],
    }),
    scripts:[
        posthog({
            id: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN as string,
            initOptions:{cookieless_mode: 'never'},
            loadMode:"after-consent"
        })
    ]  
})