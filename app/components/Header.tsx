import { useEffect, useState } from "react";
import { Navbar } from "./Navbar";
import "./header.css";

export function Header({ title }: { title?: string }) {
	// Avoid reading document.title during render (causes server/client mismatch).
	// Use the provided title or a stable fallback for server + first client render,
	// then update with document.title after mount.
	const fallback = title || "JobApp";
	const [clientTitle, setClientTitle] = useState<string | undefined>(undefined);
	useEffect(() => {
		if (typeof window !== "undefined") {
			setClientTitle(document.title || fallback);
		}
	}, [fallback]);
	const pageTitle = clientTitle ?? fallback;

	return (
		<header className="w-full app-header">
			<div className="w-full bg-blue-900 text-white">
				<div className="container mx-auto p-6">
					<h1 className="text-2xl font-bold">{pageTitle}</h1>
				</div>
			</div>

			<Navbar />
		</header>
	);
}
