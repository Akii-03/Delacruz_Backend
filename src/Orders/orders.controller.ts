import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getAll() {
    return this.ordersService.getAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findById(@Param('id') id: number) {
    return this.ordersService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('customer/:customerId')
  findByOrderId(@Param('customer_id') customer_id: number) {
    return this.ordersService.findByOrderId(customer_id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(@Body() body: { customer_id: number; address_num: number; total_price: number; order_status?: string }) {
    const { customer_id, address_num, total_price, order_status } = body;
    return this.ordersService.createOrder(customer_id, address_num, total_price, order_status);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateOrder(@Param('id') id: number, @Body('order_status') order_status: string) {
    return this.ordersService.updateOrder(id, order_status);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async removeOrder(@Param('id') id: number) {
    return this.ordersService.deleteOrder(id);
  }
}