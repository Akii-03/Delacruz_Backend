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
  BadRequestException,
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

  // MUST be placed BEFORE @Get(':id') so "my-orders" is not treated as an :id
  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  getMyOrders(@Request() req: any) {
    const customerId = req.user?.customer_id || req.user?.sub || req.user?.id;
    if (!customerId) {
      throw new BadRequestException('Customer ID not found in token.');
    }
    return this.ordersService.findByOrderId(Number(customerId));
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
    // 1. Resolve customer_id from JWT token (or fallback to body.customer_id)
    const customer_id = Number(
      body.customer_id || req.user?.customer_id || req.user?.sub || req.user?.id,
    );

    if (!customer_id) {
      throw new BadRequestException('Missing customer_id. Ensure you are logged in as a Customer.');
    }

    // 2. Pass the full checkout data (address, items, payment) to OrdersService
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
  @Delete(':id')
  async removeOrder(@Param('id') id: number) {
    return this.ordersService.deleteOrder(Number(id));
  }
}