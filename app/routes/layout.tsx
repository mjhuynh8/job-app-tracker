import { Outlet } from "react-router";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

export default function Layout() {
	return (
		<div className="min-h-screen flex flex-col">
			<Header />
			{/* main content area gets the light-green background so header/nav remain distinct */}
			<main className="flex-1 bg-green-100">
				<div className="container mx-auto p-4 pt-6 min-h-0">
					<Outlet />
				</div>
			</main>
			<Footer />
		</div>
	);
}
