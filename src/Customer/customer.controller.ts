import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

   // Get all category (protected)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAll() {
    return this.customerService.getAll();
  }

@Get(':id')
  findById(@Param('id') id: string) {
    return this.customerService.findById(Number(id));
  }

  @Post()
  async createCustomer(@Body() body: { first_name: string; last_name: string; email: string; password: string; phone_number?: number }) {
    return this.customerService.createCustomer(
        body.first_name,
        body.last_name,
        body.email,
        body.password,
        body.phone_number
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updatecustomer(@Param('id') id: number, @Body() body: any) {
    return this.customerService.updateCustomer(id, body);
  }

  
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async removecustomer(@Param('id') id: number) {
    return this.customerService.deleteCustomer(+id);
  }
}