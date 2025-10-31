import type { Route } from "./+types/home";
import { useUser, useClerk } from "@clerk/clerk-react";
import { Link } from "react-router";
import "./home.css";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "Job App Tracker" },
		{ name: "description", content: "Track your job applications." },
	];
}

export default function Home() {
	const { isSignedIn } = useUser() ?? { isSignedIn: false };
	const signedIn = Boolean(isSignedIn);
	const clerk = useClerk?.() ?? null;

	async function handleSignOut() {
		try {
			await clerk?.signOut();
		} catch {
			// ignore
		} finally {
			if (typeof window !== "undefined") {
				window.location.href = "/";
			}
		}
	}

	return (
		<>
			{/* content area (main background moved to layout); this section centers content and takes most of the page */}
			<section className="max-w-5xl mx-auto py-12 min-h-[64vh] flex flex-col justify-center home-content">
				<div className="text-center py-4">
					<h1 className="text-4xl font-bold text-gray-900">Welcome to JobApp</h1>
					<p className="mt-2 text-gray-700">A simple job application tracker</p>
				</div>

				{/* three centered boxes for the feature bullets */}
				<div className="flex justify-center mt-8">
					<div className="flex flex-col md:flex-row gap-6">
						<div className="bg-white p-6 rounded shadow w-64 flex items-start">
							<div>
								<h3 className="font-semibold mb-2 text-gray-900">Track Applications</h3>
								<p className="text-sm text-gray-700">• Track applications by status</p>
							</div>
						</div>
						<div className="bg-white p-6 rounded shadow w-64 flex items-start">
							<div>
								<h3 className="font-semibold mb-2 text-gray-900">Job Details</h3>
								<p className="text-sm text-gray-700">• Add skills and company info</p>
							</div>
						</div>
						<div className="bg-white p-6 rounded shadow w-64 flex items-start">
							<div>
								<h3 className="font-semibold mb-2 text-gray-900">Move Stages</h3>
								<p className="text-sm text-gray-700">• Move applications between stages</p>
							</div>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
