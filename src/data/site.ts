import { reactive } from 'vue'
import data from './data'
import serviceDetails from './serviceDetails'

/**
 * The site's copy as one tree, for the Apotome editor kit.
 *
 * This site was already disciplined: every page and component reads its
 * words from data.ts or serviceDetails.ts rather than hardcoding them in a
 * template. So there is nothing to lift and nothing to rewrite. Both objects
 * are reactive at their source and composed here BY REFERENCE, which is what
 * makes the integration free: the kit patches this tree, the patch lands on
 * the very objects the pages already import, and every screen re-renders
 * without a single component knowing anything happened.
 *
 * Copying them in here instead would have produced a tree the editor could
 * edit and nobody rendered.
 */
export const content = reactive({
  site: data,
  services: serviceDetails,
})
