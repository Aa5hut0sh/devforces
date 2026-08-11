"use client";

import { useState } from "react";
import Image from "next/image";
import { VscZoomIn, VscZoomOut, VscClose } from "react-icons/vsc";
import Dock from "@/components/Dock";

export default function AboutPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  
  // Panning (Dragging) State
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const sections = [
    {
      title: "System Architecture & Grading Pipeline",
      description: "DevForces operates on an asynchronous, event-driven pipeline. Submissions from the web editor are routed through an Nginx proxy to the API, which pushes a grading event to a Redis-backed BullMQ queue. A dedicated worker consumes this event, copies the boilerplate, and overlays the user's files to prepare the submission directory. It then spawns a sandboxed Node process, fires test cases against localhost, and writes the results to both Postgres and Redis.",
      imageSrc: "/Architecture.png",
      alt: "Overall Architecture Diagram",
    },
    {
      title: "Infrastructure & Sandboxing",
      description: "The Express API and grading worker run as pm2-managed processes on the host, while Postgres and Redis are containerized via Docker. The worker deliberately runs outside Docker because systemd-run requires direct cgroup access to enforce per-submission memory and CPU limits. Each grading job spawns an isolated Node process with MemoryMax=256MB and CPUQuota=50%, killed via SIGKILL after the challenge time limit expires. Port collisions between concurrent graders are avoided by reserving a free port before spawning and releasing it the moment the child process binds.",
      imageSrc: "/Infrastructure.png",
      alt: "Infrastructure Diagram",
    },
    {
      title: "Real-time Leaderboard with Dual Persistence",
      description: "To handle high concurrency during contests without data loss, scores use a dual-write system. When a score delta is computed, the worker updates a Redis sorted set for sub-100ms O(log N) ranking retrieval and publishes to a Pub/Sub channel to emit live Socket.io updates to the web client. Simultaneously, it upserts the Leaderboard table in Postgres; if Redis ever restarts, the API seamlessly restores the live state from this Postgres backup.",
      imageSrc: "/Leaderboard.png",
      alt: "Leaderboard Flow Diagram",
    },
    {
      title: "The Cumulative Unlock Mechanism",
      description: "DevForces tests real-world backend engineering by merging your code as you progress. Challenge 4 isn't graded in isolation; it is graded against a complete snapshot that includes the base boilerplate, plus your passing code from Challenge 1, Challenge 2, and Challenge 3. This means if your authentication middleware from Challenge 3 is subtly broken, your protected routes in Challenge 4 will fail integration testing by design.",
      imageSrc: "/Submission.png",
      alt: "Cumulative Unlock Flow Diagram",
    },
    {
      title: "Database Schema",
      description: "DevForces runs on a relational Postgres schema — User, Contest, Challenge, ContestToChallengeMapping, Submission, and Leaderboard — designed for high concurrency, with Redis as a cache and message broker for real-time updates. ContestToChallengeMapping decouples challenges from contests for flexible configuration, while Leaderboard is tuned for fast upserts. The core design choice is in Submission: each attempt stores files (just the user's diff) alongside fullFiles (a snapshot merging boilerplate + all previously passed challenges + the current attempt). The grading worker always runs on fullFiles, ensuring a runnable codebase and fully reproducible re-grades.",
      imageSrc: "/Database.png",
      alt: "Database Schema Diagram",
    },
  ];

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  
  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev - 0.5, 1);
      // Reset position to center when zoomed all the way out
      if (newZoom === 1) setPan({ x: 0, y: 0 });
      return newZoom;
    });
  };

  const closeImage = () => {
    setSelectedImage(null);
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  };

  // --- Drag & Drop Handlers for Panning ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const dockItems = [
    { icon: <VscZoomIn size={18} />, label: "Zoom In", onClick: handleZoomIn },
    { icon: <VscZoomOut size={18} />, label: "Zoom Out", onClick: handleZoomOut },
    { icon: <VscClose size={18} />, label: "Close", onClick: closeImage },
  ];

  return (
    <main className="min-h-screen bg-[#09050d] text-zinc-200 selection:bg-[#FF9FFC]/30 selection:text-white pb-24">
      {/* Header */}
      <header className="max-w-4xl mx-auto pt-24 px-6 mb-16">
        <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
          What makes DevForces different ?
        </h1>
        <p className="text-lg text-zinc-400 leading-relaxed max-w-2xl">
          Every competitive platform tests algorithmic thinking. None of them test what backend engineers actually do: build HTTP APIs that handle auth, validation, error cases, and chained requests. Here is how it works under the hood.
        </p>
      </header>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-6 space-y-24">
        {sections.map((section, index) => (
          <section key={index} className="flex flex-col gap-6">
            <div className="space-y-3 max-w-3xl">
              <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                <span className="text-[#FF9FFC] font-mono text-sm bg-[#FF9FFC]/10 px-2 py-1 rounded-md">
                  0{index + 1}
                </span>
                {section.title}
              </h2>
              <p className="text-zinc-400 leading-relaxed">
                {section.description}
              </p>
            </div>

            {/* Clickable Image Container */}
            <div
              onClick={() => setSelectedImage(section.imageSrc)}
              className="relative w-full aspect-video rounded-xl overflow-hidden cursor-zoom-in border border-[#2F293A] bg-[#1a1122]/50 hover:border-[#4d2562] transition-colors group"
            >
              <Image
                src={section.imageSrc}
                alt={section.alt}
                fill
                className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-white/5 transition-colors" />
            </div>
          </section>
        ))}
      </div>

      {/* Glassmorphic Pop-out Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#09050d]/90 backdrop-blur-xl transition-all"
          onClick={closeImage} // Clicking the background closes the modal
        >
          
          {/* Main Image Viewport (Hidden native scrollbars) */}
          <div className="relative w-[90vw] h-[80vh] flex items-center justify-center overflow-hidden">
            <div 
              className={`relative w-full h-full flex items-center justify-center transition-transform ${
                isDragging ? "duration-0" : "duration-200"
              } ease-out ${
                zoomLevel > 1 
                  ? isDragging ? "cursor-grabbing" : "cursor-grab" 
                  : "cursor-default"
              }`}
              style={{ 
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})` 
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={(e) => e.stopPropagation()} // Prevents dragging/clicking the image from closing the modal
            >
              <Image
                src={selectedImage}
                alt="Zoomed View"
                fill
                className="object-contain pointer-events-none select-none" // Prevents native drag-and-drop ghosting
                quality={100}
                priority
              />
            </div>
          </div>

          {/* Floating Dock Controls */}
          <div 
            className="absolute bottom-8 z-[60]"
            onClick={(e) => e.stopPropagation()} // Prevents clicking the dock from closing the modal
          >
            <Dock 
              items={dockItems}
              panelHeight={68}
              baseItemSize={50}
              magnification={70}
            />
          </div>
        </div>
      )}
    </main>
  );
}