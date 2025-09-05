# Microservices Starter

This project is a monorepo for a microservices application, managed by Nx.

## Project Structure

The monorepo is organized into the following top-level directories:

-   `apps/`: Contains the deployable applications.
    -   `backend/`: For backend services.
    -   `frontend/`: For frontend applications.
-   `packages/`: Contains shared libraries and modules.
-   `infrastructure/`: Contains infrastructure as code (e.g., Kubernetes, Terraform).
-   `docs/`: Contains project documentation.

## Development

### Generating Applications

To generate an application, you'll use the `--directory` flag to specify the subdirectory within the `apps` folder.

**Backend Apps:**

For example, to create a new NestJS application named `auth-service` in `apps/backend`, you would run:

```bash
nx generate @nx/nest:app auth-service --directory=backend
```

**Frontend Apps:**

Similarly, to create a new React application named `web-react` in `apps/frontend`, you would run:

```bash
nx generate @nx/react:app web-react --directory=frontend
```

### Generating Libraries

Libraries will be generated directly within the `packages` directory.

For example, to create a new library named `ui-components`, you would run:

```bash
nx generate @nx/js:lib ui-components
```

This will create the library in `packages/ui-components`.

### Discovering Generators

You can see a list of all available generators by running `nx list`. To see the generators for a specific package, you can run `nx list <package-name>`, for example `nx list @nx/nest`.