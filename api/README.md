# Screenshot Extractor Service

An autonomous browser agent that extracts screenshots based on specified flows using OpenAI's GPT-4 Vision and Stagehand browser automation.

## Features

- Autonomous web navigation and screenshot capture
- Multiple flow types supported:
  - Product screenshots
  - Checkout process
  - Cart pages
  - Registration forms
  - Login pages
  - Home pages
- GPT-4 Vision powered analysis and decision making
- Configurable maximum steps and timeouts
- Detailed action logging and context tracking

## Prerequisites

- Node.js 18 or higher
- OpenAI API key
- TypeScript

## Installation

1. Clone the repository
2. Install dependencies:

```bash
cd apps/api
npm install
```

3. Create a `.env` file with your OpenAI API key:

```bash
ENTERPRISE_OPENAI_API_KEY=your_api_key_here
```

## Usage

The service can be used by creating an instance of `ScreenshotOrchestratorService` and executing tasks:

```typescript
import { ScreenshotOrchestratorService } from "./services/screenshot-extractor/orchestrator.service";
import { FlowType } from "./models/chargeflow.schema";

const orchestrator = new ScreenshotOrchestratorService(process.env.ENTERPRISE_OPENAI_API_KEY);

// Initialize the service
await orchestrator.initialize();

// Create a task
const task = {
	flowType: FlowType.PRODUCT_SCREENSHOT,
	initialQuery: "iPhone 15 Pro Max Amazon product page",
	maxSteps: 5,
};

// Execute the task
const results = await orchestrator.executeTask(task);

// Close the service when done
await orchestrator.close();
```

## Flow Types

The service supports various flow types defined in `FlowType`:

- `PRODUCT_SCREENSHOT`: Captures product details pages
- `CHECKOUT_SCREENSHOT`: Captures checkout process pages
- `CART_SCREENSHOT`: Captures shopping cart pages
- `REGISTER_SCREENSHOT`: Captures registration forms
- `LOGIN_SCREENSHOT`: Captures login pages
- `HOME_SCREENSHOT`: Captures homepage layouts

## Architecture

The service consists of three main components:

1. **OpenAI Service**: Handles communication with GPT-4 Vision API for screenshot analysis and decision making
2. **Browser Service**: Manages browser automation using Stagehand
3. **Orchestrator Service**: Coordinates between OpenAI and browser services to execute tasks

## Development

To run the example:

```bash
npm start
```

To build the project:

```bash
npm run build
```

To run tests:

```bash
npm test
```

## Error Handling

The service includes comprehensive error handling:

- Browser automation errors
- OpenAI API errors
- Task execution timeouts
- Invalid actions or selectors

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
