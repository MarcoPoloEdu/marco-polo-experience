# @marco-polo/experience-edvisor

Portable Edvisor catalog for **Marco Polo Experience**: schools, programs, and weekly prices.

## Origin

Upstream lives in Marco Polo Education:

`https://github.com/MarcoPoloEdu/marcopoloeducation/tree/cursor/mpe-edvisor-portable-5222/exports/marco-polo-experience-edvisor`

This folder is a **vendored seed** shaped like that export. When GitHub access is available, replace `data/catalog.json` (and types if needed) with the upstream package — do not invent prices in Experience CMS.

## Contract

- Edvisor is the source of truth for schools, programs, and prices.
- Experience may only **enable/disable** items where `complete === true`.
- Incomplete Edvisor products must not appear in the public cotizador.

## Usage

```ts
import { loadEdvisorCatalog, listCompletePrograms } from "@marco-polo/experience-edvisor";

const catalog = loadEdvisorCatalog();
const programs = listCompletePrograms(catalog);
```
