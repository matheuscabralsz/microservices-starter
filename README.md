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

## Development Commands

### Global Commands
- Generate a new project: `nx generate @nx/nest:app --name=api-nest-service --directory="apps/backend/api-nest-service"`

### Project-Specific Commands

#### api-nest-service
- Build: `npx nx build api-nest-service`
- Test: `npx nx test api-nest-service`
- Run: `npx nx serve api-nest-service`
- Clean: `npx nx run api-nest-service:clean`

#### api-java-service
- Build: `npx nx build api-java-service`
- Test: `npx nx test api-java-service`
- Run: `npx nx serve api-java-service`
- Clean: `npx nx run api-java-service:clean`

### Discovering Generators
You can see a list of all available generators by running `nx list`. To see the generators for a specific package, you can run `nx list <package-name>`, for example `nx list @nx/nest`.