import { createHandler } from "./http.mjs";
import { createService } from "./service.mjs";
export const handle = createHandler(createService());
