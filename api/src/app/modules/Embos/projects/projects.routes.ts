import { Router } from "express";
import BaseRouter from "app/modules/Base/Route";
import { secure } from "app/middlewares/authenticate";
import ProjectsController from "./projects.controller";

export default class ProjectRouter extends BaseRouter<ProjectsController> {
	constructor(router: Router) {
		super(router, "/projects", new ProjectsController());
	}

	init() {
		this.route("post", "/", this.controller.createProject);
		this.route("get", "/", this.controller.getProjects, [secure]);
		this.route("get", "/current", this.controller.getCurrentProject, [secure]);
		this.route("get", "/:id", this.controller.getProject, [secure]);
		this.route("put", "/:id", this.controller.updateProject, [secure]);
		this.route("delete", "/:id", this.controller.deleteProject, [secure]);

		return this.router;
	}
}
