import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots{

    const baseUrl="https://www.ayuar.dev/aletheia"
    return {
        rules:[
            {
            userAgent:"*",
            allow:"/",
            disallow:["/privacy/", "/terms"]
            }
        ],
        sitemap:`${baseUrl}/sitemap.xml`
    }
}