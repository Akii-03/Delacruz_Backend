import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

 
  @UseGuards(JwtAuthGuard)
  @Post()
  async createProduct(@Body() body: { category_id: number; product_name: string; description: string; price: number; stock_qty: number }) {
    return this.productsService.createProduct (
        body.category_id,
        body.product_name,
        body.price,
        body.description,
        body.stock_qty
    );
    }

 
  @UseGuards(JwtAuthGuard)
  @Get()
  getAll() {
    return this.productsService.getAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findById(@Param('id') id: number) {
    return this.productsService.findById(id);
  }

  @Get('customer/:customer_id')
  findByUserId(@Param('customer_id') customer_id: number) {
    return this.productsService.findByUserId(customer_id);
  }


  @Put(':id')
  async updateProducts(@Param('id') id: number, @Body() body: any) {
    return this.productsService.updateProducts(id, body);
  }

  @Delete(':id')
  async removeProduct(@Param('id') id: number) {
    return this.productsService.deleteProducts(id);
  }

}