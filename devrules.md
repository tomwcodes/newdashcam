# General Development Rules

You should do task-based development. For every task, you should write the tests, implement the code, and run the tests to make sure everything works. Use `dotnet test` to run the tests or use `dotnet test --filter "FullyQualifiedName~TypeConversionTests"` to run a specific test.

Please think step by step about whether there exists a less over-engineered and yet simpler, more elegant, and more robust solution to the problem that accords with KISS and DRY principles.

When the tests pass:
* Update the todo list to reflect the task being completed
* Update the memory file to reflect the current state of the project
* Fix any warnings or errors in the code
<!-- * Commit the changes to the repository with a descriptive commit message -->
* Update the development guidelines to reflect anything that you've learned while working on the project
* Stop and we will open a new chat for the next task

## Retain Memory

There will be a memory file for every project.

The memory file will provide context for the project, and any notes or relevant details you'd need to remember between chats.

Keep it up to date based on the project's current state. 

Do not annotate task completion in the memory file. It will be tracked in the to-do list.

## Update development guidelines

If necessary, update the development guidelines to reflect anything you've learned while working on the project.

## Environment Variables and Security

- Use environment variables for sensitive information like API keys and credentials
- Store environment variables in a .env file that is not committed to version control
- Use the dotenv package to load environment variables in Node.js applications
- Format environment variables as KEY=VALUE without quotes or JavaScript syntax
- Always provide fallback values when accessing environment variables
- Include example .env files (e.g., .env.example) in version control with placeholder values

## API Integration

- When using the Oxylabs E-Commerce Scraper API, use zip/postal codes (e.g., '10001' for New York, 'SW1A 1AA' for London) for the geo_location parameter
- Handle API errors gracefully with appropriate error messages and fallback mechanisms
- Include proper error handling for API requests to prevent application crashes
- Log API responses for debugging purposes
- When parsing API responses, implement robust property access paths with multiple fallback options
- Add detailed logging of API response structures to help diagnose parsing issues
- Use type checking and validation when extracting data from API responses
- Implement fallback values for all extracted properties to handle missing or malformed data
- Test API integrations with a variety of response formats to ensure robustness

## Marketplace-Specific Filtering

- When displaying products from multiple marketplaces (e.g., amazon.com, amazon.co.uk), ensure products only appear in their respective marketplace sections
- Always check if a product has the required data (price, URL) for a specific marketplace before displaying it in that marketplace's section
- Implement proper filtering in the filterProducts function to exclude products that don't have data for the selected marketplace
- When merging product data from different sources, maintain separate price and URL fields for each marketplace

## Advanced Filtering with Multi-Select Dropdowns

- Use a structured approach for specification filtering with category:property:value format (e.g., "video:hdr", "physical:fov:140")
- Implement checkbox dropdowns for multi-select filtering to allow users to select multiple specifications simultaneously
- Group related specifications into logical categories (e.g., Video, Physical, Connectivity, Features)
- Display selected filters as removable tags to improve user experience
- Ensure URL parameters include all selected specifications for shareable filtered views
- Update SEO metadata (title, description) based on selected specifications
- Implement proper event delegation for dynamically added filter tags
- Use debouncing for filter operations that may be triggered frequently
- Ensure the dropdown closes when clicking outside to follow standard UI patterns
