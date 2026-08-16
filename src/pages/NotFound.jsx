import { Link } from "react-router-dom";
import { ArrowLeft, Home, SearchX } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-bg text-text-primary flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-surface flex items-center justify-center">
            <SearchX className="w-10 h-10 text-primary" />
          </div>
        </div>

        <p className="text-primary font-bold text-sm uppercase tracking-widest mb-3">
          Error 404
        </p>

        <h1 className="text-5xl md:text-6xl font-extrabold text-text-primary mb-4">
          Page Not Found
        </h1>

        <p className="text-text-secondary text-base md:text-lg leading-relaxed mb-8">
          Sorry, we couldn't find the page you're looking for. It may have
          been moved, deleted, or the URL might be incorrect.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-bold hover:opacity-90 transition-opacity"
          >
            <Home className="w-5 h-5" />
            Back to Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-surface text-text-primary font-semibold hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;