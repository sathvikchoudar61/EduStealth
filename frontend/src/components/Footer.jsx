import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 py-6 px-4 md:px-16 text-gray-600 text-sm mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>&copy; {new Date().getFullYear()} Java Daily. All rights reserved.</div>
        <div className="flex items-center gap-6">
          <Link to="/about" className="hover:text-indigo-600 transition-colors">
            About Us
          </Link>

          <a
            href="mailto:someone@example.com"
            className="hover:text-indigo-600 transition-colors"
            aria-label="Contact Us"
          >
            Contact Us
          </a>

          <a
            href="https://t.me/+e6mXyaTQ_X03YWY1"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-indigo-600 transition-colors"
            aria-label="Telegram"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9.036 16.569l-.396 3.724c.568 0 .814-.244 1.112-.537l2.664-2.523 5.522 4.033c1.012.558 1.73.264 1.98-.937l3.594-16.84c.327-1.513-.547-2.104-1.527-1.74L2.16 9.197c-1.48.576-1.463 1.396-.253 1.77l4.59 1.434 10.646-6.7c.5-.326.96-.145.583.181z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
