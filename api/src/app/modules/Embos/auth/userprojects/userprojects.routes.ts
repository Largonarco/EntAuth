import { Router } from "express";
import BaseRouter from "app/modules/Base/Route";
import { secure } from "app/middlewares/authenticate";
import UserProjectController from "./userprojects.controller";

export default class UserProjectRouter extends BaseRouter<UserProjectController> {
	constructor(router: Router) {
		super(router, "/user-projects", new UserProjectController());
	}

	init() {
		this.route("get", "/", this.controller.getUserProjectRelations, [secure]);
		this.route("get", "/:id", this.controller.getUserProjectRelation, [secure]);
		this.route("post", "/", this.controller.createUserProjectRelation, [secure]);
		this.route("put", "/:id", this.controller.updateUserProjectRelation, [secure]);
		this.route("delete", "/:id", this.controller.deleteUserProjectRelation, [secure]);

		return this.router;
	}
}
