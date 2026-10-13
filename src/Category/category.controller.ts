import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CategoryService } from './category.service'; // <-- Import the real service!
import { JwtAuthGuard } from '../auth/jwt-auth.guard';


@Controller('category')
export class CategoryController {
  constructor(private CategoryService: CategoryService) {}

  // Get all category (protected)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.CategoryService.getAll();
  }

  // Get single category by id (protected)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOne(@Param('id') id: number) {
    return this.CategoryService.findById(+id);
  }

@Post()
  async createCategory(@Body() body: { category_name: string; description: string}) {
    return this.CategoryService.createCategory(
      body.category_name,
      body.description,
    );
  }

  // Update category (protected)
  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async update(@Param('id') id: number, @Body() body: any) {
    return this.CategoryService.updateCategory(+id, body);
  }

  // Delete category (protected)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: number) {
    return this.CategoryService.deleteCategory(+id);
  }
}