import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap{
    const baseUrl = "https://www.ayuar.dev/aletheia"
    return [
        {url:baseUrl, lastModified:new Date(), changeFrequency:"weekly", priority:1,},
        {url:`${baseUrl}/chat`, lastModified:new Date(), changeFrequency:"weekly", priority:2}
    ]
}