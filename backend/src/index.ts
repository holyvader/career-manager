import {Elysia, t, sse} from "elysia";
import {prisma} from "./prismaClient";

const app = new Elysia().onBeforeHandle(({cookie}) => {
    console.info('cookie', JSON.stringify(cookie));
})
    .get("/", () => "Hello Elysia")

    .get('/users', async ({status}) => {
        const result = await prisma.user.findMany();
        if (!result?.length) {
            return status(404, {message: 'User not found '});
        }
        return result;
    })
    .get('/user/:id', async ({params: {id}, status}) => {
        const result = await prisma.user.findFirst({
            where: {
                id: parseInt(id)
            },
            include: {
                posts: {
                    include: {
                        tags: true
                    }
                },
            },
        });
        if (!result) {
            return status(404, {message: 'User not found '});
        }
        return result;
    })
    .get('/user/:id/posts', async ({params: {id}, status}) => {
        const posts = await prisma.post.findMany({
            where: {
                authorId: parseInt(id)
            },
            include: {
                tags: true
            }
        });
        if (!posts.length) {
            return status(404, {message: 'Posts not found '});
        }
        return posts;
    })
    .get('/posts', async ({status}) => {
        const result = await prisma.post.findMany({
            include: {
                tags: true,
                author: true
            }
        });
        if (!result?.length) {
            return status(404, {message: 'Posts not found '});
        }
        return result;
    })
    .get('/post/:id', async ({params: {id}, status}) => {
        const post = await prisma.post.findUnique({
            where: {
                id: parseInt(id)
            },
            include: {
                tags: true
            }
        });
        if (!post) {
            return status(404, {message: 'Post not found '});
        }
        return post;
    })
    .post('/tag-connect', async ({ body, status }) => {
        console.info('body', body);
        const result = await prisma.tag.update({
            data: {
                posts: {
                    connect: body.postIds.map( id => ({ id: parseInt(id) }))
                }
            },
            where: {
              id: body.tagId
            },
            select: {
                name: true,
                id: true
            }
        }).catch(() => {
            return status(400, 'Bad req')
        });
        if (!result) {
            return status(400, 'Bad req')
        }
        return result;
    }, {
        body: t.Object({
            tagId: t.Number(),
            postIds: t.Array(t.String())
        })
    })
    .get('/tags', async ({status}) => {
        const tags = await prisma.tag.findMany({
        });
        if (!tags?.length) {
            return status(404, {message: 'Tags not found '});
        }
        return tags;
    }).get('/tag/:id', async ({params: {id}, status}) => {
        const tag = await prisma.tag.findUnique({
            where: {
                id: parseInt(id)
            },
            include: {
                posts: {
                    select: {
                        title: true
                    }
                }
            }
        });
        if (!tag) {
            return status(404, {message: 'Tag not found '});
        }
        return tag;
    })
    .listen(3000);

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
