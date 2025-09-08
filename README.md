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

### Commands

To generate a new application, run:
```bash
nx generate @nx/nest:app --name=api-nest-service --directory="apps/backend/api-nest-service"
```
To run the application, run:
```bash
npx nx serve api-nest-service --configuration=development
```
To generate a new library, run:
```bash
nx generate @nx/js:lib ui-components
```

### Discovering Generators
You can see a list of all available generators by running `nx list`. To see the generators for a specific package, you can run `nx list <package-name>`, for example `nx list @nx/nest`.