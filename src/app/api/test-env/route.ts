import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Environment Variables Test",
    envVars: {
      DATABASE_URL: process.env.DATABASE_URL || "NOT SET",
      ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY || "NOT SET",
      NODE_ENV: process.env.NODE_ENV || "NOT SET",
    },
    allEnvKeys: Object.keys(process.env).filter(key => 
      key.includes('DATABASE') || 
      key.includes('ETHERSCAN') || 
      key.includes('NODE_ENV')
    ),
    timestamp: new Date().toISOString()
  });
} 