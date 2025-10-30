import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({
      message: "Logout successful",
      success: true,
    });

    // Set the token cookie to an empty value with an immediate expiration date
    response.cookies.set("token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}