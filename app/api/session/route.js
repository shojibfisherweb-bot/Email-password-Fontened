// app/api/session/route.js
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get("admin_session");

        if (session && session.value === "authenticated") {
            return NextResponse.json({
                status: "success",
                authenticated: true,
            });
        }

        return NextResponse.json({
            status: "unauthorized",
            authenticated: false,
        });
    } catch (error) {
        console.error("Session check error:", error);
        return NextResponse.json({
            status: "error",
            authenticated: false,
            message: "Session check failed",
        }, { status: 500 });
    }
}