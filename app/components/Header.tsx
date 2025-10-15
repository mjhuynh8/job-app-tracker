import { Navbar } from "./Navbar";
import "./header.css";

export function Header({ title }: { title?: string }) {
	const pageTitle =
		typeof window !== "undefined"
			? document.title || title || "JobApp"
			: title || "JobApp";

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
