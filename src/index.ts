import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { jwt } from 'hono/jwt';
import { csrf } from 'hono/csrf';
import { MiddlewareHandler } from 'hono';
// @ts-ignore
import { Ai } from './vendor/@cloudflare/ai.js';

type Bindings = {
	AI: string;
	JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('/api/*', cors());
app.use('/api/*', csrf());

const authMiddleware: MiddlewareHandler = async (c, next) => {
	try {
		const jwtMiddleware = jwt({
			secret: c.env.JWT_SECRET,
		});
		return jwtMiddleware(c, next);
	} catch (error) {
		return c.json({ error: 'Unauthorized' }, 401);
	}
};

const acceptedFormats = ['jpg', 'jpeg', 'webp', 'png', 'gif'];
const ImageSchema = z
	.object({
		url: z
			.string()
			.url()
			.refine(
				(url) => {
					const fileExtension = url.split('.').pop()?.toLowerCase();
					return fileExtension ? acceptedFormats.includes(fileExtension) : false;
				},
				{
					message: 'Only jpg, jpeg, webp, png, and gif image URLs are allowed',
				}
			)
			.optional(),
		file: z
			.instanceof(File)
			.refine(
				(file) => {
					const fileExtension = file.name.split('.').pop()?.toLowerCase();
					return fileExtension ? acceptedFormats.includes(fileExtension) : false;
				},
				{
					message: 'Only jpg, jpeg, webp, png, and gif file formats are allowed',
				}
			)
			.optional(),
	})
	.refine((data) => data.url || data.file, {
		message: 'Either url or file must be provided',
	});

const ImagesSchema = z.array(ImageSchema);

app.post('/api/classify/:model?', authMiddleware, zValidator('json', ImagesSchema), async (c) => {
	const model = c.req.param('model');
	const images = c.req.valid('json');
	const promises = images.map(async (image) => {
		let blob: ArrayBuffer;
		try {
			if (image.url) {
				const imageResponse = await fetch(image.url);
				blob = await imageResponse.arrayBuffer();
			} else if (image.file) {
				blob = await image.file.arrayBuffer();
			} else {
				throw new Error('Invalid image');
			}

			const ai = new Ai(c.env.AI);
			const inputs = {
				image: [...new Uint8Array(blob)],
			};

			const classificationResponse = await ai.run('@cf/microsoft/resnet-50', inputs);

			let analysisResponse;
			if (model === 'llama') {
				const messages = [
					{
						role: 'system',
						content: 'You are an AI assistant that analyzes image classification results.',
					},
					{
						role: 'user',
						content: `Please analyze the following image classification JSON output and provide a summary:\n\n${JSON.stringify(
							classificationResponse
						)}`,
					},
				];
				analysisResponse = await ai.run('@cf/meta/llama-2-7b-chat-int8', { messages, max_tokens: 256 });
			} else if (model === 'gemma') {
				const prompt = `Analyze the following image classification JSON output and provide a summary:\n\n${JSON.stringify(
					classificationResponse
				)}`;
				analysisResponse = await ai.run('@cf/google/gemma-7b-it-lora', {
					prompt,
					max_tokens: 256,
					raw: true,
				});
			}

			return {
				classification: classificationResponse,
				analysis: analysisResponse,
			};
		} catch (error: unknown) {
			if (error instanceof Error) {
				return {
					error: 'Failed to process image',
					message: error.message,
				};
			} else {
				return {
					error: 'Failed to process image',
					message: 'An unknown error occurred',
				};
			}
		}
	});

	const responses = await Promise.all(promises);
	return c.json({ responses });
});

export default app;
