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
			const drupalApiUrl = `https://www.drupal.org/api-d7/user/${userId}.json`;
			const response = await fetch(drupalApiUrl);

			if (!response.ok) {
				throw new Error(`Failed to fetch Drupal.org data (Status: ${response.status})`);
			}

			const data = await response.json();

			return new Response(JSON.stringify(data, null, 2), {
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
