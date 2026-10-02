import { createApp } from "vue";
import { createRouter, createWebHashHistory } from "vue-router";
import { churchtoolsClient } from "@churchtools/churchtools-client";
import App from "./App.vue";
import GroupPage from "./pages/GroupPage.vue";
import SignupPage from "./pages/SignupPage.vue";
import EntryPage from "./pages/EntryPage.vue";
import { baseUrl } from "./services/publicGroups";
import "./style.css";

churchtoolsClient.setBaseUrl(baseUrl);
export const KEY = import.meta.env.VITE_KEY || "wne";
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/", component: EntryPage },
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
createApp(App).use(router).mount("#app");
