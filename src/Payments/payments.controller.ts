import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  
  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.paymentsService.findAll();
  }

 
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findById(@Param('id') id: number) {
    return this.paymentsService.findById(id);
  }


  @UseGuards(JwtAuthGuard)
  @Get('order/:orderId')
  findByOrderId(@Param('orderId') orderId: number) {
    return this.paymentsService.findByOrderId(orderId);
  }


  @UseGuards(JwtAuthGuard)
  @Post()
  async createPayment(@Body() body: { order_id: number; payment_method: string; amount_paid: number; payment_status?: string }) {
    return this.paymentsService.createPayment(body.order_id, body.payment_method, body.amount_paid, body.payment_status);
  }


 @UseGuards(JwtAuthGuard)
  @Put(':id')
  updatePayments(@Param('id') id: number, @Body() body: { payment_status: string; payment_method: string; amount_paid: number }) {
    return this.paymentsService.updatePayments(id, {
      payment_status: body.payment_status,
      amount_paid: body.amount_paid,
      payment_method: body.payment_method
    }, body.amount_paid);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async removePayments(@Param('id') id: number) {
    return this.paymentsService.deletePayments(id);
  }
}