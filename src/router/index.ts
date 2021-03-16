import Vue from "vue";
import store from "../store";
import VueRouter, { RouteConfig } from "vue-router";
import Home from "@/components/Home.vue";
import Login from "@/components/Login.vue";

/* All Application Components */
import Product from "@/components/Product.vue";

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/",
    name: "Home",
    component: Home
  },

  {
    path: "/login",
    name: "Login",
    component: Login
  },

  {
    path: "/products",
    name: "product",
    component: Product,
    beforeEnter: (to, from, next) => {
      document.title = "Products";
      if (!store.getters["Auth/authenticated"]) {
        return next({ name: "Login" });
      }
      next();
    }
  }

  /* ./ end Settings part */

];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
