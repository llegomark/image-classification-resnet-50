# Image Classification with Microsoft Vision Model ResNet-50

The Microsoft Vision Model ResNet-50 is a powerful pretrained vision model created by the Multimedia Group at Microsoft Bing. It is a 50-layer deep convolutional neural network (CNN) trained on more than 1 million images from ImageNet. By leveraging multi-task learning and optimizing separately for four datasets, including ImageNet-22k, Microsoft COCO, and two web-supervised datasets containing 40 million image-label pairs, the model achieves state-of-the-art performance in image classification tasks.

This project utilizes the Hono framework to build a Cloudflare Worker that exposes an API endpoint for image classification. It integrates with Cloudflare AI to run the Microsoft Vision Model ResNet-50 and classify images based on either image URLs or file uploads.

## Technologies Used

- **Hono**: A lightweight web framework for building fast and scalable applications on Cloudflare Workers.
- **Cloudflare Workers**: A serverless execution environment that allows running JavaScript and TypeScript code at the edge, close to users.
- **Cloudflare AI**: A set of APIs and tools provided by Cloudflare for integrating AI capabilities into applications.

## Features

- Accepts both image URLs and file uploads for classification.
- Validates input using Zod schema validation.
- Supports CORS and CSRF protection middleware.
- Implements JWT authentication middleware for secure access to the API.
- Handles errors gracefully and returns appropriate error responses.

## API Endpoint

- **URL**: `/api/classify`
- **Method**: `POST`
- **Authentication**: JWT token required in the `Authorization` header.
- **Request Body**: JSON array of image objects, each containing either a `url` or `file` property.
  - `url`: The URL of the image to classify (optional).
  - `file`: The uploaded image file to classify (optional).
- **Response**: JSON object containing an array of classification responses for each image.

## Usage

1. Set up a Cloudflare Worker and configure the necessary environment variables:

   - `AI`: Your Cloudflare AI API token.
   - `JWT_SECRET`: The secret key used for JWT authentication.

2. Deploy the worker code to your Cloudflare Worker.

3. Make a POST request to the `/api/classify` endpoint with the following payload:

   ```json
   [
   	{
   		"url": "https://example.com/image1.jpg"
   	},
   	{
   		"file": "<uploaded_file>"
   	}
   ]
   ```

   Replace `<uploaded_file>` with the actual file upload.

   Here's an example cURL command to classify an image using a URL:

   ```bash
   curl -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <your-jwt-token>" -d '[{"url": "https://example.com/image1.jpg"}]' https://your-worker-url.com/api/classify
   ```

   And here's an example cURL command to classify an image using a file upload:

   ```bash
   curl -X POST -H "Content-Type: multipart/form-data" -H "Authorization: Bearer <your-jwt-token>" -F "file=@/path/to/image.jpg" https://your-worker-url.com/api/classify
   ```

   Replace `<your-jwt-token>` with your actual JWT token and `https://your-worker-url.com` with the URL of your deployed Cloudflare Worker.

4. The API will return a JSON response with the classification results for each image:

   ```json
   {
   	"responses": [
   		{
   			"output": [
   				{
   					"label": "dog",
   					"score": 0.9
   				},
   				{
   					"label": "animal",
   					"score": 0.8
   				}
   			]
   		},
   		{
   			"output": [
   				{
   					"label": "cat",
   					"score": 0.95
   				},
   				{
   					"label": "animal",
   					"score": 0.85
   				}
   			]
   		}
   	]
   }
   ```

## Limitations

- The Microsoft Vision Model ResNet-50 is pretrained on a specific set of image categories. It may not perform well on images outside its training domain.
- The model accepts only certain image formats, such as JPEG, PNG, and GIF. Other formats may not be supported.
- The performance of the model may vary depending on the quality and resolution of the input images.

## Contributing

Contributions are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
