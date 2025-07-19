## Admin (Frontend - Vite + TypeScript)
1.  **Component Structure**: Organize components within `src/components` by feature or type (e.g., `ui/`, `layout/`, `features/`).
2.  **State Management**: Use a modern state management library like **Zustand/Redux Toolkit** (if using React).
3.  **API Communication**: Centralize API calls in a dedicated `src/services` or `src/api` directory. Use a library like `axios` for robust request/response handling.
4.  **Styling**: Continue using **Tailwind CSS**. Define design tokens (colors, fonts, spacing) in `tailwind.config.js` to ensure UI consistency. For complex or reused element styles, create custom components.

## Backend (Node.js + Express.js)
1.  **Architecture**: Enhance the current MVC structure by introducing a **Service Layer**.
    *   **`routes`**: Define API endpoints.
    *   **`controllers`**: Handle incoming requests and outgoing responses.
    *   **`services`**: Contain the core business logic.
    *   **`models`**: Define database schemas and interactions.
2.  **Validation**: Use a library like **`zod`** or **`joi`** in a middleware to validate all incoming request data (body, params, query).
3.  **Error Handling**: Implement a single, centralized error-handling middleware to catch and format all errors consistently.
4.  **Security**: Use **`helmet`** to apply essential security headers and continue using `.env` files for all secrets and configurations.

## Code Styling Preferences (Both Projects)
1.  **Formatting**: Use **Prettier** for automatic, consistent code formatting.
2.  **Naming Conventions**:
    *   **`camelCase`** for variables, functions, and files.
    *   **`PascalCase`** for classes and UI components.
    *   **`UPPER_SNAKE_CASE`** for constants.
3.  **Imports**: Group and sort imports: 1. External libraries, 2. Absolute paths, 3. Relative paths.
4.  **Asynchronous Code**: Use `async/await` for all asynchronous operations.