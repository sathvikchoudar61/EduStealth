import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="w-full max-w-2xl mx-auto bg-white border border-[#e5e7eb] rounded-xl px-4 md:px-8 py-12 mt-12 shadow-lg flex flex-col items-center justify-center">
      <h1 className="text-5xl sm:text-6xl font-extrabold text-[#5b5be6] mb-4 animate-bounce">404</h1>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">Page Not Found</h2>
      <p className="text-gray-500 mb-8 text-center max-w-md">
        Oops! The page you are looking for does not exist or has been moved.<br />
        Let's get you back to where you belong.
      </p>
      <Link
        to="/"
        className="px-6 py-3 rounded-lg bg-[#5b5be6] text-white font-semibold shadow-md hover:bg-[#4343b9] transition-colors duration-200"
      >
        Go Home
      </Link>
      <div className="mt-12 opacity-60">
        <svg width="120" height="120" fill="none" viewBox="0 0 120 120">
          <ellipse cx="60" cy="100" rx="40" ry="8" fill="#cbd5e1" />
          <circle cx="60" cy="60" r="40" fill="#5b5be6" fillOpacity="0.08" />
          <circle cx="60" cy="60" r="30" fill="#5b5be6" fillOpacity="0.13" />
          <circle cx="60" cy="60" r="20" fill="#5b5be6" fillOpacity="0.18" />
        </svg>
      </div>
    </section>
  );
} 