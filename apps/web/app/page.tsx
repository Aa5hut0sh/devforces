"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { GridScan } from "@/components/background";
import Link from "next/link";

export default function RootPage() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Optional: If you want to auto-redirect authenticated users to the contests page
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     router.push("/contests");
  //   }
  // }, [isAuthenticated, router]);

  return (
    <main className="relative min-h-screen bg-[#09050d] overflow-hidden flex flex-col items-center justify-center">
      
      {/* Background Layer: GridScan */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <GridScan
          sensitivity={0.55}
          lineThickness={1}
          linesColor="#2F293A"
          gridScale={0.1}
          scanColor="#FF9FFC"
          scanOpacity={0.4}
          enablePost
          bloomIntensity={0.6}
          chromaticAberration={0.002}
          noiseIntensity={0.01}
          lineJitter={0.1}
          scanGlow={0.5}
          scanSoftness={2}
          enableWebcam={false}
          showPreview={false}
        />
      </div>

      {/* Hero Content Layer */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl w-full">
        
        {/* Version Badge */}
        <div className="bg-[#1a1122]/80 border border-[#4d2562]/50 rounded-full pl-1.5 pr-4 py-1.5 flex items-center gap-3 mb-8 backdrop-blur-md shadow-lg">
          <span className="text-sm font-medium ml-2 text-zinc-300">
              Build fast. Ship faster.
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-10 leading-[1.1]">
          Hold on, scanning for <br /> developers who build.
        </h1>

        {/* Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/contests"
            className="w-full sm:w-auto bg-white text-black px-8 py-3.5 rounded-xl font-semibold hover:bg-zinc-200 transition-colors active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            Get started
          </Link>
          
        </div>
      </div>
    </main>
  );
}