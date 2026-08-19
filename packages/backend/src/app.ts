import { config } from "dotenv";
import { Elysia, t } from "elysia";
import { prisma } from "./db/prismaClient";
import { apiLogger, dbLogger } from "./tools/logger";

config({ path: new URL("../.env", import.meta.url).pathname });

try {
	await prisma.$connect();
	dbLogger.info("Database connection OK");
} catch (error) {
	dbLogger.error({ err: error }, "Failed to connect to the database");
}

const app = new Elysia()
	.onRequest(({ request }) => {
		apiLogger.info(
			{ method: request.method, path: new URL(request.url).pathname },
			"incoming request",
		);
	})
	.get("/", () => "Hello Elysia")

	.get("/users", async ({ status }) => {
		try {
			const result = await prisma.user.findMany();
			if (!result?.length) {
				return status(404, { message: "User not found " });
			}
			return result;
		} catch (error) {
			dbLogger.error({ err: error }, "Failed to fetch users");
			return status(500, { message: "Internal server error" });
		}
	})
	.get("/user/:id", async ({ params: { id }, status }) => {
		const result = await prisma.user.findFirst({
			where: {
				id: parseInt(id, 10),
			},
			include: {
				posts: {
					include: {
						tags: true,
					},
				},
			},
		});
		if (!result) {
			return status(404, { message: "User not found " });
		}
		return result;
	})
	.get("/user/:id/posts", async ({ params: { id }, status }) => {
		const posts = await prisma.post.findMany({
			where: {
				authorId: parseInt(id, 10),
			},
			include: {
				tags: true,
			},
		});
		if (!posts.length) {
			return status(404, { message: "Posts not found " });
		}
		return posts;
	})
	.get("/posts", async ({ status }) => {
		const result = await prisma.post.findMany({
			include: {
				tags: true,
				author: true,
			},
		});
		if (!result?.length) {
			return status(404, { message: "Posts not found " });
		}
		return result;
	})
	.get("/post/:id", async ({ params: { id }, status }) => {
		const post = await prisma.post.findUnique({
			where: {
				id: parseInt(id, 10),
			},
			include: {
				tags: true,
			},
		});
		if (!post) {
			return status(404, { message: "Post not found " });
		}
		return post;
	})
	.post(
		"/tag-connect",
		async ({ body, status }) => {
			const result = await prisma.tag
				.update({
					data: {
						posts: {
							connect: body.postIds.map((id) => ({ id: parseInt(id, 10) })),
						},
					},
					where: {
						id: body.tagId,
					},
					select: {
						name: true,
						id: true,
					},
				})
				.catch((error) => {
					dbLogger.error(
						{ err: error, tagId: body.tagId },
						"Failed to connect tag to posts",
					);
					return status(400, "Bad req");
				});
			if (!result) {
				return status(400, "Bad req");
			}
			// Example event log: structured fields land as Loki labels/fields
			// alongside the message, queryable in Grafana Explore.
			apiLogger.info(
				{ event: "tag.connected", tagId: body.tagId, postIds: body.postIds },
				"Tag connected to posts",
			);
			return result;
		},
		{
			body: t.Object({
				tagId: t.Number(),
				postIds: t.Array(t.String()),
			}),
		},
	)
	.get("/tags", async ({ status }) => {
		const tags = await prisma.tag.findMany({});
		if (!tags?.length) {
			return status(404, { message: "Tags not found " });
		}
		return tags;
	})
	.get("/tag/:id", async ({ params: { id }, status }) => {
		const tag = await prisma.tag.findUnique({
			where: {
				id: parseInt(id, 10),
			},
			include: {
				posts: {
					select: {
						title: true,
					},
				},
			},
		});
		if (!tag) {
			return status(404, { message: "Tag not found " });
		}
		return tag;
	})
	.listen(3000);

apiLogger.info(
	{ hostname: app.server?.hostname, port: app.server?.port },
	"Carrer Manager Backend is running",
);
