import { defineConsentConfig } from "c15t/next";
import {posthog} from "@c15t/integrations/posthog"


export default defineConsentConfig({
    scripts:[
        posthog({
            id: process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN as string,
            initOptions:{cookieless_mode: 'never'},
            loadMode:"after-consent"
        })
    ]  
})