import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
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

  // Static routes MUST remain ABOVE @Get(':id')
  @UseGuards(JwtAuthGuard)
  @Get('items/all')
  getAllOrderItems() {
    return this.ordersService.getAllOrderItems();
  }

  @UseGuards(JwtAuthGuard)
  @Get('items/my-items')
  async getMyOrderItems(@Request() req: any) {
    const customerId = await this.ordersService.resolveCustomerId(req.user);
    return this.ordersService.getMyOrderItems(customerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  async getMyOrders(@Request() req: any) {
    const customerId = await this.ordersService.resolveCustomerId(req.user);
    return this.ordersService.findByOrderId(customerId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('customer/:customerId')
  findByCustomerId(@Param('customerId') customerId: number) {
    return this.ordersService.findByOrderId(Number(customerId));
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findById(@Param('id') id: number) {
    return this.ordersService.findById(Number(id));
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(@Request() req: any, @Body() body: any) {
    const customer_id = body.customer_id
      ? Number(body.customer_id)
      : await this.ordersService.resolveCustomerId(req.user);

    return this.ordersService.createFullOrder({
      customer_id,
      address_num: body.address_num ? Number(body.address_num) : undefined,
      street: body.street,
      city: body.city,
      province: body.province,
      zip_code: body.zip_code,
      total_price: Number(body.total_price),
      order_status: body.order_status || 'Pending',
      payment_method: body.payment_method || 'Cash on Delivery',
      payment_status: body.payment_status || 'Pending',
      amount_paid: Number(body.amount_paid ?? body.total_price),
      items: Array.isArray(body.items) ? body.items : [],
    });
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateOrder(
    @Param('id') id: number,
    @Body('order_status') order_status: string,
  ) {
    return this.ordersService.updateOrder(Number(id), order_status);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('items/:itemId')
  async removeOrderItem(@Param('itemId') itemId: number) {
    return this.ordersService.deleteOrderItem(Number(itemId));
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async removeOrder(@Param('id') id: number) {
    return this.ordersService.deleteOrder(Number(id));
  }
}