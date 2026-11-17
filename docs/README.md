# 📚 Documentation — PocketGone

Master index of this repository's documentation: **every** file in `docs/` is linked here, with one honest line about what it contains. Every closed story adds its record and links it; an unindexed document is a lost document.

> 📍 **Status discipline** — **Built** (in `main`, with evidence) · **In development** (on a branch) · **Designed** (specified, not built) · **Concept** (recorded idea). Statuses are never mixed.
>
> ⚠️ These guides describe a real penetration-testing laboratory. Authorized educational use only, in controlled environments.

## Index

| Document | What it is |
|---|---|
| [README of the repository](../README.md) | Main document: position, capabilities with status, architecture, security model, deployment and changelog. |
| [Installation guide](../INSTALLATION_GUIDE.md) | Step-by-step installation of the lab on its host. |
| [Airgeddon implementation](../AIRGEDDON_IMPLEMENTATION.md) | How the airgeddon tooling is integrated into the platform. |
| [GUI implementation](../GUI_IMPLEMENTATION.md) | Implementation notes for the console interface. |
| [Implementation plan](../IMPLEMENTATION_PLAN.md) | The plan the current implementation was built from. |
| [Implementation summary](../IMPLEMENTATION_SUMMARY.md) | Summary of what was implemented, from build time. |
| [API testing](../API_TESTING.md) | How the backend API was tested, with its cases. |
| [Validation results](../VALIDATION_RESULTS.md) | Recorded results of the all-functionality validation run (January 2026). |
| [Backend README](../backend/README.md) | Backend-specific notes, kept with the backend code. |

## Structure

```text
docs/
└── README.md                    # This master index
```

The guides stay at the repository root on purpose: the lab's own scripts (`install.sh`, `verify-installation.sh`, `validate-functionality.sh`) check for them there by name, and this standardization does not touch code. They are indexed above, expressly, as previous documents of the build. New documentation will be filed under `docs/` following the house standard (`arquitectura-y-diseno/`, `instalacion-y-despliegue/`, `operacion/`).
