import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";

export const GET = (request) => toNextJsHandler(getAuth()).GET(request);

export const POST = (request) => toNextJsHandler(getAuth()).POST(request);
