import { Controller, Get, Post, Delete, Param } from '@nestjs/common';

import { ProjectsService } from './projects.service';

@Controller('admin/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get('users')
  findUsers() {
    return this.projectsService.findUsers();
  }

  @Post(':farmId/users/:userId')
  addUser(@Param('farmId') farmId: string, @Param('userId') userId: string) {
    return this.projectsService.addUser(farmId, userId);
  }

  @Delete(':farmId/users/:userId')
  removeUser(@Param('farmId') farmId: string, @Param('userId') userId: string) {
    return this.projectsService.removeUser(farmId, userId);
  }
}
