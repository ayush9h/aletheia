import { NextRequest } from "next/server";

import { handlers } from "@/auth";
import { BASE_PATH } from "@/lib/site";

const withBasePath =
  (handler: (req: NextRequest) => Promise<Response>) => (req: NextRequest) => {
    const url = new URL(req.url);
    if (!url.pathname.startsWith(`${BASE_PATH}/`)) url.pathname = `${BASE_PATH}${url.pathname}`;
    return handler(new NextRequest(url, req));
  };

export const GET = withBasePath(handlers.GET);
export const POST = withBasePath(handlers.POST);
