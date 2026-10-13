import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { OrderItemsService } from './ordersItems.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('orderItems')
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('order/:orderId')
  async findByOrderId(@Param('orderId') orderId: number) {
    return this.orderItemsService.findByOrderId(orderId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findById(@Param('id') id: number) {
    return this.orderItemsService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: { order_id: number; product_id: number; quantity: number; price_at_purchase: number }) {
    return this.orderItemsService.createOrderItem(body.order_id, body.product_id, body.quantity, body.price_at_purchase);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
 async update(@Param('id') id: number, @Body() body: { order_item_id: number; quantity?: number; price_at_purchase?: number }) {
    return this.orderItemsService.update(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
 async delete(@Param('id') id: number) {
    return this.orderItemsService.delete(id);
  }
}