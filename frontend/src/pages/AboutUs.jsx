import React from "react";
import { Link } from "react-router-dom";

export default function AboutUs() {
  return (
    <section className="w-full max-w-4xl mx-auto bg-white border border-gray-200 rounded-2xl px-6 md:px-12 py-10 mt-0 shadow-lg flex flex-col items-center text-center">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-indigo-600 mb-6">
        About Us
      </h1>

      <p className="text-gray-700 text-lg leading-relaxed max-w-2xl mb-10">
        <strong>Java Daily</strong> is your go-to platform for mastering Java-based
        Data Structures and Algorithms (DSA). Whether you're preparing for interviews,
        acing college exams, or building a solid foundation in programming, we aim to make
        your learning journey consistent, simple, and effective — one question at a time.
      </p>

      <div className="w-full text-left mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">🚀 Tech Stack</h2>
        <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
          <li><strong>MERN Stack:</strong> MongoDB, Express.js, React, Node.js</li>
          <li><strong>Tailwind CSS:</strong> Sleek, responsive, and utility-first design</li>
          <li><strong>Deployment:</strong> Vercel for Frontend & Render for Backend</li>
        </ul>
      </div>

      <div className="w-full text-left mb-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">👥 Our Team</h2>
        <p className="text-gray-700">
          Built with passion by <strong>Reeshmanth</strong> and <strong>Sathvik</strong>.{" "}
          We're always open to suggestions, collaborations, and feedback —{" "}
          <Link
            to="/contact"
            className="text-indigo-600 hover:underline font-medium"
          >
            feel free to reach out!
          </Link>
        </p>
      </div>

      <div className="text-gray-400 text-sm mt-6">
        &copy; {new Date().getFullYear()} Java Daily. All rights reserved.
      </div>
    </section>
  );
}
