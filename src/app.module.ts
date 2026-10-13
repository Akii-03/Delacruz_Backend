
import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { CustomerModule } from './Customer/customer.module';
import { AddressModule } from './Address/address.module';
import { CategoryModule } from './Category/category.module';
import { ProductsModule } from './Products/products.module';
import { OrdersModule } from './Orders/orders.module';
import { OrderItemsModule } from './OrderItems/ordersItems.module';
import { PaymentsModule } from './Payments/payments.module';

@Module({
  imports: [DatabaseModule, UsersModule, AuthModule, CustomerModule, AddressModule, CategoryModule, ProductsModule, OrdersModule, OrderItemsModule, PaymentsModule],
})
export class AppModule {}