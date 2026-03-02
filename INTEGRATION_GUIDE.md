# Optimile ERP Integration Guide

## Architecture

- `src/main.tsx`: bootstraps React + `BrowserRouter`
- `src/App.tsx`: master route map and guards
- `src/shared`: common auth, layout, navigation, event bus, types
- `src/modules`: migrated module code

## Modules

- `tms`
- `fleet-control` (contains `tyre-intelligence` submodule)
- `ams`
- `finance`

## Shared Concepts

- Multi-tenant + RBAC modeled in `src/shared/types/index.ts`
- Navigation metadata in `src/shared/constants/navigation.ts`
- Global auth/UI state in `src/shared/context/*`
- Cross-module events in `src/shared/services/eventBus.ts`

## Routing Strategy

`src/App.tsx` defines all module route namespaces:

- `/tms/*`
- `/fleet/*`
- `/ams/*`
- `/finance/*`

Each route currently renders a placeholder and can be replaced with real module components per migration map.
