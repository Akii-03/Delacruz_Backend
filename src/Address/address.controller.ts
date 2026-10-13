import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { AddressService } from './address.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

   @Post()
  async createAddress(@Body() body: { customer_id: number; street: string; city: string; province: string; zip_code: string }) {
    return this.addressService.createAddress(
        body.customer_id, 
        body.street, 
        body.city, 
        body.province, 
        body.zip_code
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  getAll() {
    return this.addressService.getAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findById(@Param('id') id: number) {
    return this.addressService.findById(id);
  }

  @Get('customer/:customer_id')
  findByUserId(@Param('customer_id') customer_id: number) {
    return this.addressService.findByUserId(customer_id);
  }


  @Put(':id')
  async updateaddress(@Param('id') id: number, @Body() body: any) {
    return this.addressService.update(id, body);
  }

  @Delete(':id')
  async removeaddress(@Param('id') id: number) {
    return this.addressService.deleteAddress(id);
  }
}