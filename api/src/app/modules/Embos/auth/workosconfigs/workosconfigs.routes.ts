import { Router } from "express";
import BaseRouter from "app/modules/Base/Route";
import { secure } from "app/middlewares/authenticate";
import WorkOSConfigController from "./workosconfigs.controller";

export default class WorkOSConfigRouter extends BaseRouter<WorkOSConfigController> {
	constructor(router: Router) {
		super(router, "/workos-configs", new WorkOSConfigController());
	}

	init() {
		this.route("post", "/", this.controller.createWorkOSConfig);
		this.route("get", "/", this.controller.getWorkOSConfigs, [secure]);
		this.route("get", "/:id", this.controller.getWorkOSConfig, [secure]);
		this.route("put", "/:id", this.controller.updateWorkOSConfig, [secure]);
		this.route("delete", "/:id", this.controller.deleteWorkOSConfig, [secure]);

		return this.router;
	}
}
