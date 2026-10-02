import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import { churchtoolsClient } from "@churchtools/churchtools-client";
import App from "./App.vue";
import { applyConfig, defaultConfig } from "./services/config";
import { loadConfigLocation } from "./services/configStorage";
import SettingsPage from "./pages/SettingsPage.vue";
import GroupPage from "./pages/GroupPage.vue";
import SignupPage from "./pages/SignupPage.vue";
import EntryPage from "./pages/EntryPage.vue";
import { baseUrl } from "./services/publicGroups";
import "./fonts.css";
import "./host.css";
import appStyles from "./style.css?inline";

churchtoolsClient.setBaseUrl(baseUrl);
export const KEY = import.meta.env.VITE_KEY || "group-pages-studio";
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", component: EntryPage },
    { path: "/admin/settings", name: "settings", component: SettingsPage },
    {
      path: "/:homepageHash/:groupIds+",
      name: "group",
      component: GroupPage,
      children: [{ path: "anmeldung", name: "signup", component: SignupPage }],
    },
    { path: "/:pathMatch(.*)*", component: EntryPage },
  ],
  scrollBehavior: () => ({ top: 0 }),
});
const host = document.getElementById("group-pages-studio-root");
if (!host) throw new Error("Der Einstiegspunkt der Extension fehlt.");
const shadow = host.shadowRoot ?? host.attachShadow({ mode: "open" });
shadow.replaceChildren();
const styles = document.createElement("style");
styles.textContent = appStyles;
const mount = document.createElement("div");
mount.id = "app";
shadow.append(styles, mount);
document.body.classList.add("group-pages-studio-active");
applyConfig(defaultConfig);
createApp(App).use(router).mount(mount);
// Public config never uses an administrator session or blocks group rendering.
void loadConfigLocation()
  .then((stored) => {
    if (stored.config) applyConfig(stored.config);
  })
  .catch(() => {
    /* Missing or unreadable config keeps the bundled defaults. */
  });
