import { useEffect, useState } from "react";
import { apiUtils } from "../services/api.js";

type ApiStatus = "Checking..." | "✅ Connected" | "❌ Disconnected";

export const Home = (): JSX.Element => {
  const [apiStatus, setApiStatus] = useState<ApiStatus>("Checking...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkApi = async (): Promise<void> => {
      try {
        const response = await apiUtils.get<unknown>("/health");
        if (response.success) {
          setApiStatus("✅ Connected");
        } else {
          setApiStatus("❌ Disconnected");
        }
      } catch {
        setApiStatus("❌ Disconnected");
      } finally {
        setLoading(false);
      }
    };

    checkApi();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🚀 HireLynk
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Modern Recruitment &amp; Applicant Tracking System
          </p>
          <p className="text-gray-500">Version 1.0.0 (Foundation)</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            System Status
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <span className="text-gray-700">Frontend</span>
              <span className="text-green-600 font-semibold">✅ Running</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <span className="text-gray-700">Backend API</span>
              <span className={`font-semibold ${loading ? "text-yellow-600" : ""}`}>
                {loading ? "🔄 Checking..." : apiStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-2">👥</div>
            <h3 className="font-semibold text-gray-900 mb-2">For Candidates</h3>
            <p className="text-sm text-gray-600">
              Browse jobs, apply, and track your applications
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-2">💼</div>
            <h3 className="font-semibold text-gray-900 mb-2">For Recruiters</h3>
            <p className="text-sm text-gray-600">
              Post jobs, manage applications, and hire talent
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-3xl mb-2">⚙️</div>
            <h3 className="font-semibold text-gray-900 mb-2">For Admins</h3>
            <p className="text-sm text-gray-600">
              Monitor platform, manage users, and view analytics
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">Phase 1: Foundation</h3>
          <p className="text-sm text-blue-800 mb-3">
            This is the foundation phase. Core infrastructure is ready:
          </p>
          <ul className="text-sm text-blue-800 text-left space-y-1 mb-3">
            <li>✅ Frontend setup (React + Vite + Tailwind)</li>
            <li>✅ Backend setup (Express + TypeScript)</li>
            <li>✅ API client configuration</li>
            <li>✅ Error handling &amp; logging</li>
            <li>✅ Security (CORS, Helmet, Rate limiting)</li>
            <li>✅ Health check endpoint</li>
          </ul>
          <p className="text-xs text-blue-700 italic">
            Phase 2 will add authentication, database, and core features
          </p>
        </div>

        <div className="mt-12 space-y-4">
          <p className="text-sm text-gray-600">API Endpoints:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="http://localhost:5000/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              GET /api/health
            </a>
            <span className="text-gray-400">•</span>
            <a
              href="http://localhost:5000/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              GET /api
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};