import { JSDOM } from "jsdom";

export default {
	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const userId: string | null = url.searchParams.get("user_id");

		if (!userId) {
			return new Response(JSON.stringify({ error: "Missing user_id parameter" }), {
				headers: { "Content-Type": "application/json" },
				status: 400,
			});
		}

		try {
			// Drupal profile page URL
			const profileUrl = `https://www.drupal.org/user/${userId}`;

			// Fetch the profile page
			const response = await fetch(profileUrl, {
				headers: { "User-Agent": "Mozilla/5.0 (compatible; CloudflareWorker/1.0)" },
			});

			if (!response.ok) {
				throw new Error(`Failed to fetch Drupal.org profile page (Status: ${response.status})`);
			}

			// Parse the HTML using JSDOM
			const html = await response.text();
			const dom = new JSDOM(html);
			const document = dom.window.document;

			// Select the issue credit list
			const issueCredits: { project: string; project_url: string; issue_count: string; issue_url: string }[] = [];

			const issueElements = document.querySelectorAll(
				".view-issue-credit .view-content ul li"
			);

			issueElements.forEach((element) => {
				const projectElement = element.querySelector(
					".views-field-drupalorg-project-subtitle .field-content a"
				);
				const issueCountElement = element.querySelector(
					".views-field-nid .field-content a"
				);

				if (projectElement && issueCountElement) {
					issueCredits.push({
						project: projectElement.textContent?.trim() || "",
						project_url: `https://www.drupal.org${projectElement.getAttribute("href")}`,
						issue_count: issueCountElement.textContent?.trim() || "",
						issue_url: `https://www.drupal.org${issueCountElement.getAttribute("href")}`,
					});
				}
			});

			// Return the structured JSON response
			return new Response(JSON.stringify({ user_id: userId, issue_credits: issueCredits }, null, 2), {
				headers: { "Content-Type": "application/json" },
			});

		} catch (error) {
			return new Response(
				JSON.stringify({ error: (error as Error).message }),
				{
					headers: { "Content-Type": "application/json" },
					status: 500,
				}
			);
		}
	},
};
