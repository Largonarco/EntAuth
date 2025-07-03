import { Router } from "express";
import UserController from "./users.controller";
import BaseRouter from "app/modules/Base/Route";
import { secure } from "app/middlewares/authenticate";

export default class UserRouter extends BaseRouter<UserController> {
	constructor(router: Router) {
		super(router, "/users", new UserController());
	}

	init() {
		this.route("get", "/", this.controller.getUsers, [secure]);
		this.route("get", "/:id", this.controller.getUser, [secure]);
		this.route("post", "/", this.controller.createUser, [secure]);
		this.route("put", "/:id", this.controller.updateUser, [secure]);
		this.route("delete", "/:id", this.controller.deleteUser, [secure]);

		return this.router;
	}
}
